import type { LucideIcon } from "lucide-react"

import type { SortMode, TodoItem } from "~/lib/todos/types"

import { TodoRow } from "./TodoRow"

interface TodoListViewProps {
  items: TodoItem[]
  now: number
  emptyHint: string
  EmptyIcon?: LucideIcon
  theme: "light" | "dark"
  /**
   * Per-item color lookup (Today / Inbox / Completed — items span many lists).
   * Takes priority over flat `listColor`.
   */
  colorOf?: (listId: string) => string | undefined
  /** Flat color for a single-list view (custom list view only). */
  listColor?: string
  /** Drives Move up / Move down items in row context menus. */
  sortMode?: SortMode
  /** Returns child subtasks for a given parent id (already sorted). */
  childrenOf?: (parentId: string) => TodoItem[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onSetDue: (id: string, dueAt: number | undefined) => void
  onUpdateText: (id: string, text: string) => void
  onDuplicate?: (id: string) => void
  onReorder?: (id: string, direction: -1 | 1) => void
  onAddSubtask?: (parentId: string, text: string) => void
}

export function TodoListView({
  items,
  now,
  emptyHint,
  EmptyIcon,
  theme,
  colorOf,
  listColor,
  sortMode,
  childrenOf,
  onToggle,
  onDelete,
  onSetDue,
  onUpdateText,
  onDuplicate,
  onReorder,
  onAddSubtask
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
              color:
                theme === "dark"
                  ? "rgba(163,163,163,0.5)"
                  : "rgba(115,115,115,0.5)"
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
          now={now}
          theme={theme}
          listColor={colorOf ? colorOf(item.listId) : listColor}
          subtasks={childrenOf ? childrenOf(item.id) : undefined}
          sortMode={sortMode}
          onToggle={onToggle}
          onDelete={onDelete}
          onSetDue={onSetDue}
          onUpdateText={onUpdateText}
          onDuplicate={onDuplicate}
          onReorder={onReorder}
          onAddSubtask={onAddSubtask}
        />
      ))}
    </div>
  )
}
