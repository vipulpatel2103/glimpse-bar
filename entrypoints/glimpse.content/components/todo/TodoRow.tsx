import { Calendar, CalendarOff, Sun, Trash2 } from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent
} from "react"

import { formatDayLabel, formatDueTooltip, isOverdue } from "~/lib/todos/dates"
import type { TodoItem } from "~/lib/todos/types"

import { DatePopover } from "./DatePopover"

interface TodoRowProps {
  item: TodoItem
  now: number
  theme: "light" | "dark"
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onSetDue: (id: string, dueAt: number | undefined) => void
  onUpdateText: (id: string, text: string) => void
}

function DayChip({
  dueAt,
  now,
  theme
}: {
  dueAt: number
  now: number
  theme: "light" | "dark"
}) {
  const overdue = isOverdue(dueAt, now)
  const label = formatDayLabel(dueAt, now)
  const tooltip = formatDueTooltip(dueAt, now)
  const isToday = label === "Today"

  const bg =
    theme === "dark"
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.05)"
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"

  return (
    <span
      title={tooltip}
      className="flex h-5 shrink-0 items-center gap-1 rounded-full px-1.5"
      style={{
        backgroundColor: bg,
        color: overdue ? (theme === "dark" ? "#f87171" : "#ef4444") : muted
      }}>
      {overdue ? (
        <span
          aria-hidden="true"
          className="block h-1 w-1 rounded-full"
          style={{
            backgroundColor: theme === "dark" ? "#f87171" : "#ef4444"
          }}
        />
      ) : null}
      {isToday ? (
        <Sun size={11} strokeWidth={2.25} aria-hidden="true" />
      ) : (
        <span className="text-[10px] font-medium leading-none">{label}</span>
      )}
    </span>
  )
}

interface HoverIconButtonProps {
  label: string
  Icon: typeof Sun
  onClick: () => void
  theme: "light" | "dark"
  forwardedRef?: React.Ref<HTMLButtonElement>
}

function HoverIconButton({
  label,
  Icon,
  onClick,
  theme,
  forwardedRef
}: HoverIconButtonProps) {
  return (
    <button
      ref={forwardedRef}
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={label}
      title={label}
      className={
        "flex h-6 w-6 items-center justify-center rounded " +
        "hover:bg-black/[0.06] dark:hover:bg-white/[0.10] " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      }
      style={{ color: theme === "dark" ? "#a3a3a3" : "#737373" }}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
    </button>
  )
}

export function TodoRow({
  item,
  now,
  theme,
  onToggle,
  onDelete,
  onSetDue,
  onUpdateText
}: TodoRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.text)
  const calendarBtnRef = useRef<HTMLButtonElement | null>(null)
  const editInputRef = useRef<HTMLInputElement | null>(null)
  // Lets blur tell apart "user committed via Enter/Esc" (handled already)
  // from "user clicked away" (still needs commit).
  const skipBlurRef = useRef(false)

  // Refresh draft if the row's text changes externally (e.g. cross-tab sync).
  useEffect(() => {
    if (!editing) setDraft(item.text)
  }, [item.text, editing])

  const startEdit = useCallback(() => {
    if (item.done) return
    setDraft(item.text)
    setEditing(true)
  }, [item.text, item.done])

  const commitEdit = useCallback(() => {
    const trimmed = draft.trim()
    setEditing(false)
    if (!trimmed) {
      onDelete(item.id)
      return
    }
    if (trimmed !== item.text) onUpdateText(item.id, trimmed)
  }, [draft, item.id, item.text, onDelete, onUpdateText])

  const cancelEdit = useCallback(() => {
    skipBlurRef.current = true
    setEditing(false)
    setDraft(item.text)
  }, [item.text])

  const handleEditKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        skipBlurRef.current = true
        commitEdit()
      } else if (e.key === "Escape") {
        e.preventDefault()
        cancelEdit()
      }
    },
    [commitEdit, cancelEdit]
  )

  const handleEditBlur = useCallback(() => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false
      return
    }
    commitEdit()
  }, [commitEdit])

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (editing) return
      if (e.key === "Enter" || e.key === "F2" || e.key === "e") {
        e.preventDefault()
        startEdit()
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault()
        onDelete(item.id)
      }
    },
    [editing, item.id, onDelete, startEdit]
  )

  const handleScheduleToday = useCallback(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    onSetDue(item.id, start.getTime())
  }, [item.id, onSetDue])

  const handleRemoveDate = useCallback(() => {
    onSetDue(item.id, undefined)
  }, [item.id, onSetDue])

  return (
    <>
      <div
        role="listitem"
        tabIndex={0}
        onKeyDown={handleKey}
        className={
          "group relative flex h-8 items-center gap-2 rounded px-2 " +
          "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        }>
        <button
          type="button"
          role="checkbox"
          aria-checked={item.done}
          aria-label={
            item.done
              ? `Mark "${item.text}" as not done`
              : `Mark "${item.text}" as done`
          }
          onClick={() => onToggle(item.id)}
          className={
            "flex h-4 w-4 shrink-0 items-center justify-center rounded " +
            "border transition-colors " +
            (item.done
              ? "border-blue-500 bg-blue-500"
              : "border-black/30 dark:border-white/35 hover:border-blue-500")
          }
          style={{
            color: item.done
              ? theme === "dark"
                ? "#0a0a0a"
                : "#ffffff"
              : "transparent"
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
        {editing ? (
          <input
            ref={editInputRef}
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleEditKey}
            onBlur={handleEditBlur}
            onClick={(e) => e.stopPropagation()}
            aria-label="Edit task"
            className={
              "h-5 flex-1 bg-transparent text-[13px] leading-tight " +
              "focus:outline-none"
            }
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            disabled={item.done}
            title={item.done ? undefined : "Click to edit"}
            className={
              "min-w-0 truncate text-left text-[13px] leading-tight " +
              "transition-opacity duration-200 cursor-text shrink " +
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded " +
              (item.done ? "line-through opacity-50 cursor-default" : "")
            }
            style={{ flex: "0 1 auto" }}>
            {item.text}
          </button>
        )}
        {item.dueAt !== undefined ? (
          <DayChip dueAt={item.dueAt} now={now} theme={theme} />
        ) : null}
        {/* Spacer pushes hover-actions to the right edge while keeping
            the day chip immediately adjacent to the task text. */}
        <div className="flex-1" />
        <div
          className={
            "flex items-center gap-0.5 transition-opacity duration-100 " +
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          }>
          {item.dueAt === undefined ? (
            <HoverIconButton
              label="Schedule for today"
              Icon={Sun}
              onClick={handleScheduleToday}
              theme={theme}
            />
          ) : (
            <HoverIconButton
              label="Remove date"
              Icon={CalendarOff}
              onClick={handleRemoveDate}
              theme={theme}
            />
          )}
          <HoverIconButton
            label="Pick a date"
            Icon={Calendar}
            onClick={() => setPickerOpen(true)}
            theme={theme}
            forwardedRef={calendarBtnRef}
          />
          <HoverIconButton
            label={`Delete "${item.text}"`}
            Icon={Trash2}
            onClick={() => onDelete(item.id)}
            theme={theme}
          />
        </div>
      </div>
      <DatePopover
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        anchorRef={calendarBtnRef}
        currentDueAt={item.dueAt}
        onPick={(dueAt) => onSetDue(item.id, dueAt)}
        theme={theme}
      />
    </>
  )
}
