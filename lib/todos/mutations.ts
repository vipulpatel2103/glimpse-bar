// Pure CRUD over TodoItem[] / ListMeta[]. Each function returns a new array;
// callers persist via `todosItem.setValue(...)` / `listsItem.setValue(...)`.

import {
  INBOX_LIST_ID,
  LIST_COLORS,
  inboxDefault,
  type ListId,
  type ListMeta,
  type NewTaskPosition,
  type ShowCompletedWindow,
  type SortMode,
  type TodoId,
  type TodoItem
} from "./types"

export interface AddTodoOptions {
  text: string
  listId?: ListId
  parentId?: TodoId
  dueAt?: number
  /** When set on a custom list, overrides the per-list newTaskPosition. */
  position?: NewTaskPosition
  /** Defaults to `Date.now()`. */
  now?: number
}

function uid(): TodoId {
  // crypto.randomUUID is **secure-context-only** — for content scripts the
  // host page's origin determines the context, so a TODO panel rendered on
  // an http:// site has no randomUUID. crypto.getRandomValues, however,
  // is available on insecure contexts too. Build a v4 UUID by hand from it.
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function nextOrder(
  items: TodoItem[],
  listId: ListId,
  parentId: TodoId | undefined,
  position: NewTaskPosition
): number {
  const siblings = items.filter(
    (t) => t.listId === listId && t.parentId === parentId
  )
  if (siblings.length === 0) return 0
  if (position === "top") {
    const min = Math.min(...siblings.map((t) => t.order))
    return min - 1
  }
  const max = Math.max(...siblings.map((t) => t.order))
  return max + 1
}

export function addTodo(
  items: TodoItem[],
  lists: ListMeta[],
  opts: AddTodoOptions
): { items: TodoItem[]; created: TodoItem } {
  const trimmed = opts.text.trim()
  if (!trimmed) throw new Error("addTodo: empty text")

  const listId = opts.listId ?? INBOX_LIST_ID
  const list = lists.find((l) => l.id === listId)
  const position: NewTaskPosition =
    opts.position ?? list?.newTaskPosition ?? "bottom"
  const now = opts.now ?? Date.now()

  const created: TodoItem = {
    id: uid(),
    listId,
    parentId: opts.parentId,
    text: trimmed,
    done: false,
    createdAt: now,
    updatedAt: now,
    dueAt: opts.dueAt,
    order: nextOrder(items, listId, opts.parentId, position)
  }

  return { items: [...items, created], created }
}

export function updateTodo(
  items: TodoItem[],
  id: TodoId,
  patch: Partial<Omit<TodoItem, "id" | "createdAt">>,
  now: number = Date.now()
): TodoItem[] {
  return items.map((t) =>
    t.id === id ? { ...t, ...patch, updatedAt: now } : t
  )
}

/** Removes a task and cascades to all its subtasks. */
export function removeTodo(items: TodoItem[], id: TodoId): TodoItem[] {
  return items.filter((t) => t.id !== id && t.parentId !== id)
}

export function toggleDone(
  items: TodoItem[],
  id: TodoId,
  now: number = Date.now()
): TodoItem[] {
  return items.map((t) => {
    if (t.id !== id) return t
    const done = !t.done
    return {
      ...t,
      done,
      doneAt: done ? now : undefined,
      updatedAt: now
    }
  })
}

/** Clones a task at the position immediately after the original. Children not duplicated. */
export function duplicateTodo(
  items: TodoItem[],
  id: TodoId,
  now: number = Date.now()
): { items: TodoItem[]; created: TodoItem | null } {
  const src = items.find((t) => t.id === id)
  if (!src) return { items, created: null }

  const created: TodoItem = {
    ...src,
    id: uid(),
    done: false,
    doneAt: undefined,
    createdAt: now,
    updatedAt: now,
    order: src.order + 0.5
  }

  // Splice in just after the source (using the +0.5 fractional order; we
  // re-normalize on next manual reorder).
  const next = [...items, created]
  return { items: next, created }
}

export function setDueAt(
  items: TodoItem[],
  id: TodoId,
  dueAt: number | undefined,
  now: number = Date.now()
): TodoItem[] {
  return updateTodo(items, id, { dueAt }, now)
}

/**
 * Compute next Today drag-drop order. `currentOrder` is the user's prior
 * ordering (may be empty). `visibleIds` is the currently-displayed Today
 * sequence (already sorted by selectToday). The returned array is a full
 * ordering of `visibleIds` with `fromId` placed before/after `toId`.
 *
 * Reconciles stale ids out of `currentOrder` and folds new ones in at their
 * default-sorted position so subsequent drags keep working.
 */
export function reorderTodayList(
  currentOrder: readonly TodoId[] | undefined,
  visibleIds: readonly TodoId[],
  fromId: TodoId,
  toId: TodoId,
  place: "before" | "after"
): TodoId[] {
  if (fromId === toId) return [...visibleIds]
  const visibleSet = new Set(visibleIds)
  if (!visibleSet.has(fromId) || !visibleSet.has(toId)) return [...visibleIds]

  // Materialize the canonical pre-drag sequence: respect currentOrder for ids
  // that are still visible, then append any visible ids not yet ranked in
  // their default-sort position (already encoded in `visibleIds`).
  const seen = new Set<TodoId>()
  const seq: TodoId[] = []
  if (currentOrder) {
    for (const id of currentOrder) {
      if (visibleSet.has(id) && !seen.has(id)) {
        seq.push(id)
        seen.add(id)
      }
    }
  }
  for (const id of visibleIds) {
    if (!seen.has(id)) {
      seq.push(id)
      seen.add(id)
    }
  }

  const without = seq.filter((id) => id !== fromId)
  const targetIdx = without.indexOf(toId)
  if (targetIdx < 0) return seq
  const insertAt = place === "before" ? targetIdx : targetIdx + 1
  without.splice(insertAt, 0, fromId)
  return without
}

/** Moves a task up (-1) or down (+1) within its `(listId, parentId)` siblings. */
export function reorderTodo(
  items: TodoItem[],
  id: TodoId,
  direction: -1 | 1
): TodoItem[] {
  const target = items.find((t) => t.id === id)
  if (!target) return items
  const siblings = items
    .filter(
      (t) => t.listId === target.listId && t.parentId === target.parentId
    )
    .sort((a, b) => a.order - b.order)
  const idx = siblings.findIndex((t) => t.id === id)
  const swapIdx = idx + direction
  if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return items

  const a = siblings[idx]
  const b = siblings[swapIdx]
  const orderMap = new Map<TodoId, number>([
    [a.id, b.order],
    [b.id, a.order]
  ])
  return items.map((t) =>
    orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id) as number } : t
  )
}

