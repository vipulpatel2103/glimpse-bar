// Pure CRUD over TodoItem[] / ListMeta[]. Each function returns a new array;
// callers persist via `todosItem.setValue(...)` / `listsItem.setValue(...)`.

import {
  INBOX_LIST_ID,
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
  // crypto.randomUUID is available in MV3 SW + content + options on all
  // target browsers (Chrome 92+, Edge 92+, Firefox 95+).
  return crypto.randomUUID()
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
  const created: ListMeta = {
    id: uid(),
    name: trimmed,
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
