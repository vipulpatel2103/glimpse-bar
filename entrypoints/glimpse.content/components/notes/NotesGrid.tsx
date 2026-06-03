import type { LucideIcon } from "lucide-react"

import type { LabelMeta, Note } from "~/lib/notes/types"

import { NoteCard } from "./NoteCard"

interface NotesGridProps {
  notes: Note[]
  now: number
  theme: "light" | "dark"
  labels: LabelMeta[]
  /** 1 = single column (compact / list), 2 = grid (expanded). */
  columns: 1 | 2
  /** When true (All view), split into `Pinned` / `Others` groups with headers. */
  groupPinned?: boolean
  emptyHint: string
  EmptyIcon?: LucideIcon
  onTogglePin: (id: string) => void
  onToggleArchive: (id: string) => void
  onDelete?: (id: string) => void
  /** Show the permanent-delete hover action (Archived view only). */
  showDeleteAction?: boolean
  onOpen?: (id: string) => void
}

export function NotesGrid({
  notes,
  now,
  theme,
  labels,
  columns,
  groupPinned = false,
  emptyHint,
  EmptyIcon,
  onTogglePin,
  onToggleArchive,
  onDelete,
  showDeleteAction = false,
  onOpen
}: NotesGridProps) {
  if (notes.length === 0) {
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

  const nameOf = new Map(labels.map((l) => [l.id, l.name] as const))
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"

  const renderCards = (list: Note[]) => (
    <div className={columns === 2 ? "flex flex-wrap gap-2" : "flex flex-col gap-2"}>
      {list.map((note) => (
        <div
          key={note.id}
          style={
            columns === 2 ? { width: "calc(50% - 4px)", minWidth: 0 } : undefined
          }>
          <NoteCard
            note={note}
            now={now}
            theme={theme}
            labelNames={note.labels
              .map((id) => nameOf.get(id))
              .filter((n): n is string => Boolean(n))}
            onTogglePin={onTogglePin}
            onToggleArchive={onToggleArchive}
            onDelete={onDelete}
            showDeleteAction={showDeleteAction}
            onOpen={onOpen}
          />
        </div>
      ))}
    </div>
  )

  const groupHeader = (label: string) => (
    <div
      className="px-1 pt-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: muted }}>
      {label}
    </div>
  )

  // `notes` arrives pinned-first from selectAll, so a simple partition keeps order.
  const pinned = groupPinned ? notes.filter((n) => n.pinned) : []
  const others = groupPinned ? notes.filter((n) => !n.pinned) : notes

  return (
    <div role="list" className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
      {groupPinned && pinned.length > 0 ? (
        <>
          {groupHeader("Pinned")}
          {renderCards(pinned)}
          {others.length > 0 ? groupHeader("Others") : null}
          {renderCards(others)}
        </>
      ) : (
        renderCards(others)
      )}
    </div>
  )
}
