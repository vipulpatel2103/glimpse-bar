import type { LucideIcon } from "lucide-react"

import type { TodoItem } from "~/lib/todos/types"

import { TodoRow } from "./TodoRow"

interface TodoListViewProps {
  items: TodoItem[]
  emptyHint: string
  EmptyIcon?: LucideIcon
  theme: "light" | "dark"
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoListView({
  items,
  emptyHint,
  EmptyIcon,
  theme,
  onToggle,
  onDelete
}: TodoListViewProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        {EmptyIcon ? (
          <EmptyIcon
            size={32}
            strokeWidth={1.5}
            aria-hidden="true"
            style={{
              color: theme === "dark" ? "rgba(163,163,163,0.5)" : "rgba(115,115,115,0.5)"
            }}
          />
        ) : null}
        <p
          className="text-[12px] leading-relaxed"
          style={{ color: theme === "dark" ? "#a3a3a3" : "#737373" }}>
          {emptyHint}
        </p>
      </div>
    )
  }

  return (
    <div role="list" className="flex flex-1 flex-col gap-px overflow-y-auto px-1 py-1">
      {items.map((item) => (
        <TodoRow
          key={item.id}
          item={item}
          theme={theme}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
