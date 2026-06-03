// Pure formatting + status-meta helpers shared by every PR provider.
// No side effects, no storage access.

import type {
  CiState,
  MergeState,
  NormalizedPr,
  OverallState,
  ReviewDecision,
  ReviewerState
} from "./types"

// ── Repo color palette ─────────────────────────────────────────────────────
// Deterministic color per repo key so the same repo always gets the same
// color across panel renders.

const REPO_COLORS = [
  "#22c55e", // green
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#f97316", // orange
  "#ec4899", // pink
  "#ef4444", // red
  "#eab308", // yellow
  "#3b82f6", // blue
  "#14b8a6", // teal
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#10b981"  // emerald
] as const

export function getRepoColor(key: string): string {
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) & 0xffffffff
  }
  return REPO_COLORS[Math.abs(h) % REPO_COLORS.length]
}

// ── Relative time ──────────────────────────────────────────────────────────

const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export function formatRelative(ts: number, now: number): string {
  const diff = now - ts
  if (diff < MIN) return "just now"
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)}d ago`
  const d = new Date(ts)
  return `${SHORT_MONTH[d.getMonth()]} ${d.getDate()}`
}

export function formatAgoShort(ts: number, now: number): string {
  const diff = now - ts
  if (diff < MIN) return "now"
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`
  return `${Math.floor(diff / DAY)}d ago`
}

// ── Day heading ────────────────────────────────────────────────────────────

const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
const SHORT_MONTH = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
] as const

/** "Mon Apr 20 2026" — used for sticky date-group headings. */
export function formatDayHeading(ts: number): string {
  const d = new Date(ts)
  return `${SHORT_DAY[d.getDay()]} ${SHORT_MONTH[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`
}

// ── Avatar ─────────────────────────────────────────────────────────────────

/** First two characters of a name, upper-cased — avatar initials fallback. */
export function initialsOf(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

// ── Branch label ───────────────────────────────────────────────────────────

export function branchLabel(head: string, base: string): string {
  return `${head} → ${base}`
}

// ── Status metadata ────────────────────────────────────────────────────────

export type StatusColor = "success" | "warning" | "error" | "info" | "neutral"

export interface StatusMeta {
  color: StatusColor
  /** Lucide icon name (PascalCase). */
  icon: string
  label: string
}

export function ciStatusMeta(state: CiState): StatusMeta {
  switch (state) {
    case "success":
      return { color: "success", icon: "Check", label: "CI" }
    case "failure":
      return { color: "error", icon: "X", label: "CI" }
    case "pending":
      return { color: "warning", icon: "CircleDot", label: "CI" }
    case "neutral":
      return { color: "neutral", icon: "Minus", label: "CI" }
    case "none":
      return { color: "neutral", icon: "Minus", label: "CI" }
  }
}

/** Returns null when no chip should be shown (commented / none). */
export function reviewStatusMeta(decision: ReviewDecision): StatusMeta | null {
  switch (decision) {
    case "approved":
      return { color: "success", icon: "Check", label: "Approved" }
    case "changes_requested":
      return { color: "warning", icon: "Pencil", label: "Changes requested" }
    case "review_required":
      return { color: "info", icon: "CircleHelp", label: "Review required" }
    case "commented":
    case "none":
      return null
  }
}

/** Returns null for clean/behind/unknown. */
export function mergeStateMeta(state: MergeState): StatusMeta | null {
  if (state === "conflicting") {
    return { color: "error", icon: "AlertTriangle", label: "Conflicts" }
  }
  return null
}

export function draftMeta(): StatusMeta {
  return { color: "info", icon: "FileEdit", label: "Draft" }
}

export function overallStateMeta(state: OverallState): StatusMeta {
  switch (state) {
    case "ready":
      return { color: "success", icon: "Check", label: "Ready to merge" }
    case "failed":
      return { color: "error", icon: "X", label: "CI failing" }
    case "blocked":
      return { color: "warning", icon: "AlertTriangle", label: "Blocked" }
    case "pending":
      return { color: "warning", icon: "Clock", label: "Pending" }
    case "neutral":
      return { color: "neutral", icon: "Minus", label: "No status" }
  }
}

/** Ring color token for a reviewer's state. */
export function reviewerRingColor(state: ReviewerState): StatusColor {
  switch (state) {
    case "approved":          return "success"
    case "changes_requested": return "warning"
    case "dismissed":         return "error"
    case "commented":         return "info"
    case "pending":           return "neutral"
  }
}

// ── Overall state derivation ───────────────────────────────────────────────

/**
 * Default derivation rule. Providers that diverge (e.g. Bitbucket has no
 * `blocked` because mergeState is always `unknown`) can call this and the
 * result will land on `pending` instead of `blocked` naturally.
 */
export function deriveOverallState(pr: NormalizedPr): OverallState {
  if (pr.ciState === "failure") return "failed"
  if (pr.mergeState === "conflicting") return "blocked"
  if (pr.reviewDecision === "changes_requested") return "blocked"
  if (pr.ciState === "pending") return "pending"
  if (pr.reviewDecision === "review_required") return "pending"
  if (pr.isDraft) return "pending"
  if (
    pr.reviewDecision === "approved" &&
    (pr.ciState === "success" || pr.ciState === "neutral" || pr.ciState === "none") &&
    (pr.mergeState === "clean" || pr.mergeState === "behind" || pr.mergeState === "unknown")
  ) {
    return "ready"
  }
  return "neutral"
}
