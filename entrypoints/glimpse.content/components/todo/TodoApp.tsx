import {
  CalendarRange,
  CheckCheck,
  Inbox as InboxIcon,
  List as ListIcon,
  MoreHorizontal,
  Sunrise
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { listsItem, todosItem, todoUiItem } from "~/lib/storage"
import { addDays, startOfDay } from "~/lib/todos/dates"
import {
  addList as addListM,
  addTodo,
  duplicateTodo,
  ensureInbox,
  removeList as removeListM,
  removeTodo,
  renameList as renameListM,
  reorderTodo,
  setDueAt,
  toggleDone,
  updateListConfig,
  updateTodo
} from "~/lib/todos/mutations"
import {
  countByView,
  selectCompletedAll,
  selectInbox,
  selectList,
  selectToday,
  selectUpcoming
} from "~/lib/todos/selectors"
import {
  INBOX_LIST_ID,
  isSystemView,
  type ListId,
  type ListMeta,
  type NewTaskPosition,
  type ShowCompletedWindow,
  type SortMode,
  type SystemView,
  type TodoId,
  type TodoItem
} from "~/lib/todos/types"

import { useNowTick } from "../../hooks/useNowTick"
import { useStorageItem } from "../../hooks/useStorageItem"
import { useViewportWidth } from "../../hooks/useViewportWidth"

import { ListConfigMenu } from "./ListConfigMenu"
import { TodoHeader } from "./TodoHeader"
import { TodoListView } from "./TodoListView"
import { TodoNewRow } from "./TodoNewRow"
import { TodoSidebar } from "./TodoSidebar"
import { TodoUpcomingView } from "./TodoUpcomingView"

const EXPAND_BREAKPOINT = 720
const LINGER_MS = 1500

function withLingering(
  baseItems: import("~/lib/todos/types").TodoItem[],
  allItems: import("~/lib/todos/types").TodoItem[],
  lingeringIds: Set<string>
): import("~/lib/todos/types").TodoItem[] {
  if (lingeringIds.size === 0) return baseItems
  const baseIds = new Set(baseItems.map((i) => i.id))
  const extras = allItems.filter(
    (t) => lingeringIds.has(t.id) && !baseIds.has(t.id) && !t.parentId
  )
  if (extras.length === 0) return baseItems
  return [...baseItems, ...extras]
}

interface TodoAppProps {
  theme: "light" | "dark"
}

const SYSTEM_EMPTY: Record<
  SystemView,
  { hint: string; Icon: typeof Sunrise }
> = {
  today: {
    hint: "Nothing scheduled for today. Type below to add a task.",
    Icon: Sunrise
  },
  upcoming: {
    hint: "Calendar's clear for the next week.",
    Icon: CalendarRange
  },
  inbox: {
    hint: "Inbox is empty. Capture something with right-click → Add selection as task.",
    Icon: InboxIcon
  },
  completed: {
    hint: "No tasks completed yet.",
    Icon: CheckCheck
  }
}

function resolveActiveListId(
  activeView: SystemView | ListId,
  lists: ListMeta[]
): ListId | null {
  if (isSystemView(activeView)) {
    if (activeView === "inbox") return INBOX_LIST_ID
    return null
  }
  return lists.find((l) => l.id === activeView)?.id ?? null
}

export function TodoApp({ theme }: TodoAppProps) {
  const [todos, setTodos] = useStorageItem(todosItem)
  const [lists, setLists] = useStorageItem(listsItem)
  const [todoUi, setTodoUi] = useStorageItem(todoUiItem)

  const safeLists = useMemo(() => ensureInbox(lists), [lists])
  const now = useNowTick(60_000)
  const vw = useViewportWidth()
  const canExpand = vw >= EXPAND_BREAKPOINT
  const expanded = todoUi.expanded && canExpand

  // After a date mutation the row may no longer match the active view's
  // selector. Keep it visible for LINGER_MS so the user sees their action
  // take effect before the row migrates to its new bucket.
  const [lingeringIds, setLingeringIds] = useState<Set<string>>(new Set())
  const lingerTimers = useRef<Map<string, number>>(new Map())

  const lingerForView = useCallback((id: string) => {
    setLingeringIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    const existing = lingerTimers.current.get(id)
    if (existing !== undefined) window.clearTimeout(existing)
    const handle = window.setTimeout(() => {
      setLingeringIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      lingerTimers.current.delete(id)
    }, LINGER_MS)
    lingerTimers.current.set(id, handle)
  }, [])

  useEffect(() => {
    return () => {
      lingerTimers.current.forEach((h) => window.clearTimeout(h))
      lingerTimers.current.clear()
    }
  }, [])

  const view: SystemView | ListId = isSystemView(todoUi.activeView)
    ? todoUi.activeView
    : safeLists.some((l) => l.id === todoUi.activeView)
      ? (todoUi.activeView as ListId)
      : "today"

  const counts = useMemo(
    () => countByView(todos, safeLists, now),
    [todos, safeLists, now]
  )

  const activeListId = resolveActiveListId(view, safeLists)
  const activeList = activeListId
    ? safeLists.find((l) => l.id === activeListId)
    : undefined
  const isCustomListView = !isSystemView(view) && activeList !== undefined

  const handleAdd = useCallback(
    (text: string) => {
      // Contextual due-date defaults so the new row appears in the active view.
      let dueAt: number | undefined
      let listId: ListId | undefined
      if (isSystemView(view)) {
        if (view === "today") dueAt = startOfDay(Date.now())
        else if (view === "upcoming")
          dueAt = addDays(startOfDay(Date.now()), 1)
        else dueAt = undefined
        listId = INBOX_LIST_ID
      } else {
        dueAt = undefined
        listId = view
      }
      const { items } = addTodo(todos, safeLists, { text, dueAt, listId })
      void setTodos(items)
    },
    [todos, safeLists, setTodos, view]
  )

  const handleToggle = useCallback(
    (id: string) => {
      void setTodos(toggleDone(todos, id))
    },
    [todos, setTodos]
  )

  const handleDelete = useCallback(
    (id: string) => {
      void setTodos(removeTodo(todos, id))
    },
    [todos, setTodos]
  )

  const handleSetDue = useCallback(
    (id: string, dueAt: number | undefined) => {
      void setTodos(setDueAt(todos, id, dueAt))
      lingerForView(id)
    },
    [todos, setTodos, lingerForView]
  )

  const handleUpdateText = useCallback(
    (id: string, text: string) => {
      void setTodos(updateTodo(todos, id, { text }))
    },
    [todos, setTodos]
  )

  const handleDuplicate = useCallback(
    (id: string) => {
      const { items } = duplicateTodo(todos, id)
      void setTodos(items)
    },
    [todos, setTodos]
  )

  const handleReorder = useCallback(
    (id: string, direction: -1 | 1) => {
      void setTodos(reorderTodo(todos, id, direction))
    },
    [todos, setTodos]
  )

  const handleAddSubtask = useCallback(
    (parentId: TodoId, text: string) => {
      const parent = todos.find((t) => t.id === parentId)
      if (!parent) return
      const { items } = addTodo(todos, safeLists, {
        text,
        parentId,
        listId: parent.listId
      })
      void setTodos(items)
    },
    [todos, safeLists, setTodos]
  )

  // Color lookup for custom lists (used by all views to tint task rows).
  const colorOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const l of safeLists) {
      if (l.color) map.set(l.id, l.color)
    }
    return (listId: string) => map.get(listId)
  }, [safeLists])

  // Memoize children lookup so child arrays remain referentially stable across
  // re-renders that don't change the underlying todos.
  const childrenOf = useMemo(() => {
    const byParent = new Map<string, TodoItem[]>()
    for (const t of todos) {
      if (!t.parentId) continue
      const arr = byParent.get(t.parentId)
      if (arr) arr.push(t)
      else byParent.set(t.parentId, [t])
    }
    for (const arr of byParent.values()) {
      arr.sort((a, b) => a.order - b.order)
    }
    return (parentId: string) => byParent.get(parentId) ?? []
  }, [todos])

  const handleChangeView = useCallback(
    (next: SystemView | ListId) => {
      void setTodoUi({ ...todoUi, activeView: next })
    },
    [todoUi, setTodoUi]
  )

  // ── List CRUD ──
  const handleCreateList = useCallback(
    (name: string) => {
      const { lists: nextLists, created } = addListM(safeLists, name)
      void setLists(nextLists)
      void setTodoUi({ ...todoUi, activeView: created.id })
    },
    [safeLists, setLists, todoUi, setTodoUi]
  )

  const handleRenameList = useCallback(
    (id: ListId, name: string) => {
      void setLists(renameListM(safeLists, id, name))
    },
    [safeLists, setLists]
  )

  const handleRemoveList = useCallback(
    (id: ListId) => {
      const { lists: nextLists, items: nextItems } = removeListM(
        safeLists,
        todos,
        id
      )
      void setLists(nextLists)
      void setTodos(nextItems)
      // If the deleted list was active, fall back to Today.
      if (todoUi.activeView === id) {
        void setTodoUi({ ...todoUi, activeView: "today" })
      }
    },
    [safeLists, todos, setLists, setTodos, todoUi, setTodoUi]
  )

  // ── List config ──
  const handleChangeSort = useCallback(
    (mode: SortMode) => {
      if (!activeListId) return
      void setLists(updateListConfig(safeLists, activeListId, { sort: mode }))
    },
    [safeLists, activeListId, setLists]
  )

  const handleChangeNewTaskPosition = useCallback(
    (pos: NewTaskPosition) => {
      if (!activeListId) return
      void setLists(
        updateListConfig(safeLists, activeListId, { newTaskPosition: pos })
      )
    },
    [safeLists, activeListId, setLists]
  )

  const handleChangeShowCompleted = useCallback(
    (window: ShowCompletedWindow) => {
      if (!activeListId) return
      void setLists(
        updateListConfig(safeLists, activeListId, { showCompleted: window })
      )
    },
    [safeLists, activeListId, setLists]
  )

  const handleTogglePinned = useCallback(
    (next: boolean) => {
      void setTodoUi({ ...todoUi, pinned: next })
    },
    [todoUi, setTodoUi]
  )

  const handleToggleExpanded = useCallback(() => {
    void setTodoUi({ ...todoUi, expanded: !todoUi.expanded })
  }, [todoUi, setTodoUi])

  // Manual reorder (Move up / Move down) only makes sense in a custom-list
  // view with sort=manual. System views and lists with date/alpha sort hide
  // the reorder items in the row context menu.
  const rowSortMode: SortMode | undefined = isCustomListView
    ? activeList?.sort
    : undefined

  // Pass row-context handlers everywhere (Duplicate, AddSubtask) — they're
  // safe even on Completed since the menu is disabled per-item where it
  // shouldn't apply.
  const sharedRowProps = {
    onToggle: handleToggle,
    onDelete: handleDelete,
    onSetDue: handleSetDue,
    onUpdateText: handleUpdateText,
    onDuplicate: handleDuplicate,
    onReorder: rowSortMode === "manual" ? handleReorder : undefined,
    onAddSubtask: handleAddSubtask,
    childrenOf,
    sortMode: rowSortMode,
    // Pass colorOf to every TodoListView so items from custom lists show
    // their color in Today / Inbox / Completed views.
    colorOf
  }

  // ── Body render ──
  let body
  if (isSystemView(view)) {
    if (view === "today") {
      body = (
        <TodoListView
          items={withLingering(selectToday(todos, now), todos, lingeringIds)}
          now={now}
          emptyHint={SYSTEM_EMPTY.today.hint}
          EmptyIcon={SYSTEM_EMPTY.today.Icon}
          theme={theme}
          {...sharedRowProps}
        />
      )
    } else if (view === "upcoming") {
      body = (
        <TodoUpcomingView
          groups={selectUpcoming(todos, now)}
          now={now}
          theme={theme}
          {...sharedRowProps}
        />
      )
    } else if (view === "inbox") {
      body = (
        <TodoListView
          items={withLingering(selectInbox(todos), todos, lingeringIds)}
          now={now}
          emptyHint={SYSTEM_EMPTY.inbox.hint}
          EmptyIcon={SYSTEM_EMPTY.inbox.Icon}
          theme={theme}
          {...sharedRowProps}
        />
      )
    } else {
      body = (
        <TodoListView
          items={withLingering(
            selectCompletedAll(todos, safeLists, now),
            todos,
            lingeringIds
          )}
          now={now}
          emptyHint={SYSTEM_EMPTY.completed.hint}
          EmptyIcon={SYSTEM_EMPTY.completed.Icon}
          theme={theme}
          {...sharedRowProps}
        />
      )
    }
  } else {
    body = (
      <TodoListView
        items={withLingering(
          selectList(todos, view, activeList),
          todos,
          lingeringIds
        )}
        now={now}
        emptyHint="No tasks here yet. Type below to add one."
        EmptyIcon={ListIcon}
        theme={theme}
        listColor={activeList?.color}
        {...sharedRowProps}
      />
    )
  }

  // Footer ⋯
  const footerMoreRef = useRef<HTMLButtonElement | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const mutedColor = theme === "dark" ? "#a3a3a3" : "#737373"

  const showFooter = view !== "completed"

  const mainPane = (
    <div className="flex flex-1 min-w-0 flex-col">
      <TodoHeader
        theme={theme}
        activeView={view}
        lists={safeLists}
        counts={counts}
        expanded={expanded}
        canExpand={canExpand}
        pinned={todoUi.pinned}
        onToggleExpanded={handleToggleExpanded}
        onChangeView={handleChangeView}
        onCreateList={handleCreateList}
        onRenameList={handleRenameList}
        onRemoveList={handleRemoveList}
      />
      {body}
      {showFooter ? (
        <div
          className="flex shrink-0 items-stretch"
          style={{
            borderTop:
              theme === "dark"
                ? "1px solid rgba(255,255,255,0.06)"
                : "1px solid rgba(0,0,0,0.06)"
          }}>
          <div className="flex-1">
            <TodoNewRow
              theme={theme}
              placeholder={
                isCustomListView
                  ? `New task in ${activeList?.name ?? "list"}`
                  : view === "inbox"
                    ? "New task in Inbox"
                    : "New task"
              }
              onSubmit={handleAdd}
              borderless
            />
          </div>
          <button
            ref={footerMoreRef}
            type="button"
            aria-label="List settings"
            title="List settings"
            onClick={() => setConfigOpen((v) => !v)}
            className={
              "flex w-9 items-center justify-center " +
              "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            }
            style={{ color: mutedColor }}>
            <MoreHorizontal size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="flex h-full">
      {expanded ? (
        <TodoSidebar
          theme={theme}
          activeView={view}
          lists={safeLists}
          counts={counts}
          onChangeView={handleChangeView}
          onCreateList={handleCreateList}
          onRenameList={handleRenameList}
          onRemoveList={handleRemoveList}
        />
      ) : null}
      {mainPane}
      <ListConfigMenu
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        anchorRef={footerMoreRef}
        theme={theme}
        sort={isCustomListView ? activeList?.sort : undefined}
        newTaskPosition={
          isCustomListView ? activeList?.newTaskPosition : undefined
        }
        showCompleted={
          isCustomListView ? activeList?.showCompleted : undefined
        }
        onChangeSort={handleChangeSort}
        onChangeNewTaskPosition={handleChangeNewTaskPosition}
        onChangeShowCompleted={handleChangeShowCompleted}
        pinned={todoUi.pinned}
        onTogglePinned={handleTogglePinned}
      />
    </div>
  )
}
