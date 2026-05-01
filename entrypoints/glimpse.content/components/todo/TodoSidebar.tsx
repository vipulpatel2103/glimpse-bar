import {
  CalendarRange,
  CheckCheck,
  ChevronDown,
  CheckSquare,
  Inbox,
  List,
  Pencil,
  Plus,
  Sunrise,
  Trash2,
  type LucideIcon
} from "lucide-react"
import { useCallback, useState, type KeyboardEvent } from "react"

import {
  INBOX_LIST_ID,
  type ListId,
  type ListMeta,
  type SystemView
} from "~/lib/todos/types"

interface TodoSidebarProps {
  theme: "light" | "dark"
  activeView: SystemView | ListId
  lists: ListMeta[]
  counts: {
    today: number
    upcoming: number
    inbox: number
    completed: number
    perList: Record<ListId, number>
  }
  onChangeView: (view: SystemView | ListId) => void
  onCreateList: (name: string) => void
  onRenameList: (id: ListId, name: string) => void
  onRemoveList: (id: ListId) => void
}

interface ViewMeta {
  id: SystemView
  label: string
  Icon: LucideIcon
}

const SYSTEM_VIEWS: ViewMeta[] = [
  { id: "today", label: "Today", Icon: Sunrise },
  { id: "upcoming", label: "Upcoming", Icon: CalendarRange },
  { id: "inbox", label: "Inbox", Icon: Inbox },
  { id: "completed", label: "Completed", Icon: CheckCheck }
]

