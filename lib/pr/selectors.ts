// Pure selectors over NormalizedPr[]. No side effects, no storage access.

import { dayKey, startOfDay } from "../todos/dates"
import { formatDayHeading } from "./format"
import type {
  NormalizedPr,
  PrCounts,
  Tab,
  View
} from "./types"

export interface PrDayGroup {
  /** `YYYY-MM-DD` — stable map key. */
  key: string
  /** "Mon Apr 20 2026" — rendered as the sticky heading. */
  label: string
  /** ms epoch at midnight of that local day. */
  ts: number
  items: NormalizedPr[]
}

/**
 * Per-provider gating callback. Returns true if the PR should appear in the
 * panel based on provider-specific enable/disable state (repo toggles,
 * workspace opt-in, etc.).
 *
 * Returning `() => true` from a caller skips all gating.
 */
export type PrGate = (pr: NormalizedPr) => boolean

// ── Tab filtering ──────────────────────────────────────────────────────────

/**
 * Open PRs for the given tab, gated by `gate`, minus hidden, sorted by
 * updatedAt desc.
 */
export function selectByTab(
  prs: NormalizedPr[],
  tab: Tab,
  gate: PrGate,
  hidden: string[]
): NormalizedPr[] {
  const hiddenSet = new Set(hidden)
  return prs
    .filter((p) => !hiddenSet.has(p.id))
    .filter(gate)
    .filter((p) => {
      if (tab === "mine")   return p.fromTab.includes("mine")
      if (tab === "review") return p.fromTab.includes("review")
      return p.fromTab.includes("mine") || p.fromTab.includes("review")
    })
    .sort(byUpdatedDesc)
}

/** Hidden PRs sorted by updatedAt desc. Gating intentionally skipped. */
export function selectHidden(prs: NormalizedPr[], hidden: string[]): NormalizedPr[] {
  const hiddenSet = new Set(hidden)
  return prs.filter((p) => hiddenSet.has(p.id)).sort(byUpdatedDesc)
}

/**
 * Open PRs from a specific repo (intersected with the active tab if given),
 * not hidden, sorted by updatedAt desc.
 */
export function selectByRepo(
  prs: NormalizedPr[],
  repoKey: string,
  hidden: string[],
  tab?: Tab
): NormalizedPr[] {
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

export function groupByDay(prs: NormalizedPr[]): PrDayGroup[] {
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
  return Array.from(groups.values())
}

// ── Repo / parent helpers ──────────────────────────────────────────────────

export function groupByRepo(prs: NormalizedPr[]): Record<string, NormalizedPr[]> {
  const result: Record<string, NormalizedPr[]> = {}
  for (const pr of prs) {
    if (!result[pr.repo]) result[pr.repo] = []
    result[pr.repo].push(pr)
  }
  return result
}

export function groupByParent(prs: NormalizedPr[]): Record<string, NormalizedPr[]> {
  const result: Record<string, NormalizedPr[]> = {}
  for (const pr of prs) {
    const k = pr.parent ?? ""
    if (!result[k]) result[k] = []
    result[k].push(pr)
  }
  return result
}

// ── Counts ─────────────────────────────────────────────────────────────────

export function countByView(
  prs: NormalizedPr[],
  gate: PrGate,
  hidden: string[]
): PrCounts {
  const mine   = selectByTab(prs, "mine",   gate, hidden).length
  const review = selectByTab(prs, "review", gate, hidden).length
  const all    = selectByTab(prs, "all",    gate, hidden).length
  const hiddenPrs = selectHidden(prs, hidden)

  const byRepo: Record<string, number> = {}
  const byParent: Record<string, number> = {}
  const hiddenSet = new Set(hidden)
  for (const pr of prs) {
    if (hiddenSet.has(pr.id)) continue
    if (!gate(pr)) continue
    byRepo[pr.repo] = (byRepo[pr.repo] ?? 0) + 1
    if (pr.parent) {
      byParent[pr.parent] = (byParent[pr.parent] ?? 0) + 1
    }
  }

  return { mine, review, all, hidden: hiddenPrs.length, byRepo, byParent }
}

// ── View resolution ────────────────────────────────────────────────────────

/**
 * Resolves the active sidebar view to a list of grouped PRs.
 * `changes` returns no list groups — the change feed view renders separately.
 */
export function resolveView(
  prs: NormalizedPr[],
  view: View,
  activeTab: Tab,
  gate: PrGate,
  hidden: string[]
): PrDayGroup[] {
  if (view === "hidden") {
    return groupByDay(selectHidden(prs, hidden))
  }
  if (view === "changes") {
    return []
  }
  if (view === "mine" || view === "review" || view === "all") {
    return groupByDay(selectByTab(prs, view, gate, hidden))
  }
  // view is a repo key
  return groupByDay(selectByRepo(prs, view, hidden, activeTab))
}

// ── Helpers ────────────────────────────────────────────────────────────────

function byUpdatedDesc(a: NormalizedPr, b: NormalizedPr): number {
  return b.updatedAt - a.updatedAt
}
