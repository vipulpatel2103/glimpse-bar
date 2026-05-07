// Glimpse Bar — shared PR data model.
// One canonical type per concept across all PR providers.

export type ProviderId = "github" | "bitbucket" | "gitlab" | "azure"

export type Tab = "mine" | "review" | "all"

export type CiState = "success" | "failure" | "pending" | "neutral" | "none"

export type ReviewDecision =
  | "approved"
  | "changes_requested"
  | "review_required"
  | "commented"
  | "none"

/** Widest union across all four providers. Per-provider mappers pick a subset. */
export type ReviewerState =
  | "approved"
  | "changes_requested"
  | "dismissed"
  | "commented"
  | "pending"

export type MergeState =
  | "clean"
  | "conflicting"
  | "behind"
  | "blocked"
  | "unknown"

export type OverallState = "ready" | "failed" | "blocked" | "pending" | "neutral"

export interface Reviewer {
  /** Stable identifier from the source API (login, account_id, uuid, etc.). */
  id: string
  displayName: string
  avatarUrl?: string
  state: ReviewerState
}

export interface NormalizedPr {
  /** Globally unique: `${providerId}:${nativeId}`. */
  id: string
  providerId: ProviderId

  /** Display id including any prefix, e.g. "#1234", "!45". */
  displayNumber: string
  /** Numeric component for stable sorting. */
  number: number

  title: string
  url: string

  /** Path-shaped repo/project identifier — also used as sidebar/color key. */
  repo: string
  /** Optional second-level grouping (workspace / group / org). */
  parent?: string

  author: { displayName: string; avatarUrl?: string }
  isDraft: boolean
  state: "open" | "merged" | "closed" | "declined" | "superseded"

  headRef: string
  baseRef: string

  createdAt: number
  updatedAt: number
  commentsCount: number

  reviewDecision: ReviewDecision
  reviewers: Reviewer[]

  ciState: CiState
  failingChecks: number
  totalChecks: number
  mergeState: MergeState
  overallState: OverallState

  fromTab: Array<"mine" | "review">
}

/** Sidebar view selector. `string` covers repo keys. */
export type View = Tab | "hidden" | "changes" | string

export interface PrUiState {
  activeTab: Tab
  expanded: boolean
  pinned: boolean
  sidebarCollapsed: boolean
  activeView: View
  /** Auto-refresh interval in minutes. */
  refreshIntervalMin: number
  /** Optional per-provider hierarchy state — workspace/group expand/collapse. */
  sidebarExpanded?: string[]
  lastSyncAt?: number
  lastSyncError?: string
  /** Epoch when the rate-limit chip should clear. */
  rateLimitResetAt?: number
  /** Epoch when the panel was last opened — drives unread dot. */
  lastOpenedAt?: number
}

export interface PrCounts {
  mine: number
  review: number
  all: number
  hidden: number
  /** Keyed on `pr.repo`. */
  byRepo: Record<string, number>
  /** Keyed on `pr.parent`. */
  byParent: Record<string, number>
}

// ── Change feed ─────────────────────────────────────────────────────────────

export type ChangeEventType =
  | "new_review_request"
  | "new_mine"
  | "ci_failure"
  | "ci_success"
  | "approved"
  | "changes_requested"
  | "merged"
  | "declined"
  | "conflict"

export interface NormalizedChangeEvent {
  id: string
  prId: string
  prNumber: number
  prTitle: string
  repo: string
  prUrl: string
  type: ChangeEventType
  /** Reviewer name for approved / changes_requested events. */
  detail?: string
  createdAt: number
}

/** Per-PR snapshot used to diff state between syncs. */
export type NotifBaseline = Record<
  string,
  {
    ciState: CiState
    reviewDecision: ReviewDecision
    fromTab: Array<"mine" | "review">
    mergeState: MergeState
    state: NormalizedPr["state"]
  }
>
