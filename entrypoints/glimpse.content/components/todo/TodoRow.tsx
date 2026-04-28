import { Trash2 } from "lucide-react"
import { useCallback, type KeyboardEvent } from "react"

import type { TodoItem } from "~/lib/todos/types"

interface TodoRowProps {
  item: TodoItem
  theme: "light" | "dark"
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoRow({ item, theme, onToggle, onDelete }: TodoRowProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault()
        onDelete(item.id)
      }
    },
    [item.id, onDelete]
  )

  return (
    <div
      role="listitem"
      tabIndex={0}
      onKeyDown={handleKey}
      className={
        "group flex h-8 items-center gap-2 rounded px-2 " +
        "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      }>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.done}
        aria-label={item.done ? `Mark "${item.text}" as not done` : `Mark "${item.text}" as done`}
        onClick={() => onToggle(item.id)}
        className={
          "flex h-4 w-4 shrink-0 items-center justify-center rounded " +
          "border transition-colors " +
          (item.done
            ? "border-blue-500 bg-blue-500"
            : "border-black/30 dark:border-white/35 hover:border-blue-500")
        }
        style={{
          color: item.done ? (theme === "dark" ? "#0a0a0a" : "#ffffff") : "transparent"
        }}>
        {item.done ? (
          <svg
            viewBox="0 0 16 16"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true">
            <polyline points="3 8 7 12 13 4" />
          </svg>
        ) : null}
      </button>
      <span
        className={
          "flex-1 truncate text-[13px] leading-tight transition-opacity duration-200 " +
          (item.done ? "line-through opacity-50" : "")
        }>
        {item.text}
      </span>
      <button
        type="button"
        aria-label={`Delete "${item.text}"`}
        onClick={() => onDelete(item.id)}
        className={
          "flex h-6 w-6 items-center justify-center rounded " +
          "opacity-0 transition-opacity duration-100 " +
          "group-hover:opacity-100 group-focus-within:opacity-100 " +
          "hover:bg-black/[0.06] dark:hover:bg-white/[0.10] " +
          "focus:outline-none focus-visible:opacity-100 " +
          "focus-visible:ring-2 focus-visible:ring-blue-500"
        }
        style={{
          color: theme === "dark" ? "#a3a3a3" : "#737373"
        }}>
        <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}
