// Glimpse Bar — TODO data model.
// Shape is shared by content script, background SW, and options page.

export type TodoId = string

export type ListId = string

/** Hard-coded id for the built-in Inbox list. Cannot be renamed or deleted. */
export const INBOX_LIST_ID: ListId = "inbox"

export type SystemView = "today" | "upcoming" | "inbox" | "completed"

export type SortMode = "manual" | "date" | "alpha"

export type NewTaskPosition = "top" | "bottom"

export type ShowCompletedWindow = "never" | "today" | "30d" | "always"

export interface TodoItem {
  id: TodoId
  listId: ListId
  /** Present iff this is a subtask. Subtasks are exactly one level deep. */
  parentId?: TodoId
  text: string
  done: boolean
  /** ms epoch — set when `done` flips true; cleared when toggled back. */
  doneAt?: number
  createdAt: number
  updatedAt: number
  /** ms epoch (start-of-day local). `undefined` means "no date" (Inbox). */
  dueAt?: number
  /** Manual-sort position within `(listId, parentId)`. */
  order: number
  // ── Reserved for Phase 01b. Code paths must accept `undefined` silently. ──
  priority?: 1 | 2 | 3 | 4
  recurrence?: { kind: "daily" | "weekly" | "monthly"; interval: number }
  remindAt?: number
}

/** Cycling palette for auto-assigned list colors. */
export const LIST_COLORS = [
  "#22c55e", // green
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#f97316", // orange
  "#ec4899", // pink
  "#ef4444", // red
  "#eab308", // yellow
  "#3b82f6", // blue
] as const

export interface ListMeta {
  id: ListId
  name: string
  /** Hex color auto-assigned on creation. Inbox has no color. */
  color?: string
  sort: SortMode
  newTaskPosition: NewTaskPosition
  showCompleted: ShowCompletedWindow
  createdAt: number
}

export interface TodoUiState {
  /** SystemView or a custom ListId. */
  activeView: SystemView | ListId
  expanded: boolean
  pinned: boolean
  sidebarCollapsed: boolean
}

/** Default ListMeta for the built-in Inbox list. */
export function inboxDefault(): ListMeta {
  return {
    id: INBOX_LIST_ID,
    name: "Inbox",
    sort: "manual",
    newTaskPosition: "bottom",
    showCompleted: "30d",
    createdAt: 0
  }
}

/** Returns true if the given view id is one of the four system views. */
export function isSystemView(view: string): view is SystemView {
  return (
    view === "today" ||
    view === "upcoming" ||
    view === "inbox" ||
    view === "completed"
  )
}
