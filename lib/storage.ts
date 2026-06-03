import { storage } from "@wxt-dev/storage"

import type { AppId } from "./apps/types"
export type { AppId }
import type { GitHubAuthState, RepoMeta } from "./github/types"
import type {
  BbAuthState,
  BbRepoMeta,
  BbWorkspaceMeta
} from "./bitbucket/types"
import type {
  NormalizedChangeEvent,
  NormalizedPr,
  NotifBaseline,
  PrUiState
} from "./pr/types"
import { inboxDefault } from "./todos/types"
import type { ListMeta, TodoItem, TodoUiState } from "./todos/types"
import { NOTES_UI_DEFAULT } from "./notes/types"
import type { LabelMeta, Note, NotesUiState } from "./notes/types"

export type Position = { x: number; y: number }
export type Edge = "left" | "right"

export const BAR_WIDTH = 44
export const BAR_HEIGHT = 220
export const PANEL_WIDTH = 360
export const PANEL_WIDTH_EXPANDED = 720
export const PANEL_GAP = 4

export const positionItem = storage.defineItem<Position>("local:gb-position", {
  fallback: { x: 0, y: 0 }
})

export const edgeItem = storage.defineItem<Edge>("local:gb-edge", {
  fallback: "right"
})

export const transparencyItem = storage.defineItem<number>(
  "local:gb-transparency",
  { fallback: 0.6 }
)

export const activeAppItem = storage.defineItem<AppId | null>(
  "local:gb-active-app",
  { fallback: null }
)

/** App IDs the user has hidden from the Glimpse Bar. "settings" is never hidden. */
export const hiddenAppsItem = storage.defineItem<AppId[]>(
  "local:gb-hidden-apps",
  { fallback: [] }
)

// ── TODO phase storage ──────────────────────────────────────────────────

export const todosItem = storage.defineItem<TodoItem[]>("local:gb-todos", {
  fallback: []
})

export const listsItem = storage.defineItem<ListMeta[]>("local:gb-lists", {
  fallback: [inboxDefault()]
})

export const todoUiItem = storage.defineItem<TodoUiState>(
  "local:gb-todo-ui",
  {
    fallback: {
      activeView: "today",
      expanded: false,
      pinned: false,
      sidebarCollapsed: false
    }
  }
)

// ── Notes phase storage ─────────────────────────────────────────────────

export const notesItem = storage.defineItem<Note[]>("local:gb-notes", {
  fallback: []
})

export const labelsItem = storage.defineItem<LabelMeta[]>(
  "local:gb-note-labels",
  { fallback: [] }
)

export const notesUiItem = storage.defineItem<NotesUiState>(
  "local:gb-notes-ui",
  { fallback: NOTES_UI_DEFAULT }
)

// ── Shared PR cache fallback (used by every provider's UI item) ─────────────

const PR_UI_FALLBACK: PrUiState = {
  activeTab: "review",
  expanded: false,
  pinned: false,
  sidebarCollapsed: false,
  activeView: "review",
  refreshIntervalMin: 5
}

// ── GitHub PRs phase storage ────────────────────────────────────────────────
//
// Auth + hierarchy items keep their original keys (provider-specific shapes).
// Cache + UI + change-feed items bumped to `-v2` for the Phase 02.2 refactor:
// the in-memory shape changed to the shared NormalizedPr / PrUiState model,
// so the old data can't be read by the new code.

export const githubAuthItem = storage.defineItem<GitHubAuthState>(
  "sync:gb-github-auth",
  { fallback: {} }
)

export const githubPrsItem = storage.defineItem<NormalizedPr[]>(
  "local:gb-github-prs-v2",
  { fallback: [] }
)

export const githubReposItem = storage.defineItem<RepoMeta[]>(
  "local:gb-github-repos",
  { fallback: [] }
)

export const githubHiddenItem = storage.defineItem<string[]>(
  "local:gb-github-hidden",
  { fallback: [] }
)

export const githubUiItem = storage.defineItem<PrUiState>(
  "local:gb-github-ui-v2",
  { fallback: PR_UI_FALLBACK }
)

export const githubChangesItem = storage.defineItem<NormalizedChangeEvent[]>(
  "local:gb-github-changes-v2",
  { fallback: [] }
)

export const githubNotifBaselineItem = storage.defineItem<NotifBaseline>(
  "local:gb-github-notif-baseline-v2",
  { fallback: {} }
)

// ── Bitbucket PRs phase storage ─────────────────────────────────────────────

export const bitbucketAuthItem = storage.defineItem<BbAuthState>(
  "sync:gb-bb-auth",
  { fallback: {} }
)

export const bitbucketPrsItem = storage.defineItem<NormalizedPr[]>(
  "local:gb-bb-prs-v2",
  { fallback: [] }
)

export const bitbucketWorkspacesItem = storage.defineItem<BbWorkspaceMeta[]>(
  "local:gb-bb-workspaces",
  { fallback: [] }
)

export const bitbucketReposItem = storage.defineItem<BbRepoMeta[]>(
  "local:gb-bb-repos",
  { fallback: [] }
)

export const bitbucketHiddenItem = storage.defineItem<string[]>(
  "local:gb-bb-hidden",
  { fallback: [] }
)

export const bitbucketUiItem = storage.defineItem<PrUiState>(
  "local:gb-bb-ui-v2",
  { fallback: PR_UI_FALLBACK }
)

export const bitbucketChangesItem = storage.defineItem<NormalizedChangeEvent[]>(
  "local:gb-bb-changes-v2",
  { fallback: [] }
)

export const bitbucketNotifBaselineItem = storage.defineItem<NotifBaseline>(
  "local:gb-bb-notif-baseline-v2",
  { fallback: {} }
)
