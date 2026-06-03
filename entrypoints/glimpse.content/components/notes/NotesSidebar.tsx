import {
  Archive,
  Pencil,
  Pin,
  Plus,
  StickyNote,
  Tag,
  Trash2,
  type LucideIcon
} from "lucide-react"
import { useCallback, useState, type KeyboardEvent } from "react"

import {
  type LabelId,
  type LabelMeta,
  type SystemView
} from "~/lib/notes/types"

import type { ViewCounts } from "./NotesHeader"

interface NotesSidebarProps {
  theme: "light" | "dark"
  activeView: SystemView | LabelId
  labels: LabelMeta[]
  counts: ViewCounts
  onChangeView: (view: SystemView | LabelId) => void
  onCreateLabel: (name: string) => void
  onRenameLabel: (id: LabelId, name: string) => void
  onRemoveLabel: (id: LabelId) => void
}

interface ViewMeta {
  id: SystemView
  label: string
  Icon: LucideIcon
}

const SYSTEM_VIEWS: ViewMeta[] = [
  { id: "pinned", label: "Pinned", Icon: Pin },
  { id: "all", label: "All", Icon: StickyNote },
  { id: "archived", label: "Archived", Icon: Archive }
]

export function NotesSidebar({
  theme,
  activeView,
  labels,
  counts,
  onChangeView,
  onCreateLabel,
  onRenameLabel,
  onRemoveLabel
}: NotesSidebarProps) {
  const [creating, setCreating] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")
  const [renamingId, setRenamingId] = useState<LabelId | null>(null)
  const [renameDraft, setRenameDraft] = useState("")

  const handleCreateSubmit = useCallback(() => {
    const trimmed = newLabelName.trim()
    if (trimmed) onCreateLabel(trimmed)
    setCreating(false)
    setNewLabelName("")
  }, [newLabelName, onCreateLabel])

  const handleNewKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleCreateSubmit()
      } else if (e.key === "Escape") {
        e.preventDefault()
        setCreating(false)
        setNewLabelName("")
      }
    },
    [handleCreateSubmit]
  )

  const handleRenameCommit = useCallback(() => {
    if (renamingId === null) return
    const trimmed = renameDraft.trim()
    if (trimmed) onRenameLabel(renamingId, trimmed)
    setRenamingId(null)
    setRenameDraft("")
  }, [renamingId, renameDraft, onRenameLabel])

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
  const sideBorder =
    theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)"

  const itemBase =
    "flex items-center gap-2 rounded px-2 py-1.5 text-[13px] leading-tight " +
    "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
    "focus:outline-none focus-visible:bg-black/[0.04] dark:focus-visible:bg-white/[0.06]"
  const activeStyle = "bg-black/[0.06] dark:bg-white/[0.10] font-semibold"

  const countFor = (id: SystemView) =>
    id === "all" ? counts.all : id === "pinned" ? counts.pinned : counts.archived

  return (
    <aside
      role="navigation"
      aria-label="Note views"
      className="flex h-full w-[200px] shrink-0 flex-col"
      style={{ borderRight: sideBorder }}>
      <div
        className="flex h-11 shrink-0 items-center gap-1.5 px-3"
        style={{ borderBottom: sideBorder }}>
        <StickyNote size={14} strokeWidth={2} aria-hidden="true" />
        <span className="text-[14px] font-semibold leading-none">Notes</span>
      </div>

      <div className="flex flex-1 flex-col gap-px overflow-y-auto p-2">
        {SYSTEM_VIEWS.map((view) => {
          const selected = view.id === activeView
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onChangeView(view.id)}
              aria-current={selected ? "page" : undefined}
              className={`w-full text-left ${itemBase} ${selected ? activeStyle : ""}`}>
              <view.Icon size={14} strokeWidth={2} aria-hidden="true" />
              <span className="flex-1 truncate">{view.label}</span>
              <span className="text-[12px] tabular-nums" style={{ color: muted }}>
                {countFor(view.id)}
              </span>
            </button>
          )
        })}

        {labels.length > 0 && (
          <>
            <div className="my-2" style={{ height: 1, backgroundColor: dividerColor }} />
            <div
              className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: muted }}>
              Labels
            </div>
          </>
        )}

        {labels.map((label) =>
          renamingId === label.id ? (
            <div key={label.id} className="flex items-center gap-2 rounded px-2 py-1.5">
              <Tag size={14} strokeWidth={2} aria-hidden="true" style={{ color: muted }} />
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
            <div key={label.id} className="group relative flex items-center rounded">
              <button
                type="button"
                onClick={() => onChangeView(label.id)}
                aria-current={label.id === activeView ? "page" : undefined}
                className={
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] leading-tight " +
                  "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
                  "focus:outline-none focus-visible:bg-black/[0.04] dark:focus-visible:bg-white/[0.06] " +
                  (label.id === activeView ? activeStyle : "")
                }>
                <Tag size={14} strokeWidth={2} aria-hidden="true" />
                <span className="flex-1 truncate">{label.name}</span>
                <span
                  className="text-[12px] tabular-nums transition-opacity duration-100 group-hover:opacity-0"
                  style={{ color: muted }}>
                  {counts.perLabel[label.id] ?? 0}
                </span>
              </button>
              <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
                <button
                  type="button"
                  aria-label={`Rename ${label.name}`}
                  title="Rename"
                  onClick={(e) => {
                    e.stopPropagation()
                    setRenamingId(label.id)
                    setRenameDraft(label.name)
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded hover:bg-black/[0.10] dark:hover:bg-white/[0.14]"
                  style={{ color: muted }}>
                  <Pencil size={12} strokeWidth={2} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${label.name}`}
                  title="Delete (removes from all notes)"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveLabel(label.id)
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded hover:bg-black/[0.10] dark:hover:bg-white/[0.14]"
                  style={{ color: muted }}>
                  <Trash2 size={12} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </div>
          )
        )}

        <div className="my-2" style={{ height: 1, backgroundColor: dividerColor }} />

        {creating ? (
          <div className="flex items-center gap-2 rounded px-2 py-1.5">
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            <input
              autoFocus
              type="text"
              value={newLabelName}
              placeholder="Label name"
              onChange={(e) => setNewLabelName(e.target.value)}
              onKeyDown={handleNewKey}
              onBlur={handleCreateSubmit}
              className="h-5 flex-1 bg-transparent text-[13px] leading-tight placeholder:text-neutral-500 focus:outline-none"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className={`w-full text-left ${itemBase}`}
            style={{ color: muted }}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            <span className="flex-1">New label</span>
          </button>
        )}
      </div>
    </aside>
  )
}