// ── Lists ───────────────────────────────────────────────────────────────

export function ensureInbox(lists: ListMeta[]): ListMeta[] {
  if (lists.some((l) => l.id === INBOX_LIST_ID)) return lists
  return [inboxDefault(), ...lists]
}

export function addList(
  lists: ListMeta[],
  name: string,
  now: number = Date.now()
): { lists: ListMeta[]; created: ListMeta } {
  const trimmed = name.trim() || "Untitled"
  // Cycle through the palette based on how many custom lists already exist.
  const customCount = lists.filter((l) => l.id !== INBOX_LIST_ID).length
  const color = LIST_COLORS[customCount % LIST_COLORS.length]
  const created: ListMeta = {
    id: uid(),
    name: trimmed,
    color,
    sort: "manual",
    newTaskPosition: "bottom",
    showCompleted: "30d",
    createdAt: now
  }
  return { lists: [...lists, created], created }
}

export function renameList(
  lists: ListMeta[],
  id: ListId,
  name: string
): ListMeta[] {
  if (id === INBOX_LIST_ID) return lists
  const trimmed = name.trim()
  if (!trimmed) return lists
  return lists.map((l) => (l.id === id ? { ...l, name: trimmed } : l))
}

/** Deletes a custom list and reassigns its tasks to Inbox. Inbox itself is undeletable. */
export function removeList(
  lists: ListMeta[],
  items: TodoItem[],
  id: ListId,
  now: number = Date.now()
): { lists: ListMeta[]; items: TodoItem[] } {
  if (id === INBOX_LIST_ID) return { lists, items }
  const nextLists = lists.filter((l) => l.id !== id)
  const nextItems = items.map((t) =>
    t.listId === id
      ? { ...t, listId: INBOX_LIST_ID, dueAt: t.dueAt, updatedAt: now }
      : t
  )
  return { lists: nextLists, items: nextItems }
}

export interface ListConfigPatch {
  sort?: SortMode
  newTaskPosition?: NewTaskPosition
  showCompleted?: ShowCompletedWindow
}

export function updateListConfig(
  lists: ListMeta[],
  id: ListId,
  patch: ListConfigPatch
): ListMeta[] {
  return lists.map((l) => (l.id === id ? { ...l, ...patch } : l))
}
