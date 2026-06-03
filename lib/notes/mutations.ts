// Pure CRUD over Note[] / LabelMeta[]. Each function returns a new array;
// callers persist via `notesItem.setValue(...)` / `labelsItem.setValue(...)`.

import { clampLen, NOTE_LIMITS } from "./limits"
import { uid } from "../uid"
import type {
  ChecklistItem,
  ColorToken,
  LabelId,
  LabelMeta,
  Note,
  NoteId
} from "./types"

// ── Notes ─────────────────────────────────────────────────────────────────

export interface AddNoteInput {
  title?: string
  body?: string
  color?: ColorToken
  labels?: LabelId[]
  checklist?: ChecklistItem[]
  /** Defaults to `Date.now()`. */
  now?: number
}

export type AddNoteResult =
  | { items: Note[]; note: Note; truncated: boolean }
  | { error: "limit" }

/**
 * Append a new note. Enforces the total-notes cap (returns `{ error: 'limit' }`
 * when full) and clamps title / body to their limits (reporting `truncated`).
 */
export function addNote(items: Note[], input: AddNoteInput): AddNoteResult {
  if (items.length >= NOTE_LIMITS.TOTAL_NOTES_MAX) {
    return { error: "limit" }
  }

  const now = input.now ?? Date.now()
  const rawTitle = input.title ?? ""
  const rawBody = input.body ?? ""
  const title = clampLen(rawTitle, NOTE_LIMITS.TITLE_MAX)
  const body = clampLen(rawBody, NOTE_LIMITS.BODY_MAX)
  const truncated = title.length < rawTitle.length || body.length < rawBody.length

  const note: Note = {
    id: uid(),
    title,
    body,
    color: input.color ?? "default",
    labels: (input.labels ?? []).slice(0, NOTE_LIMITS.LABELS_PER_NOTE),
    pinned: false,
    archived: false,
    checklist: input.checklist?.slice(0, NOTE_LIMITS.CHECKLIST_PER_NOTE),
    createdAt: now,
    updatedAt: now
  }

  return { items: [...items, note], note, truncated }
}

export type NotePatch = Partial<
  Omit<Note, "id" | "createdAt" | "updatedAt">
>

export interface UpdateNoteResult {
  items: Note[]
  truncated: boolean
}

/** Patch a note. Clamps title / body and reports whether anything was truncated. */
export function updateNote(
  items: Note[],
  id: NoteId,
  patch: NotePatch,
  now: number = Date.now()
): UpdateNoteResult {
  let truncated = false
  const next = items.map((n) => {
    if (n.id !== id) return n
    const merged: Note = { ...n, ...patch, updatedAt: now }
    if (patch.title !== undefined) {
      const clamped = clampLen(patch.title, NOTE_LIMITS.TITLE_MAX)
      if (clamped.length < patch.title.length) truncated = true
      merged.title = clamped
    }
    if (patch.body !== undefined) {
      const clamped = clampLen(patch.body, NOTE_LIMITS.BODY_MAX)
      if (clamped.length < patch.body.length) truncated = true
      merged.body = clamped
    }
    if (patch.labels !== undefined) {
      merged.labels = patch.labels.slice(0, NOTE_LIMITS.LABELS_PER_NOTE)
    }
    return merged
  })
  return { items: next, truncated }
}

export function removeNote(items: Note[], id: NoteId): Note[] {
  return items.filter((n) => n.id !== id)
}

export function togglePin(
  items: Note[],
  id: NoteId,
  now: number = Date.now()
): Note[] {
  return items.map((n) =>
    n.id === id ? { ...n, pinned: !n.pinned, updatedAt: now } : n
  )
}

export function toggleArchive(
  items: Note[],
  id: NoteId,
  now: number = Date.now()
): Note[] {
  return items.map((n) =>
    n.id === id
      ? { ...n, archived: !n.archived, pinned: false, updatedAt: now }
      : n
  )
}

export function setColor(
  items: Note[],
  id: NoteId,
  color: ColorToken,
  now: number = Date.now()
): Note[] {
  return items.map((n) => (n.id === id ? { ...n, color, updatedAt: now } : n))
}

export function setLabels(
  items: Note[],
  id: NoteId,
  labels: LabelId[],
  now: number = Date.now()
): Note[] {
  const capped = labels.slice(0, NOTE_LIMITS.LABELS_PER_NOTE)
  return items.map((n) =>
    n.id === id ? { ...n, labels: capped, updatedAt: now } : n
  )
}

/** Clone a note. Fresh id + timestamps; never pinned / archived; no shared refs. */
export function duplicateNote(
  items: Note[],
  id: NoteId,
  now: number = Date.now()
): { items: Note[]; note: Note | null } {
  if (items.length >= NOTE_LIMITS.TOTAL_NOTES_MAX) return { items, note: null }
  const src = items.find((n) => n.id === id)
  if (!src) return { items, note: null }

  const note: Note = {
    ...src,
    id: uid(),
    pinned: false,
    archived: false,
    labels: [...src.labels],
    checklist: src.checklist?.map((c) => ({ ...c, id: uid() })),
    createdAt: now,
    updatedAt: now
  }
  return { items: [...items, note], note }
}

// ── Checklist mode ──────────────────────────────────────────────────────────

const CHECK_LINE = /^\s*[-*]\s*\[( |x|X)\]\s?(.*)$/

