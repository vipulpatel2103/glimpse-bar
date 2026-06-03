// Background-SW sync orchestrator. Runs in the service worker only.
// Reads/writes storage; calls api.ts for network.

import { mergePrs, patchMergeState } from "../pr/mutations"
import { appendChanges, buildBaseline, diffPrState } from "../pr/notif"
import {
  githubAuthItem,
  githubChangesItem,
  githubNotifBaselineItem,
  githubPrsItem,
  githubReposItem,
  githubUiItem
} from "../storage"
import {
  RateLimitError,
  fetchPrSnapshot,
  recheckMergeableWithMap
} from "./api"
import type { RepoMeta } from "./types"

export interface SyncOptions {
  manual: boolean
}

/**
 * Module-level mutex. Alarm tick, panel auto-sync on mount, and manual
 * refresh can fire runSync concurrently — without serialization their
 * writes race and the baseline diff would double-emit events.
 *
 * Coalesce: while one sync is in flight, other callers join the same
 * promise. Cleared in the finally block.
 */
let inFlight: Promise<void> | null = null

export async function runSync(opts: SyncOptions): Promise<void> {
  if (inFlight) return inFlight
  inFlight = doSync(opts).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function doSync(_opts: SyncOptions): Promise<void> {
  const auth = await githubAuthItem.getValue()
  if (!auth.pat) return

  try {
    const { viewer, prs, unknownMergeableNodeIds, nodeIdToPrId } =
      await fetchPrSnapshot(auth.pat)

    const existing = await githubPrsItem.getValue()
    const merged   = mergePrs(existing, prs)
    await githubPrsItem.setValue(merged)

    const existingRepos = await githubReposItem.getValue()
    await githubReposItem.setValue(discoverRepos(merged, existingRepos))

    const baseline = await githubNotifBaselineItem.getValue()
    const isFirstSync = Object.keys(baseline).length === 0
    if (!isFirstSync) {
      const events = diffPrState(baseline, merged)
      if (events.length > 0) {
        const existingChanges = await githubChangesItem.getValue()
        await githubChangesItem.setValue(appendChanges(existingChanges, events))
      }
    }
    await githubNotifBaselineItem.setValue(buildBaseline(merged))

    await githubAuthItem.setValue({
      ...auth,
      login:     viewer.login,
      avatarUrl: viewer.avatarUrl
    })

    await githubUiItem.setValue({
      ...(await githubUiItem.getValue()),
      lastSyncAt:        Date.now(),
      lastSyncError:     undefined,
      rateLimitResetAt:  undefined
    })

    if (unknownMergeableNodeIds.length > 0) {
      void recheckUnknown(auth.pat, unknownMergeableNodeIds, nodeIdToPrId)
    }
  } catch (err) {
    const ui = await githubUiItem.getValue()
    if (err instanceof RateLimitError) {
      await githubUiItem.setValue({
        ...ui,
        lastSyncError:    "Rate limited by GitHub",
        rateLimitResetAt: err.resetAt
      })
    } else {
      await githubUiItem.setValue({
        ...ui,
        lastSyncError: err instanceof Error ? err.message : String(err)
      })
    }
  }
}

async function recheckUnknown(
  pat: string,
  nodeIds: string[],
  nodeIdToPrId: Map<string, string>
): Promise<void> {
  await delay(8_000)

  try {
    const patches = await recheckMergeableWithMap(pat, nodeIds, nodeIdToPrId)
    if (patches.length === 0) return

    const current = await githubPrsItem.getValue()
    await githubPrsItem.setValue(patchMergeState(current, patches))
  } catch {
    // Non-critical: UNKNOWN persists until next full sync.
  }
}

// ── Repo discovery — scoped to GitHub-specific RepoMeta ────────────────────

function discoverRepos(
  prs: ReadonlyArray<{ repo: string }>,
  existing: RepoMeta[],
  now: number = Date.now()
): RepoMeta[] {
  const seen = new Set(existing.map((r) => r.key))
  const added: RepoMeta[] = []
  for (const pr of prs) {
    if (!seen.has(pr.repo)) {
      seen.add(pr.repo)
      added.push({ key: pr.repo, enabled: true, discoveredAt: now })
    }
  }
  if (added.length === 0) return existing
  return [...existing, ...added].sort((a, b) => a.key.localeCompare(b.key))
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
