// Pure mutations over shared PR data. Each function returns a new array/object;
// callers persist via storage.setValue(...).

import type { CiState, MergeState, NormalizedPr } from "./types"

// ── Hidden set ─────────────────────────────────────────────────────────────

export function hidePr(hidden: string[], id: string): string[] {
  if (hidden.includes(id)) return hidden
  return [...hidden, id]
}

export function unhidePr(hidden: string[], id: string): string[] {
  return hidden.filter((h) => h !== id)
}

// ── PR cache merge ─────────────────────────────────────────────────────────

/**
 * Replaces the cached PR list with the incoming set from a successful sync.
 * PRs absent from `incoming` have transitioned to a non-open state and are dropped.
 * Sort: updatedAt desc; ties preserve relative order from `existing`.
 */
export function mergePrs(
  existing: NormalizedPr[],
  incoming: NormalizedPr[]
): NormalizedPr[] {
  if (incoming.length === 0) return incoming
  const existingRank = new Map(existing.map((p, i) => [p.id, i]))
  return [...incoming].sort((a, b) => {
    if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt
    return (existingRank.get(a.id) ?? 0) - (existingRank.get(b.id) ?? 0)
  })
}

// ── Targeted patches (used by provider-specific secondary fetches) ─────────

/** Patch only the mergeState field of specific PRs. */
export function patchMergeState(
  prs: NormalizedPr[],
  patches: ReadonlyArray<{ id: string; mergeState: MergeState }>
): NormalizedPr[] {
  if (patches.length === 0) return prs
  const map = new Map(patches.map((p) => [p.id, p.mergeState]))
  return prs.map((p) => {
    const next = map.get(p.id)
    return next !== undefined ? { ...p, mergeState: next } : p
  })
}

/** Patch CI fields after a secondary statuses fetch. */
export function patchCiState(
  prs: NormalizedPr[],
  patches: ReadonlyArray<{
    id: string
    ciState: CiState
    failingChecks: number
    totalChecks: number
  }>
): NormalizedPr[] {
  if (patches.length === 0) return prs
  const map = new Map(patches.map((p) => [p.id, p]))
  return prs.map((p) => {
    const next = map.get(p.id)
    return next !== undefined
      ? {
          ...p,
          ciState: next.ciState,
          failingChecks: next.failingChecks,
          totalChecks: next.totalChecks
        }
      : p
  })
}