/** Parse `- [ ] item` lines out of a Markdown body into checklist items. */
export function bodyToChecklist(body: string): ChecklistItem[] {
  const out: ChecklistItem[] = []
  let order = 0
  for (const line of body.split("\n")) {
    const m = CHECK_LINE.exec(line)
    if (m) {
      out.push({
        id: uid(),
        text: clampLen(m[2].trim(), NOTE_LIMITS.CHECKLIST_ITEM_MAX),
        done: m[1].toLowerCase() === "x",
        order: order++
      })
    } else if (line.trim()) {
      out.push({
        id: uid(),
        text: clampLen(line.trim(), NOTE_LIMITS.CHECKLIST_ITEM_MAX),
        done: false,
        order: order++
      })
    }
    if (out.length >= NOTE_LIMITS.CHECKLIST_PER_NOTE) break
  }
  return out
}

/** Serialize a checklist back to `- [ ] item` Markdown. */
export function checklistToBody(checklist: ChecklistItem[]): string {
  return [...checklist]
    .sort((a, b) => a.order - b.order)
    .map((c) => `- [${c.done ? "x" : " "}] ${c.text}`)
    .join("\n")
}

/**
 * Toggle a note between Markdown-body mode and checklist mode. Converting on
 * parses the body into items; converting off serializes items back to body so
 * nothing is lost.
 */
export function setChecklistMode(
  items: Note[],
  id: NoteId,
  on: boolean,
  now: number = Date.now()
): Note[] {
  return items.map((n) => {
    if (n.id !== id) return n
    if (on) {
      if (n.checklist) return n
      return {
        ...n,
        checklist: bodyToChecklist(n.body),
        body: "",
        updatedAt: now
      }
    }
    if (!n.checklist) return n
    return {
      ...n,
      body: clampLen(checklistToBody(n.checklist), NOTE_LIMITS.BODY_MAX),
      checklist: undefined,
      updatedAt: now
    }
  })
}

function mapChecklist(
  items: Note[],
  id: NoteId,
  now: number,
  fn: (list: ChecklistItem[]) => ChecklistItem[]
): Note[] {
  return items.map((n) => {
    if (n.id !== id || !n.checklist) return n
    return { ...n, checklist: fn(n.checklist), updatedAt: now }
  })
}

export function addChecklistItem(
  items: Note[],
  id: NoteId,
  text: string,
  now: number = Date.now()
): Note[] {
  const trimmed = text.trim()
  if (!trimmed) return items
  return mapChecklist(items, id, now, (list) => {
    if (list.length >= NOTE_LIMITS.CHECKLIST_PER_NOTE) return list
    const order = list.length ? Math.max(...list.map((c) => c.order)) + 1 : 0
    return [
      ...list,
      {
        id: uid(),
        text: clampLen(trimmed, NOTE_LIMITS.CHECKLIST_ITEM_MAX),
        done: false,
        order
      }
    ]
  })
}

export function toggleChecklistItem(
  items: Note[],
  id: NoteId,
  ciId: string,
  now: number = Date.now()
): Note[] {
  return mapChecklist(items, id, now, (list) =>
    list.map((c) => (c.id === ciId ? { ...c, done: !c.done } : c))
  )
}

export function updateChecklistItem(
  items: Note[],
  id: NoteId,
  ciId: string,
  text: string,
  now: number = Date.now()
): Note[] {
  return mapChecklist(items, id, now, (list) =>
    list.map((c) =>
      c.id === ciId
        ? { ...c, text: clampLen(text, NOTE_LIMITS.CHECKLIST_ITEM_MAX) }
        : c
    )
  )
}

export function removeChecklistItem(
  items: Note[],
  id: NoteId,
  ciId: string,
  now: number = Date.now()
): Note[] {
  return mapChecklist(items, id, now, (list) =>
    list.filter((c) => c.id !== ciId)
  )
}

/** Move a checklist item up (-1) or down (+1) within its note. */
export function reorderChecklistItem(
  items: Note[],
  id: NoteId,
  ciId: string,
  direction: -1 | 1,
  now: number = Date.now()
): Note[] {
  return mapChecklist(items, id, now, (list) => {
    const sorted = [...list].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((c) => c.id === ciId)
    const swapIdx = idx + direction
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return list
    const a = sorted[idx]
    const b = sorted[swapIdx]
    const orderOf = new Map<string, number>([
      [a.id, b.order],
      [b.id, a.order]
    ])
    return list.map((c) =>
      orderOf.has(c.id) ? { ...c, order: orderOf.get(c.id) as number } : c
    )
  })
}

// ── Labels ──────────────────────────────────────────────────────────────────

export type AddLabelResult =
  | { labels: LabelMeta[]; label: LabelMeta }
  | { error: "duplicate" }

/** Create a label. Rejects a case-insensitive duplicate name. */
export function addLabel(
  labels: LabelMeta[],
  name: string,
  now: number = Date.now()
): AddLabelResult {
  const trimmed = name.trim()
  if (!trimmed) return { error: "duplicate" }
  const exists = labels.some(
    (l) => l.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (exists) return { error: "duplicate" }
  const label: LabelMeta = { id: uid(), name: trimmed, createdAt: now }
  return { labels: [...labels, label], label }
}

export function renameLabel(
  labels: LabelMeta[],
  id: LabelId,
  name: string
): LabelMeta[] {
  const trimmed = name.trim()
  if (!trimmed) return labels
  return labels.map((l) => (l.id === id ? { ...l, name: trimmed } : l))
}

/** Delete a label and strip it from every note's `labels[]`. */
export function removeLabel(
  labels: LabelMeta[],
  items: Note[],
  id: LabelId,
  now: number = Date.now()
): { labels: LabelMeta[]; items: Note[] } {
  const nextLabels = labels.filter((l) => l.id !== id)
  const nextItems = items.map((n) =>
    n.labels.includes(id)
      ? { ...n, labels: n.labels.filter((l) => l !== id), updatedAt: now }
      : n
  )
  return { labels: nextLabels, items: nextItems }
}
