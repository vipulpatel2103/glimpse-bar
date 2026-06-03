import {
  Archive,
  ArchiveRestore,
  CheckSquare,
  Pin,
  PinOff,
  Square,
  Trash2
} from "lucide-react"
import { type CSSProperties } from "react"

import { noteBg } from "~/lib/notes/colors"
import { formatNoteDate } from "~/lib/notes/dates"
import { notePreview } from "~/lib/notes/selectors"
import type { Note } from "~/lib/notes/types"

interface NoteCardProps {
  note: Note
  now: number
  theme: "light" | "dark"
  /** Names of the note's labels (resolved by the parent), for chip display. */
  labelNames?: string[]
  onTogglePin: (id: string) => void
  onToggleArchive: (id: string) => void
  /** Permanent delete (keyboard Shift+⌫ everywhere; hover button when shown). */
  onDelete?: (id: string) => void
  /** Show the permanent-delete hover button (Archived view only). */
  showDeleteAction?: boolean
  /** Opens the editor. Wired in Step 4; absent → card is display-only. */
  onOpen?: (id: string) => void
}

export function NoteCard({
  note,
  now,
  theme,
  labelNames,
  onTogglePin,
  onToggleArchive,
  onDelete,
  showDeleteAction = false,
  onOpen
}: NoteCardProps) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const text = theme === "dark" ? "#fafafa" : "#171717"
  const border =
    theme === "dark"
      ? "1px solid rgba(255,255,255,0.10)"
      : "1px solid rgba(0,0,0,0.08)"
  const chipBg =
    theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"

  const cardStyle: CSSProperties = {
    backgroundColor: noteBg(note.color, theme),
    border,
    color: text
  }

  const preview = notePreview(note)
  const checklist = note.checklist?.slice(0, 6) ?? []

  const actionBtn =
    "flex h-6 w-6 items-center justify-center rounded transition-colors " +
    "hover:bg-black/[0.06] dark:hover:bg-white/[0.10] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"

  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={onOpen ? () => onOpen(note.id) : undefined}
      onKeyDown={(e) => {
        // Only when the card itself holds focus (not an inner action button).
        if (e.target !== e.currentTarget) return
        if (e.key === "Enter" || e.key === "e" || e.key === "E") {
          e.preventDefault()
          onOpen?.(note.id)
        } else if (e.key === "p" || e.key === "P") {
          e.preventDefault()
          onTogglePin(note.id)
        } else if (e.key === "Backspace" || e.key === "Delete") {
          e.preventDefault()
          if (e.shiftKey) onDelete?.(note.id)
          else onToggleArchive(note.id)
        }
      }}
      className={
        "group relative flex flex-col gap-1.5 rounded-[10px] p-3 transition-shadow " +
        (onOpen ? "cursor-pointer " : "") +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      }
      style={cardStyle}>
      {/* Persistent pin badge (top-right) when pinned. */}
      {note.pinned ? (
        <Pin
          size={12}
          strokeWidth={2.25}
          aria-hidden="true"
          className="absolute right-2 top-2"
          style={{ color: muted, transform: "rotate(40deg)" }}
        />
      ) : null}

      {note.title.trim() ? (
        <h3
          className="truncate pr-5 text-[14px] font-semibold leading-tight"
          title={note.title}>
          {note.title}
        </h3>
      ) : null}

      {checklist.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {checklist.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-1.5 text-[12px] leading-snug"
              style={{ color: c.done ? muted : text }}>
              {c.done ? (
                <CheckSquare size={12} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Square size={12} strokeWidth={2} aria-hidden="true" />
              )}
              <span className={c.done ? "line-through opacity-60" : ""}>
                {c.text}
              </span>
            </li>
          ))}
        </ul>
      ) : preview ? (
        <p
          className="whitespace-pre-wrap text-[12px] leading-snug"
          style={{
            color: muted,
            display: "-webkit-box",
            WebkitLineClamp: 6,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
          {preview}
        </p>
      ) : null}

      {labelNames && labelNames.length > 0 ? (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {labelNames.map((name) => (
            <span
              key={name}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: chipBg, color: muted }}>
              {name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[11px] tabular-nums" style={{ color: muted }}>
          {formatNoteDate(note.updatedAt, now)}
        </span>
        {/* Hover actions */}
        <div
          className="flex items-center gap-0.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
          style={{ color: muted }}
          onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            title={note.pinned ? "Unpin" : "Pin"}
            onClick={() => onTogglePin(note.id)}
            className={actionBtn}>
            {note.pinned ? (
              <PinOff size={14} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Pin size={14} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            aria-label={note.archived ? "Restore note" : "Archive note"}
            title={note.archived ? "Restore" : "Archive"}
            onClick={() => onToggleArchive(note.id)}
            className={actionBtn}>
            {note.archived ? (
              <ArchiveRestore size={14} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Archive size={14} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
          {showDeleteAction && onDelete ? (
            <button
              type="button"
              aria-label="Delete note permanently"
              title="Delete forever"
              onClick={() => onDelete(note.id)}
              className={actionBtn}>
              <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
