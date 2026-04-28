import { Sunrise } from "lucide-react"
import { useCallback, useMemo } from "react"

import { listsItem, todosItem } from "~/lib/storage"
import { startOfDay } from "~/lib/todos/dates"
import {
  addTodo,
  ensureInbox,
  removeTodo,
  toggleDone
} from "~/lib/todos/mutations"
import { selectToday } from "~/lib/todos/selectors"

import { useStorageItem } from "../../hooks/useStorageItem"

import { TodoHeader } from "./TodoHeader"
import { TodoListView } from "./TodoListView"
import { TodoNewRow } from "./TodoNewRow"

interface TodoAppProps {
  theme: "light" | "dark"
}

export function TodoApp({ theme }: TodoAppProps) {
  const [todos, setTodos] = useStorageItem(todosItem)
  const [lists] = useStorageItem(listsItem)

  // Defensive — if user wiped storage, ensure Inbox always exists at read time.
  const safeLists = useMemo(() => ensureInbox(lists), [lists])

  // Step 3: only the Today view is wired. Views switching arrives in Step 4;
  // a 60s rollover ticker arrives in Step 5.
  const visible = useMemo(() => selectToday(todos, Date.now()), [todos])

  const handleAdd = useCallback(
    (text: string) => {
      const dueAt = startOfDay(Date.now())
      const { items } = addTodo(todos, safeLists, { text, dueAt })
      void setTodos(items)
    },
    [todos, safeLists, setTodos]
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

  return (
    <div className="flex h-full flex-col">
      <TodoHeader theme={theme} title="Today" />
      <TodoListView
        items={visible}
        emptyHint="Nothing scheduled for today. Type below to add a task."
        EmptyIcon={Sunrise}
        theme={theme}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
      <TodoNewRow theme={theme} onSubmit={handleAdd} />
    </div>
  )
}
