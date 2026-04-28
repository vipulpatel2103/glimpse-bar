import { CalendarRange, CheckCheck, Inbox, Sunrise } from "lucide-react"
import { useCallback, useMemo } from "react"

import { listsItem, todosItem, todoUiItem } from "~/lib/storage"
import { addDays, startOfDay } from "~/lib/todos/dates"
import {
  addTodo,
  ensureInbox,
  removeTodo,
  setDueAt,
  toggleDone
} from "~/lib/todos/mutations"
import {
  countByView,
  selectCompletedAll,
  selectInbox,
  selectToday,
  selectUpcoming
} from "~/lib/todos/selectors"
import { isSystemView, type SystemView } from "~/lib/todos/types"

import { useNowTick } from "../../hooks/useNowTick"
import { useStorageItem } from "../../hooks/useStorageItem"

import { TodoHeader } from "./TodoHeader"
import { TodoListView } from "./TodoListView"
import { TodoNewRow } from "./TodoNewRow"
import { TodoUpcomingView } from "./TodoUpcomingView"

interface TodoAppProps {
  theme: "light" | "dark"
}

const EMPTY_HINTS: Record<SystemView, { hint: string; Icon: typeof Sunrise }> = {
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
    Icon: Inbox
  },
  completed: {
    hint: "No tasks completed yet.",
    Icon: CheckCheck
  }
}

export function TodoApp({ theme }: TodoAppProps) {
  const [todos, setTodos] = useStorageItem(todosItem)
  const [lists] = useStorageItem(listsItem)
  const [todoUi, setTodoUi] = useStorageItem(todoUiItem)

  const safeLists = useMemo(() => ensureInbox(lists), [lists])

  // Re-render every 60s so day-boundary rollovers (overdue → Today,
  // Today → Upcoming) become visible without user interaction.
  const now = useNowTick(60_000)

  const view: SystemView = isSystemView(todoUi.activeView)
    ? todoUi.activeView
    : "today"

  const counts = useMemo(
    () => countByView(todos, safeLists, now),
    [todos, safeLists, now]
  )

  const handleAdd = useCallback(
    (text: string) => {
      // The "+ New task" footer is contextual: in Today / Upcoming we
      // schedule today; in Inbox we leave dueAt empty; in Completed adding
      // is disabled.
      let dueAt: number | undefined
      if (view === "today") dueAt = startOfDay(Date.now())
      else if (view === "upcoming") dueAt = addDays(startOfDay(Date.now()), 1)
      else dueAt = undefined
      const { items } = addTodo(todos, safeLists, { text, dueAt })
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
    },
    [todos, setTodos]
  )

  const handleChangeView = useCallback(
    (next: SystemView) => {
      void setTodoUi({ ...todoUi, activeView: next })
    },
    [todoUi, setTodoUi]
  )

  let body
  if (view === "today") {
    body = (
      <TodoListView
        items={selectToday(todos, now)}
        now={now}
        emptyHint={EMPTY_HINTS.today.hint}
        EmptyIcon={EMPTY_HINTS.today.Icon}
        theme={theme}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onSetDue={handleSetDue}
      />
    )
  } else if (view === "upcoming") {
    body = (
      <TodoUpcomingView
        groups={selectUpcoming(todos, now)}
        now={now}
        theme={theme}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onSetDue={handleSetDue}
      />
    )
  } else if (view === "inbox") {
    body = (
      <TodoListView
        items={selectInbox(todos)}
        now={now}
        emptyHint={EMPTY_HINTS.inbox.hint}
        EmptyIcon={EMPTY_HINTS.inbox.Icon}
        theme={theme}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onSetDue={handleSetDue}
      />
    )
  } else {
    body = (
      <TodoListView
        items={selectCompletedAll(todos, safeLists, now)}
        now={now}
        emptyHint={EMPTY_HINTS.completed.hint}
        EmptyIcon={EMPTY_HINTS.completed.Icon}
        theme={theme}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onSetDue={handleSetDue}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <TodoHeader
        theme={theme}
        activeView={view}
        counts={counts}
        onChangeView={handleChangeView}
      />
      {body}
      {view !== "completed" ? (
        <TodoNewRow
          theme={theme}
          placeholder={view === "inbox" ? "New task in Inbox" : "New task"}
          onSubmit={handleAdd}
        />
      ) : null}
    </div>
  )
}
