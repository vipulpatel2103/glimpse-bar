// Background-SW sync orchestrator. Runs in the service worker only.
// Reads/writes storage; calls api.ts for network.

import { mergePrs, patchCiState } from "../pr/mutations"
import { appendChanges, buildBaseline, diffPrState } from "../pr/notif"
import type { NormalizedPr } from "../pr/types"
import {
  bitbucketAuthItem,
  bitbucketChangesItem,
  bitbucketNotifBaselineItem,
  bitbucketPrsItem,
  bitbucketReposItem,
  bitbucketUiItem,
  bitbucketWorkspacesItem
} from "../storage"
import {
  BitbucketRateLimitError,
  credsFromAuth,
  fetchPrStatuses,
  fetchPrsForRepo,
  getViewer,
  type CiPatch
} from "./api"
import type { BbRepoMeta, BbWorkspaceSlug } from "./types"

export interface BbSyncOptions {
  manual: boolean
}

const REPO_FETCH_CONCURRENCY = 5
const STATUS_FETCH_CONCURRENCY = 5

export async function runSync(_opts: BbSyncOptions): Promise<void> {
  const auth = await bitbucketAuthItem.getValue()
  const creds = credsFromAuth(auth)
  if (!creds) return

  try {
    const viewer = await getViewer(creds)
    const accountId = viewer.accountId

    const workspaces = await bitbucketWorkspacesItem.getValue()
    const enabledWorkspaceSlugs = new Set(
      workspaces.filter((w) => w.enabled).map((w) => w.slug)
    )

    if (enabledWorkspaceSlugs.size === 0) {
      await bitbucketAuthItem.setValue({
        ...auth,
        accountId,
        nickname:    viewer.nickname,
        displayName: viewer.displayName,
        avatarUrl:   viewer.avatarUrl
      })
      const ui = await bitbucketUiItem.getValue()
      await bitbucketUiItem.setValue({
        ...ui,
        lastSyncError:    "Enable a workspace in Options to start syncing.",
        rateLimitResetAt: undefined
      })
      return
    }

    const repos = await bitbucketReposItem.getValue()
    const enabledRepos = repos.filter(
      (r) => r.enabled && enabledWorkspaceSlugs.has(r.workspace)
    )

    // ── Per-repo combined Mine + Review fetch ────────────────────────────
    // Atlassian retired the cross-workspace `/2.0/pullrequests/{accountId}`
    // endpoint (now 404). Each repo gets ONE request with a combined `q=...OR...`
    // filter; the API mapper tags fromTab per PR.
    const perRepo = await runWithConcurrency(
      enabledRepos,
      REPO_FETCH_CONCURRENCY,
      async (repo) => {
        const slug = stripWorkspace(repo.key, repo.workspace)
        try {
          return await fetchPrsForRepo(creds, repo.workspace, slug, accountId)
        } catch (err) {
          if (err instanceof BitbucketRateLimitError) throw err
          // Per-repo errors don't kill the sync — next tick retries.
          return []
        }
      }
    )
    const merged = dedupePrs(perRepo.flat())

    // ── CI rollup: only PRs whose updatedAt advanced since baseline ──────
    const baseline = await bitbucketNotifBaselineItem.getValue()
    const existingPrs = await bitbucketPrsItem.getValue()
    const isFirstSync = Object.keys(baseline).length === 0
    const updatedSinceLast = pickPrsNeedingCi(merged, existingPrs, isFirstSync)

    const ciPatches = await runWithConcurrency(
      updatedSinceLast,
      STATUS_FETCH_CONCURRENCY,
      async (pr) => {
        try {
          const slug = stripWorkspace(pr.repo, pr.parent ?? "")
          const patch = await fetchPrStatuses(creds, pr.parent ?? "", slug, pr.number)
          return { id: pr.id, ...patch }
        } catch {
          return null
        }
      }
    )
    const validPatches = ciPatches.filter(
      (p): p is { id: string } & CiPatch => p !== null
    )

    const withCi = patchCiState(merged, validPatches)

    // ── Persist: PRs, repos, auth ─────────────────────────────────────────
    const sorted = mergePrs(existingPrs, withCi)
    await bitbucketPrsItem.setValue(sorted)

    const updatedRepos = discoverRepos(sorted, workspaces, repos)
    if (updatedRepos !== repos) {
      await bitbucketReposItem.setValue(updatedRepos)
    }

    await bitbucketAuthItem.setValue({
      ...auth,
      accountId,
      nickname:    viewer.nickname,
      displayName: viewer.displayName,
      avatarUrl:   viewer.avatarUrl
    })

    if (!isFirstSync) {
      const events = diffPrState(baseline, sorted)
      if (events.length > 0) {
        const existingChanges = await bitbucketChangesItem.getValue()
        await bitbucketChangesItem.setValue(appendChanges(existingChanges, events))
      }
    }
    await bitbucketNotifBaselineItem.setValue(buildBaseline(sorted))

    const ui = await bitbucketUiItem.getValue()
    await bitbucketUiItem.setValue({
      ...ui,
      lastSyncAt:        Date.now(),
      lastSyncError:     undefined,
      rateLimitResetAt:  undefined
    })
  } catch (err) {
    const ui = await bitbucketUiItem.getValue()
    if (err instanceof BitbucketRateLimitError) {
      await bitbucketUiItem.setValue({
        ...ui,
        lastSyncError:    "Rate limited by Bitbucket",
        rateLimitResetAt: err.resetAt
      })
    } else {
      await bitbucketUiItem.setValue({
        ...ui,
        lastSyncError: err instanceof Error ? err.message : String(err)
      })
    }
  }
}

