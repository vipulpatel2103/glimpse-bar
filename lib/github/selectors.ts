// Pure selectors over PullRequest[]. No side effects, no storage access.

import { dayKey, startOfDay } from "../todos/dates"
import { formatDayHeading } from "./format"
import type {
  GitHubView,
  PrId,
  PrTab,
  PullRequest,
  RepoKey,
  RepoMeta
} from "./types"

export interface PrDayGroup {
  /** `YYYY-MM-DD` — stable map key. */
  key: string
  /** "Mon Apr 20 2026" — rendered as the sticky heading. */
  label: string
  /** ms epoch at midnight of that local day. */
  ts: number
  items: PullRequest[]
}

// ── Tab filtering ──────────────────────────────────────────────────────────

function isRepoEnabled(repos: RepoMeta[], repoKey: RepoKey): boolean {
  const meta = repos.find((r) => r.key === repoKey)
  // Newly-discovered repos default to enabled until persisted.
  return meta === undefined ? true : meta.enabled
}

/**
 * Returns open PRs for the given tab, filtered by repo-enabled and not-hidden,
 * sorted by updatedAt desc.
 */
export function selectByTab(
  prs: PullRequest[],
  tab: PrTab,
  repos: RepoMeta[],
  hidden: PrId[]
): PullRequest[] {
  const hiddenSet = new Set(hidden)
  return prs
    .filter((p) => !hiddenSet.has(p.id))
    .filter((p) => isRepoEnabled(repos, p.repo))
    .filter((p) => {
      if (tab === "mine")   return p.fromTab.includes("mine")
      if (tab === "review") return p.fromTab.includes("review")
      // "all" = union of both
      return p.fromTab.includes("mine") || p.fromTab.includes("review")
    })
    .sort(byUpdatedDesc)
}

/** Returns hidden PRs sorted by updatedAt desc. */
export function selectHidden(prs: PullRequest[], hidden: PrId[]): PullRequest[] {
  const hiddenSet = new Set(hidden)
  return prs.filter((p) => hiddenSet.has(p.id)).sort(byUpdatedDesc)
}

/** Returns open PRs from a specific repo, not hidden, sorted by updatedAt desc. */
export function selectByRepo(
  prs: PullRequest[],
  repoKey: RepoKey,
  hidden: PrId[],
  tab?: PrTab
): PullRequest[] {
  const hiddenSet = new Set(hidden)
  return prs
    .filter((p) => !hiddenSet.has(p.id))
    .filter((p) => p.repo === repoKey)
    .filter((p) => {
      if (!tab || tab === "all") return true
      if (tab === "mine")   return p.fromTab.includes("mine")
      if (tab === "review") return p.fromTab.includes("review")
      return true
    })
    .sort(byUpdatedDesc)
}

// ── Date grouping ──────────────────────────────────────────────────────────

/** Groups an already-sorted PullRequest[] by updatedAt day (local time). */
export function groupByDay(prs: PullRequest[]): PrDayGroup[] {
  const groups = new Map<string, PrDayGroup>()
  for (const pr of prs) {
    const key = dayKey(pr.updatedAt)
    let group = groups.get(key)
    if (!group) {
      group = {
        key,
        label: formatDayHeading(pr.updatedAt),
        ts: startOfDay(pr.updatedAt),
        items: []
      }
      groups.set(key, group)
    }
    group.items.push(pr)
  }
  // Preserve insertion order (prs already sorted by updatedAt desc, so groups
  // appear newest-first naturally).
  return Array.from(groups.values())
}

// ── Repo helpers ───────────────────────────────────────────────────────────

/** `Record<RepoKey, PullRequest[]>` — used for sidebar repo counts. */
export function groupByRepo(prs: PullRequest[]): Record<RepoKey, PullRequest[]> {
  const result: Record<RepoKey, PullRequest[]> = {}
  for (const pr of prs) {
    if (!result[pr.repo]) result[pr.repo] = []
    result[pr.repo].push(pr)
  }
  return result
}

/**
 * Merges newly-seen repos from a sync into the persisted list.
 * New repos are enabled by default.
 */
export function discoverRepos(
  prs: PullRequest[],
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

// ── Counts ─────────────────────────────────────────────────────────────────

export interface PrCounts {
  mine: number
  review: number
  all: number
  hidden: number
  byRepo: Record<RepoKey, number>
}

export function countByView(
  prs: PullRequest[],
  repos: RepoMeta[],
  hidden: PrId[]
): PrCounts {
  const mine   = selectByTab(prs, "mine",   repos, hidden).length
  const review = selectByTab(prs, "review", repos, hidden).length
  const all    = selectByTab(prs, "all",    repos, hidden).length
  const hiddenPrs = selectHidden(prs, hidden)

  const byRepo: Record<RepoKey, number> = {}
  const hiddenSet = new Set(hidden)
  for (const pr of prs) {
    if (hiddenSet.has(pr.id)) continue
    if (!isRepoEnabled(repos, pr.repo)) continue
    byRepo[pr.repo] = (byRepo[pr.repo] ?? 0) + 1
  }

  return { mine, review, all, hidden: hiddenPrs.length, byRepo }
}

// ── View resolution ────────────────────────────────────────────────────────

/**
 * Resolves the active sidebar view to a list of grouped PRs.
 * Used by PrApp to drive what PrListView renders.
 */
export function resolveView(
  prs: PullRequest[],
  view: GitHubView,
  activeTab: PrTab,
  repos: RepoMeta[],
  hidden: PrId[]
): PrDayGroup[] {
  if (view === "hidden") {
    return groupByDay(selectHidden(prs, hidden))
  }
  if (view === "mine" || view === "review" || view === "all") {
    return groupByDay(selectByTab(prs, view, repos, hidden))
  }
  // view is a RepoKey
  return groupByDay(selectByRepo(prs, view as RepoKey, hidden, activeTab))
}

// ── Helpers ────────────────────────────────────────────────────────────────

function byUpdatedDesc(a: PullRequest, b: PullRequest): number {
  return b.updatedAt - a.updatedAt
}
