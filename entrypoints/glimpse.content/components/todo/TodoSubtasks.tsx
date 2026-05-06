import { forwardRef, useImperativeHandle, useRef } from "react"

import type { SortMode, TodoItem, TodoId } from "~/lib/todos/types"

import { TodoNewRow } from "./TodoNewRow"
import { TodoRow } from "./TodoRow"

export interface TodoSubtasksHandle {
  /** Focus the `+ New subtask` input. Triggered by the parent's
   *  context-menu `Add subtask` action. */
  focusNewInput: () => void
}

interface TodoSubtasksProps {
  parentId: TodoId
  /** Child tasks under this parent, manual-order pre-sorted. */
  items: TodoItem[]
  now: number
  theme: "light" | "dark"
  /** Drives the "Move up / Move down" items in each subtask's context menu. */
  sortMode?: SortMode
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onSetDue: (id: string, dueAt: number | undefined) => void
  onUpdateText: (id: string, text: string) => void
  onDuplicate: (id: string) => void
  onReorder?: (id: string, direction: -1 | 1) => void
  onAddSubtask: (parentId: TodoId, text: string) => void
}

/**
 * Renders a parent's subtask list (children + `+ New subtask` row).
 *
 * Subtasks are exactly one level deep — child rows do NOT render their own
 * `<TodoSubtasks>`, so we explicitly pass `subtasks={undefined}` and
 * `onAddSubtask={undefined}` to nested `<TodoRow>` instances.
 */
export const TodoSubtasks = forwardRef<TodoSubtasksHandle, TodoSubtasksProps>(
  function TodoSubtasks(
    {
      parentId,
      items,
      now,
      theme,
      sortMode,
      onToggle,
      onDelete,
      onSetDue,
      onUpdateText,
      onDuplicate,
      onReorder,
      onAddSubtask
    },
    ref
  ) {
    const newRowInputRef = useRef<HTMLInputElement | null>(null)

    useImperativeHandle(
      ref,
      () => ({
        focusNewInput: () => {
          newRowInputRef.current?.focus()
        }
      }),
      []
    )

    const railColor =
      theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"

    return (
      <div
        className="ml-6 flex flex-col"
        style={{
          // Vertical guide rail makes subtask hierarchy obvious.
          borderLeft: `1px solid ${railColor}`,
          paddingLeft: 4
        }}>
        {items.map((child) => (
          <TodoRow
            key={child.id}
            item={child}
            now={now}
            theme={theme}
            // No nesting — subtasks of subtasks are out of scope (one level deep).
            subtasks={undefined}
            sortMode={sortMode}
            onToggle={onToggle}
            onDelete={onDelete}
            onSetDue={onSetDue}
            onUpdateText={onUpdateText}
            onDuplicate={onDuplicate}
            onReorder={onReorder}
            // Subtasks can't have their own subtasks — disable the affordance.
            onAddSubtask={undefined}
          />
        ))}
        <TodoNewRow
          ref={newRowInputRef}
          theme={theme}
          placeholder="New subtask"
          onSubmit={(text) => onAddSubtask(parentId, text)}
          borderless
        />
      </div>
    )
  }
)
