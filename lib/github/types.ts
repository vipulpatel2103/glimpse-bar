// Glimpse Bar — GitHub PR data model.
// Shared by content script, background SW, and options page.

/** Stable human-readable id: `owner/repo#number` */
export type PrId = string

/** `owner/repo` */
export type RepoKey = string

export type PrTab = "mine" | "review" | "all"

export type CiState = "success" | "failure" | "pending" | "neutral" | "none"

export type ReviewDecision =
  | "approved"
  | "changes_requested"
  | "review_required"
  | "commented"
  | "none"

export type MergeState =
  | "clean"
  | "conflicting"
  | "behind"
  | "blocked"
  | "unknown"

export type ReviewerState =
  | "approved"
  | "changes_requested"
  | "commented"
  | "dismissed"
  | "pending"

/** Derived summary used by the overall-state icon. */
export type OverallState =
  | "ready"
  | "failed"
  | "blocked"
  | "pending"
  | "neutral"

export interface Reviewer {
  login: string
  avatarUrl?: string
  state: ReviewerState
}

export interface PullRequest {
  id: PrId
  number: number
  title: string
  url: string
  repo: RepoKey
  author: string
  authorAvatarUrl?: string
  isDraft: boolean
  state: "open" | "closed" | "merged"
  headRef: string
  baseRef: string
  createdAt: number
  updatedAt: number
  commentsCount: number
  reviewDecision: ReviewDecision
  /** Latest review per reviewer + pending requested reviewers. */
  reviewers: Reviewer[]
  ciState: CiState
  /** Number of checks with a failing conclusion. */
  failingChecks: number
  totalChecks: number
  mergeState: MergeState
  /** Derived from ciState / reviewDecision / mergeState. */
  overallState: OverallState
  /** Which raw queries surfaced this PR. "all" is derived, never stored here. */
  fromTab: Array<"mine" | "review">
}

export interface RepoMeta {
  key: RepoKey
  enabled: boolean
  discoveredAt: number
}

export type GitHubView = PrTab | RepoKey | "hidden" | "changes"

export interface GitHubUiState {
  /** Active tab in the segmented control. */
  activeTab: PrTab
  expanded: boolean
  pinned: boolean
  sidebarCollapsed: boolean
  /** Active view in the sidebar (tab, repo key, "hidden", or "changes"). */
  activeView: GitHubView
  /** Auto-refresh interval in minutes (1 | 5 | 15 | 30 | 60). */
  refreshIntervalMin: number
  lastSyncAt?: number
  lastSyncError?: string
  /** Epoch when the rate-limit chip should clear. */
  rateLimitResetAt?: number
  /** Epoch when the GitHub panel was last opened — used to compute unread dot. */
  lastOpenedAt?: number
}

// ── Change feed ─────────────────────────────────────────────────────────────

export type ChangeEventType =
  | "new_review_request"
  | "new_mine"
  | "ci_failure"
  | "ci_success"
  | "approved"
  | "changes_requested"
  | "conflict"
  | "merged"

export interface ChangeEvent {
  id: string
  prId: PrId
  prNumber: number
  prTitle: string
  repo: RepoKey
  prUrl: string
  type: ChangeEventType
  /** Reviewer login for approved / changes_requested events. */
  detail?: string
  createdAt: number
}

/** Per-PR snapshot used to diff state between syncs. */
export type NotifBaseline = Record<
  PrId,
  {
    ciState: CiState
    reviewDecision: ReviewDecision
    fromTab: Array<"mine" | "review">
    mergeState: MergeState
    state: "open" | "closed" | "merged"
  }
>

export interface GitHubAuthState {
  /** PAT stored in sync: namespace. Never logged or echoed back to UI. */
  pat?: string
  login?: string
  avatarUrl?: string
  scopes?: string[]
}
