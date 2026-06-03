// Pure selectors over a Note[]. No side effects, no storage access.
// Cheap enough to call inside `useMemo` keyed on (items, labels).

import { stripMd } from "./markdown"
import type { LabelId, LabelMeta, Note, SystemView } from "./types"

function byUpdatedDesc(a: Note, b: Note): number {
  return b.updatedAt - a.updatedAt
}

/** All non-archived notes, pinned first, each group sorted by `updatedAt` desc. */
export function selectAll(items: Note[]): Note[] {
  const live = items.filter((n) => !n.archived)
  const pinned = live.filter((n) => n.pinned).sort(byUpdatedDesc)
  const others = live.filter((n) => !n.pinned).sort(byUpdatedDesc)
  return [...pinned, ...others]
}

/** Pinned, non-archived notes. */
export function selectPinned(items: Note[]): Note[] {
  return items
    .filter((n) => n.pinned && !n.archived)
    .sort(byUpdatedDesc)
}

/** Archived notes. */
export function selectArchived(items: Note[]): Note[] {
  return items.filter((n) => n.archived).sort(byUpdatedDesc)
}

/** Non-archived notes carrying a given label. */
export function selectByLabel(items: Note[], labelId: LabelId): Note[] {
  return items
    .filter((n) => !n.archived && n.labels.includes(labelId))
    .sort(byUpdatedDesc)
}

/**
 * Substring search over title + body + checklist text + assigned label names.
 * Case-insensitive, no fuzzy / no ranking. Returns `updatedAt` desc.
 *
 * `scope` lets the caller search within the active view's set (e.g. only
 * archived notes while the Archived view is open).
 */
export function searchNotes(
  scope: Note[],
  query: string,
  labels: LabelMeta[]
): Note[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...scope].sort(byUpdatedDesc)

  const labelName = new Map(labels.map((l) => [l.id, l.name.toLowerCase()] as const))

  return scope
    .filter((n) => {
      if (n.title.toLowerCase().includes(q)) return true
      if (n.body.toLowerCase().includes(q)) return true
      if (n.checklist?.some((c) => c.text.toLowerCase().includes(q))) return true
      if (n.labels.some((id) => labelName.get(id)?.includes(q))) return true
      return false
    })
    .sort(byUpdatedDesc)
}

/** Counts for the header dropdown / sidebar. */
export function countByView(
  items: Note[],
  labels: LabelMeta[]
): {
  all: number
  pinned: number
  archived: number
  perLabel: Record<LabelId, number>
} {
  const all = items.filter((n) => !n.archived).length
  const pinned = items.filter((n) => n.pinned && !n.archived).length
  const archived = items.filter((n) => n.archived).length

  const perLabel: Record<LabelId, number> = {}
  for (const label of labels) {
    perLabel[label.id] = items.filter(
      (n) => !n.archived && n.labels.includes(label.id)
    ).length
  }

  return { all, pinned, archived, perLabel }
}

/** Resolve the note set for a given view id (system view or label id). */
export function selectByView(
  items: Note[],
  view: SystemView | LabelId
): Note[] {
  switch (view) {
    case "all":
      return selectAll(items)
    case "pinned":
      return selectPinned(items)
    case "archived":
      return selectArchived(items)
    default:
      return selectByLabel(items, view)
  }
}

/** Cheap plaintext preview for a card (first slice of stripped body). */
export function notePreview(note: Note, max = 280): string {
  const text = stripMd(note.body)
  return text.length > max ? text.slice(0, max) : text
}
