// Pure selectors over a TodoItem[]. No side effects, no storage access.
// Designed to be cheap enough to call inside `useMemo` keyed on items + bucket.

import {
  addDays,
  dayKey,
  endOfDay,
  startOfDay
} from "./dates"
import {
  INBOX_LIST_ID,
  type ListId,
  type ListMeta,
  type ShowCompletedWindow,
  type SortMode,
  type SystemView,
  type TodoItem
} from "./types"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function notDeleted(t: TodoItem): boolean {
  // Reserved hook for soft-delete semantics. For v1 every item in the array
  // is live; this guard makes adding tombstones cheap later.
  return true
}

function rootOnly(t: TodoItem): boolean {
  return !t.parentId
}

/** Today bucket: due ≤ end-of-today AND not done AND root-level. */
export function selectToday(items: TodoItem[], now: number): TodoItem[] {
  const cutoff = endOfDay(now)
  return items
    .filter(notDeleted)
    .filter(rootOnly)
    .filter((t) => !t.done && t.dueAt !== undefined && t.dueAt <= cutoff)
    .sort(byDueThenOrder)
}

export interface UpcomingGroup {
  /** dayKey, e.g. `2026-04-30` */
  key: string
  /** ms epoch at start-of-day */
  ts: number
  items: TodoItem[]
}

/** Upcoming bucket: dueAt in (endOfToday, endOfToday + 7d], grouped by day. */
export function selectUpcoming(items: TodoItem[], now: number): UpcomingGroup[] {
  const todayEnd = endOfDay(now)
  const horizon = addDays(todayEnd, 7)
  const filtered = items
    .filter(notDeleted)
    .filter(rootOnly)
    .filter(
      (t) =>
        !t.done &&
        t.dueAt !== undefined &&
        t.dueAt > todayEnd &&
        t.dueAt <= horizon
    )
    .sort(byDueThenOrder)

  const groups = new Map<string, UpcomingGroup>()
  for (const item of filtered) {
    const key = dayKey(item.dueAt as number)
    let group = groups.get(key)
    if (!group) {
      group = { key, ts: startOfDay(item.dueAt as number), items: [] }
      groups.set(key, group)
    }
    group.items.push(item)
  }
  return Array.from(groups.values()).sort((a, b) => a.ts - b.ts)
}

/** Inbox: no due date, default list, root-level, not done. */
export function selectInbox(items: TodoItem[]): TodoItem[] {
  return items
    .filter(notDeleted)
    .filter(rootOnly)
    .filter(
      (t) => !t.done && t.dueAt === undefined && t.listId === INBOX_LIST_ID
    )
    .sort((a, b) => a.order - b.order)
}

/** Root-level tasks in a custom (or built-in) list, not done. */
export function selectList(
  items: TodoItem[],
  listId: ListId,
  list?: ListMeta
): TodoItem[] {
  const sortMode: SortMode = list?.sort ?? "manual"
  const filtered = items
    .filter(notDeleted)
    .filter(rootOnly)
    .filter((t) => !t.done && t.listId === listId)

  switch (sortMode) {
    case "alpha":
      return [...filtered].sort((a, b) =>
        a.text.localeCompare(b.text, undefined, { sensitivity: "base" })
      )
    case "date":
      return [...filtered].sort(byDueThenOrder)
    case "manual":
    default:
      return [...filtered].sort((a, b) => a.order - b.order)
  }
}

/** Completed view, throttled by the per-list show-completed window. */
export function selectCompleted(
  items: TodoItem[],
  list: ListMeta | undefined,
  now: number
): TodoItem[] {
  const window = list?.showCompleted ?? "30d"
  const filtered = items
    .filter(notDeleted)
    .filter(rootOnly)
    .filter((t) => t.done && t.doneAt !== undefined)
    .filter((t) => withinWindow(t.doneAt as number, now, window))
  return filtered.sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0))
}

/** All completed root tasks across every list, throttled to the longest window. */
export function selectCompletedAll(
  items: TodoItem[],
  lists: ListMeta[],
  now: number
): TodoItem[] {
  const byListId = new Map(lists.map((l) => [l.id, l] as const))
  return items
    .filter(notDeleted)
    .filter(rootOnly)
    .filter((t) => t.done && t.doneAt !== undefined)
    .filter((t) =>
      withinWindow(
        t.doneAt as number,
        now,
        byListId.get(t.listId)?.showCompleted ?? "30d"
      )
    )
    .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0))
}

/** Subtasks of a parent, in manual order. */
export function selectChildren(
  items: TodoItem[],
  parentId: string
): TodoItem[] {
  return items
    .filter((t) => t.parentId === parentId)
    .sort((a, b) => a.order - b.order)
}

/** Counts for the header dropdown / sidebar. */
export function countByView(
  items: TodoItem[],
  lists: ListMeta[],
  now: number
): {
  today: number
  upcoming: number
  inbox: number
  completed: number
  perList: Record<ListId, number>
} {
  const today = selectToday(items, now).length
  const upcoming = selectUpcoming(items, now).reduce(
    (sum, g) => sum + g.items.length,
    0
  )
  const inbox = selectInbox(items).length
  const completed = selectCompletedAll(items, lists, now).length

  const perList: Record<ListId, number> = {}
  for (const list of lists) {
    if (list.id === INBOX_LIST_ID) continue
    perList[list.id] = selectList(items, list.id, list).length
  }

  return { today, upcoming, inbox, completed, perList }
}

// ── helpers ─────────────────────────────────────────────────────────────

function byDueThenOrder(a: TodoItem, b: TodoItem): number {
  const ad = a.dueAt ?? Number.POSITIVE_INFINITY
  const bd = b.dueAt ?? Number.POSITIVE_INFINITY
  if (ad !== bd) return ad - bd
  return a.order - b.order
}

function withinWindow(
  doneAt: number,
  now: number,
  window: ShowCompletedWindow
): boolean {
  switch (window) {
    case "always":
      return true
    case "never":
      return false
    case "today":
      return doneAt >= startOfDay(now)
    case "30d":
    default:
      return now - doneAt <= THIRTY_DAYS_MS
  }
}
