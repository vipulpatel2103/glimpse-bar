// Glimpse Bar — Notes data model.
// Shape is shared by content script, background SW, and options page.

export type NoteId = string

export type LabelId = string

/** Card tint. Stored as a token name (never raw hex) so theme switches re-tint. */
export type ColorToken =
  | "default"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "pink"

/** Ordered list of every color token — drives the swatch picker. */
export const COLOR_TOKENS: readonly ColorToken[] = [
  "default",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink"
] as const

export type SystemView = "all" | "pinned" | "archived"

export type NoteLayout = "grid" | "list"

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
  order: number
}

export interface Note {
  id: NoteId
  title: string
  /** Markdown source. Empty when the note is in checklist mode. */
  body: string
  /** Reserved — only "md" today. Absent is treated as "md". */
  bodyFormat?: "md"
  color: ColorToken
  labels: LabelId[]
  pinned: boolean
  archived: boolean
  /**
   * Present iff the note is in checklist mode. Mutually exclusive with a
   * non-empty `body` — toggling modes converts one into the other.
   */
  checklist?: ChecklistItem[]
  createdAt: number
  updatedAt: number
}

export interface LabelMeta {
  id: LabelId
  name: string
  createdAt: number
}

export interface NotesUiState {
  /** SystemView or a custom LabelId. */
  activeView: SystemView | LabelId
  expanded: boolean
  /** Panel-pinned (disables outside-click close). Mirrors the TODO pattern. */
  pinned: boolean
  sidebarCollapsed: boolean
  layout: NoteLayout
  /** Color applied to new notes created via composer / capture / quick-compose. */
  defaultColor: ColorToken
}

export const NOTES_UI_DEFAULT: NotesUiState = {
  activeView: "all",
  expanded: false,
  pinned: false,
  sidebarCollapsed: false,
  layout: "list",
  defaultColor: "default"
}

/** Returns true if the given view id is one of the system views. */
export function isSystemView(view: string): view is SystemView {
  return view === "all" || view === "pinned" || view === "archived"
}

/** True when a note has no displayable content (used to drop empty captures). */
export function isNoteEmpty(note: Pick<Note, "title" | "body" | "checklist">): boolean {
  if (note.title.trim()) return false
  if (note.body.trim()) return false
  if (note.checklist && note.checklist.some((c) => c.text.trim())) return false
  return true
}