export function TodoSidebar({
  theme,
  activeView,
  lists,
  counts,
  onChangeView,
  onCreateList,
  onRenameList,
  onRemoveList
}: TodoSidebarProps) {
  const [creating, setCreating] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [renamingId, setRenamingId] = useState<ListId | null>(null)
  const [renameDraft, setRenameDraft] = useState("")

  const customLists = lists.filter((l) => l.id !== INBOX_LIST_ID)

  const handleCreateSubmit = useCallback(() => {
    const trimmed = newListName.trim()
    if (!trimmed) {
      setCreating(false)
      setNewListName("")
      return
    }
    onCreateList(trimmed)
    setCreating(false)
    setNewListName("")
  }, [newListName, onCreateList])

  const handleNewListKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleCreateSubmit()
      } else if (e.key === "Escape") {
        e.preventDefault()
        setCreating(false)
        setNewListName("")
      }
    },
    [handleCreateSubmit]
  )

  const handleRenameStart = useCallback((list: ListMeta) => {
    setRenamingId(list.id)
    setRenameDraft(list.name)
  }, [])

  const handleRenameCommit = useCallback(() => {
    if (renamingId === null) return
    const trimmed = renameDraft.trim()
    if (trimmed) onRenameList(renamingId, trimmed)
    setRenamingId(null)
    setRenameDraft("")
  }, [renamingId, renameDraft, onRenameList])

  const handleRenameKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleRenameCommit()
      } else if (e.key === "Escape") {
        e.preventDefault()
        setRenamingId(null)
        setRenameDraft("")
      }
    },
    [handleRenameCommit]
  )

  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const dividerColor =
    theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"

  const itemBase =
    "flex items-center gap-2 rounded px-2 py-1.5 text-[13px] leading-tight " +
    "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
    "focus:outline-none focus-visible:bg-black/[0.04] " +
    "dark:focus-visible:bg-white/[0.06]"

  const activeStyle = "bg-black/[0.06] dark:bg-white/[0.10] font-semibold"

  return (
    <aside
      role="navigation"
      aria-label="Task views"
      className="flex h-full w-[200px] shrink-0 flex-col"
      style={{
        borderRight:
          theme === "dark"
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(0,0,0,0.06)"
      }}>
      <div
        className="flex h-11 shrink-0 items-center gap-1.5 px-3"
        style={{
          borderBottom:
            theme === "dark"
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(0,0,0,0.06)"
        }}>
        <CheckSquare size={14} strokeWidth={2} aria-hidden="true" />
        <span className="text-[14px] font-semibold leading-none">Tasks</span>
        <ChevronDown
          size={12}
          strokeWidth={2}
          aria-hidden="true"
          style={{ color: muted }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-px overflow-y-auto p-2">
        {SYSTEM_VIEWS.map((view) => {
          const Icon = view.Icon
          const count = counts[view.id]
          const selected = view.id === activeView
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onChangeView(view.id)}
              aria-current={selected ? "page" : undefined}
              className={`w-full text-left ${itemBase} ${selected ? activeStyle : ""}`}>
              <Icon size={14} strokeWidth={2} aria-hidden="true" />
              <span className="flex-1 truncate">{view.label}</span>
              <span className="text-[12px] tabular-nums" style={{ color: muted }}>
                {count}
              </span>
            </button>
          )
        })}

        {customLists.length > 0 && (
          <>
            <div
              className="my-2"
              style={{ height: 1, backgroundColor: dividerColor }}
            />
            <div
              className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: muted }}>
              Lists
            </div>
          </>
        )}

        {customLists.map((list) =>
          renamingId === list.id ? (
            <div
              key={list.id}
              className="flex items-center gap-2 rounded px-2 py-1.5">
              <span
                aria-hidden="true"
                style={{
                  width: 3,
                  height: 14,
                  borderRadius: 2,
                  flexShrink: 0,
                  backgroundColor: list.color ?? muted
                }}
              />
              <input
                autoFocus
                type="text"
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onKeyDown={handleRenameKey}
                onBlur={handleRenameCommit}
                className="h-5 flex-1 bg-transparent text-[13px] leading-tight focus:outline-none"
              />
            </div>
          ) : (
            <div
              key={list.id}
              className="group relative flex items-center rounded">
              <button
                type="button"
                onClick={() => onChangeView(list.id)}
                aria-current={list.id === activeView ? "page" : undefined}
                className={
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] leading-tight " +
                  "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
                  "focus:outline-none focus-visible:bg-black/[0.04] " +
                  "dark:focus-visible:bg-white/[0.06] " +
                  (list.id === activeView ? activeStyle : "")
                }>
                <span
                  aria-hidden="true"
                  style={{
                    width: 3,
                    height: 14,
                    borderRadius: 2,
                    flexShrink: 0,
                    backgroundColor: list.color ?? muted
                  }}
                />
                <span className="flex-1 truncate">{list.name}</span>
                <span
                  className={
                    "text-[12px] tabular-nums transition-opacity duration-100 " +
                    "group-hover:opacity-0"
                  }
                  style={{ color: muted }}>
                  {counts.perList[list.id] ?? 0}
                </span>
              </button>
              {/* Hover icons overlay the count area so the count itself
                  stays right-aligned with system-view rows. */}
              <div
                className={
                  "absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 " +
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-100"
                }>
                <button
                  type="button"
                  aria-label={`Rename ${list.name}`}
                  title="Rename"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRenameStart(list)
                  }}
                  className={
                    "flex h-5 w-5 items-center justify-center rounded " +
                    "hover:bg-black/[0.10] dark:hover:bg-white/[0.14]"
                  }
                  style={{ color: muted }}>
                  <Pencil size={12} strokeWidth={2} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${list.name}`}
                  title="Delete (tasks move to Inbox)"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveList(list.id)
                  }}
                  className={
                    "flex h-5 w-5 items-center justify-center rounded " +
                    "hover:bg-black/[0.10] dark:hover:bg-white/[0.14]"
                  }
                  style={{ color: muted }}>
                  <Trash2 size={12} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </div>
          )
        )}

        <div
          className="my-2"
          style={{ height: 1, backgroundColor: dividerColor }}
        />

        {creating ? (
          <div className="flex items-center gap-2 rounded px-2 py-1.5">
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            <input
              autoFocus
              type="text"
              value={newListName}
              placeholder="List name"
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={handleNewListKey}
              onBlur={handleCreateSubmit}
              className={
                "h-5 flex-1 bg-transparent text-[13px] leading-tight " +
                "placeholder:text-neutral-500 focus:outline-none"
              }
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className={`w-full text-left ${itemBase}`}
            style={{ color: muted }}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            <span className="flex-1">New list</span>
          </button>
        )}
      </div>
    </aside>
  )
}
