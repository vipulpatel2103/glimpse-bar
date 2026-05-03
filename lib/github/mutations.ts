// Pure mutations over GitHub data. Each function returns a new array/object;
// callers persist via storage.setValue(…).

import type { PrId, PullRequest, RepoKey, RepoMeta } from "./types"

// ── Hidden set ─────────────────────────────────────────────────────────────

export function hidePr(hidden: PrId[], id: PrId): PrId[] {
  if (hidden.includes(id)) return hidden
  return [...hidden, id]
}

export function unhidePr(hidden: PrId[], id: PrId): PrId[] {
  return hidden.filter((h) => h !== id)
}

// ── Repo toggles ───────────────────────────────────────────────────────────

export function toggleRepo(repos: RepoMeta[], key: RepoKey): RepoMeta[] {
  return repos.map((r) => (r.key === key ? { ...r, enabled: !r.enabled } : r))
}

export function setRepoEnabled(
  repos: RepoMeta[],
  key: RepoKey,
  enabled: boolean
): RepoMeta[] {
  return repos.map((r) => (r.key === key ? { ...r, enabled } : r))
}

// ── PR cache merge ─────────────────────────────────────────────────────────

/**
 * Replaces the cached PR list with the incoming set from a successful sync.
 * PRs absent from `incoming` have been closed/merged and are dropped.
 * Sort: updatedAt desc; ties preserve relative order from `existing`.
 */
export function mergePrs(
  existing: PullRequest[],
  incoming: PullRequest[]
): PullRequest[] {
  if (incoming.length === 0) return incoming
  const existingRank = new Map(existing.map((p, i) => [p.id, i]))
  return [...incoming].sort((a, b) => {
    if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt
    return (existingRank.get(a.id) ?? 0) - (existingRank.get(b.id) ?? 0)
  })
}

/**
 * Patches only the mergeState field of specific PRs.
 * Used for the UNKNOWN-mergeable re-fetch after a sync.
 */
export function patchMergeState(
  prs: PullRequest[],
  patches: ReadonlyArray<{ id: PrId; mergeState: PullRequest["mergeState"] }>
): PullRequest[] {
  if (patches.length === 0) return prs
  const map = new Map(patches.map((p) => [p.id, p.mergeState]))
  return prs.map((p) => {
    const next = map.get(p.id)
    return next !== undefined ? { ...p, mergeState: next } : p
  })
}
