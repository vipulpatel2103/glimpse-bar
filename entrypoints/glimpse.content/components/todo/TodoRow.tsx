import {
  Calendar,
  CalendarOff,
  ChevronDown,
  ChevronRight,
  GitBranch,
  MoreHorizontal,
  Sun,
  Trash2
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent
} from "react"

import { formatDayLabel, formatDueTooltip, isOverdue, isSameDay } from "~/lib/todos/dates"
import type { SortMode, TodoItem } from "~/lib/todos/types"

import {
  ContextMenu,
  ContextMenuIcons,
  type ContextMenuAnchor,
  type ContextMenuItem
} from "./ContextMenu"
import { DatePopover } from "./DatePopover"
import { TodoSubtasks, type TodoSubtasksHandle } from "./TodoSubtasks"

interface TodoRowProps {
  item: TodoItem
  now: number
  theme: "light" | "dark"
  /** Color of the list this task belongs to (custom lists only). */
  listColor?: string
  /** Subtasks of this row; `undefined` means subtasks aren't supported in this
   *  view (e.g. nested rows, or system views that don't carry the prop). */
  subtasks?: TodoItem[]
  /** Drives whether `Move up` / `Move down` items appear in the context menu. */
  sortMode?: SortMode
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onSetDue: (id: string, dueAt: number | undefined) => void
  onUpdateText: (id: string, text: string) => void
  onDuplicate?: (id: string) => void
  onReorder?: (id: string, direction: -1 | 1) => void
  onAddSubtask?: (parentId: string, text: string) => void
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
  listColor,
  subtasks,
  sortMode,
  onToggle,
  onDelete,
  onSetDue,
  onUpdateText,
  onDuplicate,
  onReorder,
  onAddSubtask
}: TodoRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.text)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<ContextMenuAnchor | null>(null)
  // Subtasks default to expanded for small parents (<5), collapsed otherwise.
  // Session-only — no storage per Step 6 spec.
  const [expanded, setExpanded] = useState(() => (subtasks?.length ?? 0) < 5)
  // Surfaces the `+ New subtask` row even when this parent has no children
  // yet — set true by the "Add subtask" hover button / context-menu action.
  const [subtaskInputOpen, setSubtaskInputOpen] = useState(false)
  const calendarBtnRef = useRef<HTMLButtonElement | null>(null)
  const kebabBtnRef = useRef<HTMLButtonElement | null>(null)
  const editInputRef = useRef<HTMLInputElement | null>(null)
  const subtasksRef = useRef<TodoSubtasksHandle | null>(null)
  // Lets blur tell apart "user committed via Enter/Esc" (handled already)
  // from "user clicked away" (still needs commit).
  const skipBlurRef = useRef(false)

  const dueIsToday =
    item.dueAt !== undefined && isSameDay(item.dueAt, now)
  const hasChildren = (subtasks?.length ?? 0) > 0
  const supportsSubtasks =
    onAddSubtask !== undefined && item.parentId === undefined

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

  const handleScheduleToday = useCallback(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    onSetDue(item.id, start.getTime())
  }, [item.id, onSetDue])

  const handleRemoveDate = useCallback(() => {
    onSetDue(item.id, undefined)
  }, [item.id, onSetDue])

  const openSubtaskInput = useCallback(() => {
    if (!supportsSubtasks) return
    setExpanded(true)
    setSubtaskInputOpen(true)
    // Defer focus until after the list re-renders the input on next paint.
    // Two rAFs because the first paint may still be mounting <TodoSubtasks>
    // when this row had no children before — subtasksRef populates only
    // after that mount lands.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => subtasksRef.current?.focusNewInput())
    )
  }, [supportsSubtasks])

  const handleDuplicate = useCallback(() => {
    onDuplicate?.(item.id)
  }, [item.id, onDuplicate])

  const handleMoveUp = useCallback(() => {
    onReorder?.(item.id, -1)
  }, [item.id, onReorder])

  const handleMoveDown = useCallback(() => {
    onReorder?.(item.id, +1)
  }, [item.id, onReorder])

  // Build context-menu items contextually. Order matches Step 6 spec:
  //   Edit (E) · Date · Add subtask · Duplicate · Move up/down · Delete (⌫)
  const menuItems = useMemo<ContextMenuItem[]>(() => {
    const list: ContextMenuItem[] = []
    list.push({
      id: "edit",
      label: "Edit",
      Icon: ContextMenuIcons.Edit,
      shortcut: "E",
      disabled: item.done,
      onClick: startEdit
    })
    list.push({
      id: "date",
      label: "Date…",
      Icon: ContextMenuIcons.Date,
      onClick: () => setPickerOpen(true)
    })
    if (supportsSubtasks) {
      list.push({
        id: "add-subtask",
        label: "Add subtask",
        Icon: ContextMenuIcons.Subtask,
        onClick: openSubtaskInput
      })
    }
    if (onDuplicate) {
      list.push({
        id: "duplicate",
        label: "Duplicate",
        Icon: ContextMenuIcons.Duplicate,
        onClick: handleDuplicate
      })
    }
    if (sortMode === "manual" && onReorder) {
      list.push({
        id: "move-up",
        label: "Move up",
        Icon: ContextMenuIcons.MoveUp,
        separatorBefore: true,
        onClick: handleMoveUp
      })
      list.push({
        id: "move-down",
        label: "Move down",
        Icon: ContextMenuIcons.MoveDown,
        onClick: handleMoveDown
      })
    }
    list.push({
      id: "delete",
      label: "Delete",
      Icon: ContextMenuIcons.Delete,
      shortcut: "⌫",
      separatorBefore: true,
      variant: "danger",
      onClick: () => onDelete(item.id)
    })
    return list
  }, [
    item.id,
    item.done,
    sortMode,
    supportsSubtasks,
    onDuplicate,
    onReorder,
    startEdit,
    openSubtaskInput,
    handleDuplicate,
    handleMoveUp,
    handleMoveDown,
    onDelete
  ])

  const openMenuFromKebab = useCallback(() => {
    const el = kebabBtnRef.current
    if (!el) return
    setMenuAnchor({ kind: "element", el })
    setMenuOpen(true)
  }, [])

  const openMenuAtPoint = useCallback((e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuAnchor({ kind: "point", x: e.clientX, y: e.clientY })
    setMenuOpen(true)
  }, [])

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (editing) return
      if (e.key === "Enter" || e.key === "F2" || e.key === "e") {
        e.preventDefault()
        startEdit()
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault()
        onDelete(item.id)
      } else if (e.key === "E" && e.shiftKey) {
        // Shift+E mirrors the "Edit (E)" affordance from the context menu.
        e.preventDefault()
        startEdit()
      }
    },
    [editing, item.id, onDelete, startEdit]
  )

  const ChevronIcon = expanded ? ChevronDown : ChevronRight

  return (
    <>
      <div
        role="listitem"
        tabIndex={0}
        onKeyDown={handleKey}
        onContextMenu={openMenuAtPoint}
        className={
          "group relative flex h-8 items-center gap-2 rounded px-2 " +
          "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        }>
        {/* Colored left stripe — only for custom-list tasks */}
        {listColor ? (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              top: "20%",
              height: "60%",
              width: 2.5,
              borderRadius: 2,
              backgroundColor: listColor,
              flexShrink: 0
            }}
          />
        ) : null}
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
            aria-expanded={expanded}
            title={expanded ? "Collapse subtasks" : "Expand subtasks"}
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
            className={
              "flex h-4 w-4 shrink-0 items-center justify-center rounded " +
              "hover:bg-black/[0.06] dark:hover:bg-white/[0.10] " +
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            }
            style={{ color: theme === "dark" ? "#a3a3a3" : "#737373" }}>
            <ChevronIcon size={12} strokeWidth={2.25} aria-hidden="true" />
          </button>
        ) : (
          // Empty 16px slot keeps the checkbox column-aligned with rows that
          // do have a chevron.
          <span aria-hidden="true" className="block h-4 w-4 shrink-0" />
        )}
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
          {/* "Schedule for today" surfaces whenever the row is not already
              scheduled for today (so it shows on Inbox + Upcoming + overdue
              rows alike). "Remove date" appears whenever a date exists. */}
          {!dueIsToday ? (
            <HoverIconButton
              label="Schedule for today"
              Icon={Sun}
              onClick={handleScheduleToday}
              theme={theme}
            />
          ) : null}
          {item.dueAt !== undefined ? (
            <HoverIconButton
              label="Remove date"
              Icon={CalendarOff}
              onClick={handleRemoveDate}
              theme={theme}
            />
          ) : null}
          <HoverIconButton
            label="Pick a date"
            Icon={Calendar}
            onClick={() => setPickerOpen(true)}
            theme={theme}
            forwardedRef={calendarBtnRef}
          />
          {supportsSubtasks ? (
            <HoverIconButton
              label="Add subtask"
              Icon={GitBranch}
              onClick={openSubtaskInput}
              theme={theme}
            />
          ) : null}
          <HoverIconButton
            label="More actions"
            Icon={MoreHorizontal}
            onClick={openMenuFromKebab}
            theme={theme}
            forwardedRef={kebabBtnRef}
          />
          <HoverIconButton
            label={`Delete "${item.text}"`}
            Icon={Trash2}
            onClick={() => onDelete(item.id)}
            theme={theme}
          />
        </div>
      </div>
      {supportsSubtasks &&
      expanded &&
      (hasChildren || subtaskInputOpen) ? (
        <TodoSubtasks
          ref={subtasksRef}
          parentId={item.id}
          items={subtasks ?? []}
          now={now}
          theme={theme}
          sortMode={sortMode}
          onToggle={onToggle}
          onDelete={onDelete}
          onSetDue={onSetDue}
          onUpdateText={onUpdateText}
          onDuplicate={onDuplicate ?? (() => {})}
          onReorder={onReorder}
          onAddSubtask={onAddSubtask!}
        />
      ) : null}
      <DatePopover
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        anchorRef={calendarBtnRef}
        currentDueAt={item.dueAt}
        onPick={(dueAt) => onSetDue(item.id, dueAt)}
        theme={theme}
      />
      <ContextMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchor={menuAnchor}
        items={menuItems}
        theme={theme}
      />
    </>
  )
}