export async function discoverWorkspaceRepos(
  workspace: BbWorkspaceSlug
): Promise<void> {
  const auth = await bitbucketAuthItem.getValue()
  const creds = credsFromAuth(auth)
  if (!creds) return

  const { listReposInWorkspace } = await import("./api")
  const fullNames = await listReposInWorkspace(creds, workspace)

  const existing = await bitbucketReposItem.getValue()
  const existingMap = new Map(existing.map((r) => [r.key, r]))
  const now = Date.now()

  const merged: BbRepoMeta[] = [...existing]
  for (const fullName of fullNames) {
    if (existingMap.has(fullName)) continue
    // Default OFF — user picks which repos to sync. Bitbucket workspaces can
    // contain hundreds of repos; auto-enabling all of them would burn the
    // 1000-req/hr budget on PRs the user doesn't care about.
    merged.push({
      key:          fullName,
      workspace,
      enabled:      false,
      discoveredAt: now
    })
  }
  merged.sort((a, b) => a.key.localeCompare(b.key))
  await bitbucketReposItem.setValue(merged)
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function stripWorkspace(key: string, workspace: BbWorkspaceSlug): string {
  if (!workspace) return key
  const prefix = `${workspace}/`
  return key.startsWith(prefix) ? key.slice(prefix.length) : key
}

/**
 * Dedupe PRs by id, merging fromTab arrays when the same PR shows up in
 * results from multiple repos (shouldn't happen in normal Bitbucket setups —
 * a PR lives in one repo — but safe against pagination or fork edge cases).
 */
function dedupePrs(all: NormalizedPr[]): NormalizedPr[] {
  const map = new Map<string, NormalizedPr>()
  for (const pr of all) {
    const existing = map.get(pr.id)
    if (existing) {
      const tabs = new Set([...existing.fromTab, ...pr.fromTab])
      map.set(pr.id, { ...existing, fromTab: Array.from(tabs) })
    } else {
      map.set(pr.id, pr)
    }
  }
  return Array.from(map.values())
}

function pickPrsNeedingCi(
  next: NormalizedPr[],
  existing: NormalizedPr[],
  isFirstSync: boolean
): NormalizedPr[] {
  if (isFirstSync) return next
  const existingByPr = new Map(existing.map((p) => [p.id, p]))
  const out: NormalizedPr[] = []
  for (const pr of next) {
    const prev = existingByPr.get(pr.id)
    if (!prev || prev.updatedAt < pr.updatedAt || prev.ciState === "none") {
      out.push(pr)
    }
  }
  return out
}

function discoverRepos(
  prs: ReadonlyArray<NormalizedPr>,
  workspaces: ReadonlyArray<{ slug: string; enabled: boolean }>,
  existing: BbRepoMeta[],
  now: number = Date.now()
): BbRepoMeta[] {
  const enabledWorkspaces = new Set(
    workspaces.filter((w) => w.enabled).map((w) => w.slug)
  )
  const seen = new Set(existing.map((r) => r.key))
  const added: BbRepoMeta[] = []
  for (const pr of prs) {
    if (!pr.parent || !enabledWorkspaces.has(pr.parent)) continue
    if (!seen.has(pr.repo)) {
      seen.add(pr.repo)
      // Default OFF — user opts in. (Same rule as discoverWorkspaceRepos.)
      added.push({
        key: pr.repo,
        workspace: pr.parent,
        enabled: false,
        discoveredAt: now
      })
    }
  }
  if (added.length === 0) return existing
  return [...existing, ...added].sort((a, b) => a.key.localeCompare(b.key))
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  let cursor = 0
  const workers: Promise<void>[] = []

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const idx = cursor++
      results[idx] = await fn(items[idx])
    }
  }

  const n = Math.min(limit, items.length)
  for (let i = 0; i < n; i++) workers.push(worker())
  await Promise.all(workers)
  return results
}
