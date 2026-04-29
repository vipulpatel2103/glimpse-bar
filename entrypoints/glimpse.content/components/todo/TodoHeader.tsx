import { AnimatePresence, motion } from "framer-motion"
import {
  CalendarRange,
  CheckCheck,
  ChevronDown,
  Inbox,
  List,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  Sunrise,
  Trash2,
  type LucideIcon
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent
} from "react"

import {
  INBOX_LIST_ID,
  type ListId,
  type ListMeta,
  type SystemView
} from "~/lib/todos/types"

import { usePrefersReducedMotion } from "../../hooks/useTheme"

interface TodoHeaderProps {
  theme: "light" | "dark"
  /** SystemView or ListId. */
  activeView: SystemView | ListId
  lists: ListMeta[]
  counts: {
    today: number
    upcoming: number
    inbox: number
    completed: number
    perList: Record<ListId, number>
  }
  /** When true, the panel is in expanded mode and the dropdown collapses to a static title. */
  expanded: boolean
  /** When false, the maximize/minimize button is hidden (viewport too narrow). */
  canExpand: boolean
  onToggleExpanded: () => void
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

export const SYSTEM_VIEW_META: ViewMeta[] = [
  { id: "today", label: "Today", Icon: Sunrise },
  { id: "upcoming", label: "Upcoming", Icon: CalendarRange },
  { id: "inbox", label: "Inbox", Icon: Inbox },
  { id: "completed", label: "Completed", Icon: CheckCheck }
]

function isSystemViewId(view: string): view is SystemView {
  return SYSTEM_VIEW_META.some((m) => m.id === view)
}

export function TodoHeader({
  theme,
  activeView,
  lists,
  counts,
  expanded,
  canExpand,
  onToggleExpanded,
  onChangeView,
  onCreateList,
  onRenameList,
  onRemoveList
}: TodoHeaderProps) {
  const reduced = usePrefersReducedMotion()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [renamingId, setRenamingId] = useState<ListId | null>(null)
  const [renameDraft, setRenameDraft] = useState("")
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const newListInputRef = useRef<HTMLInputElement | null>(null)
  const renameInputRef = useRef<HTMLInputElement | null>(null)

  // Custom lists exclude Inbox (Inbox surfaces under "system" Inbox view).
  const customLists = lists.filter((l) => l.id !== INBOX_LIST_ID)

  const close = useCallback(() => {
    setOpen(false)
    setCreating(false)
    setNewListName("")
    setRenamingId(null)
    setRenameDraft("")
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const path = e.composedPath()
      if (popoverRef.current && path.includes(popoverRef.current)) return
      if (triggerRef.current && path.includes(triggerRef.current)) return
      close()
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        close()
      }
    }
    document.addEventListener("pointerdown", onDown, true)
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("pointerdown", onDown, true)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [open, close])

  // Resolve current title.
  let titleIcon: LucideIcon = List
  let titleLabel = "List"
  if (isSystemViewId(activeView)) {
    const meta = SYSTEM_VIEW_META.find((m) => m.id === activeView)
    if (meta) {
      titleIcon = meta.Icon
      titleLabel = meta.label
    }
  } else {
    const list = lists.find((l) => l.id === activeView)
    if (list) {
      titleIcon = list.id === INBOX_LIST_ID ? Inbox : List
      titleLabel = list.name
    }
  }
  const TitleIcon = titleIcon

  const handlePick = useCallback(
    (view: SystemView | ListId) => {
      onChangeView(view)
      close()
    },
    [onChangeView, close]
  )

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

  const popoverBg = theme === "dark" ? "#0a0a0a" : "#ffffff"
  const popoverBorder =
    theme === "dark"
      ? "1px solid rgba(255,255,255,0.10)"
      : "1px solid rgba(0,0,0,0.10)"
  const popoverShadow =
    theme === "dark"
      ? "0 8px 24px rgba(0,0,0,0.6)"
      : "0 8px 24px rgba(0,0,0,0.18)"
  const dividerColor =
    theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
  const mutedColor = theme === "dark" ? "#a3a3a3" : "#737373"

  const renderViewRow = (
    Icon: LucideIcon,
    label: string,
    count: number,
    selected: boolean,
    onClick: () => void
  ) => (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left " +
        "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
        "focus:outline-none focus-visible:bg-black/[0.04] " +
        "dark:focus-visible:bg-white/[0.06] " +
        (selected
          ? "bg-black/[0.06] dark:bg-white/[0.10] font-semibold"
          : "")
      }>
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      <span className="flex-1 text-[13px] leading-tight truncate">{label}</span>
      <span
        className="text-[12px] tabular-nums"
        style={{ color: mutedColor }}>
        {count}
      </span>
    </button>
  )

  const ToggleIcon = expanded ? Minimize2 : Maximize2

  return (
    <header
      className="relative z-10 flex h-11 shrink-0 items-center px-3"
      style={{
        borderBottom:
          theme === "dark"
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(0,0,0,0.06)"
      }}>
      {expanded ? (
        // In expanded mode the sidebar drives view switching, so the
        // header collapses to a static title.
        <div className="flex items-center gap-1.5 -ml-1.5 px-1.5 py-1 max-w-[400px]">
          <TitleIcon size={14} strokeWidth={2} aria-hidden="true" />
          <span className="text-[14px] font-semibold leading-none truncate">
            {titleLabel}
          </span>
        </div>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={
            "flex items-center gap-1.5 rounded px-1.5 py-1 -ml-1.5 " +
            "max-w-[260px] " +
            "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          }
          aria-label={`${titleLabel} view — switch view`}
          aria-haspopup="listbox"
          aria-expanded={open}>
          <TitleIcon size={14} strokeWidth={2} aria-hidden="true" />
          <span className="text-[14px] font-semibold leading-none truncate">
            {titleLabel}
          </span>
          <ChevronDown
            size={12}
            strokeWidth={2}
            aria-hidden="true"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: reduced ? "none" : "transform 140ms ease-out"
            }}
          />
        </button>
      )}

      {canExpand ? (
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-label={expanded ? "Collapse panel" : "Expand panel"}
          title={expanded ? "Collapse" : "Expand"}
          className={
            "ml-auto flex h-7 w-7 items-center justify-center rounded transition-colors " +
            "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          }
          style={{ color: theme === "dark" ? "#a3a3a3" : "#737373" }}>
          <ToggleIcon size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}

      <AnimatePresence>
        {open && !expanded && (
          <motion.div
            ref={popoverRef}
            role="listbox"
            aria-label="Task views"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: reduced
                ? { duration: 0 }
                : { duration: 0.18, ease: [0.32, 0.72, 0, 1] }
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: -4,
              transition: reduced
                ? { duration: 0 }
                : { duration: 0.14, ease: [0.4, 0, 1, 1] }
            }}
            style={{
              position: "absolute",
              top: 44,
              left: 8,
              width: 240,
              maxHeight: "70vh",
              overflowY: "auto",
              backgroundColor: popoverBg,
              border: popoverBorder,
              borderRadius: 8,
              boxShadow: popoverShadow,
              padding: 4,
              transformOrigin: "top left"
            }}>
            {SYSTEM_VIEW_META.map((view) =>
              renderViewRow(
                view.Icon,
                view.label,
                counts[view.id],
                view.id === activeView,
                () => handlePick(view.id)
              )
            )}

            {customLists.length > 0 && (
              <>
                <div
                  className="my-1"
                  style={{ height: 1, backgroundColor: dividerColor }}
                />
                <div
                  className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: mutedColor }}>
                  Lists
                </div>
              </>
            )}

            {customLists.map((list) =>
              renamingId === list.id ? (
                <div
                  key={list.id}
                  className="flex items-center gap-2 rounded px-2 py-1.5">
                  <List size={14} strokeWidth={2} aria-hidden="true" />
                  <input
                    ref={renameInputRef}
                    autoFocus
                    type="text"
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={handleRenameKey}
                    onBlur={handleRenameCommit}
                    className={
                      "h-5 flex-1 bg-transparent text-[13px] leading-tight " +
                      "focus:outline-none"
                    }
                  />
                </div>
              ) : (
                <div
                  key={list.id}
                  className="group relative flex items-center rounded">
                  <button
                    type="button"
                    role="option"
                    aria-selected={list.id === activeView}
                    onClick={() => handlePick(list.id)}
                    className={
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left " +
                      "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
                      "focus:outline-none focus-visible:bg-black/[0.04] " +
                      "dark:focus-visible:bg-white/[0.06] " +
                      (list.id === activeView
                        ? "bg-black/[0.06] dark:bg-white/[0.10] font-semibold"
                        : "")
                    }>
                    <List size={14} strokeWidth={2} aria-hidden="true" />
                    <span className="flex-1 text-[13px] leading-tight truncate">
                      {list.name}
                    </span>
                    <span
                      className={
                        "text-[12px] tabular-nums transition-opacity duration-100 " +
                        "group-hover:opacity-0"
                      }
                      style={{ color: mutedColor }}>
                      {counts.perList[list.id] ?? 0}
                    </span>
                  </button>
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
                      style={{ color: mutedColor }}>
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
                      style={{ color: mutedColor }}>
                      <Trash2 size={12} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )
            )}

            <div
              className="my-1"
              style={{ height: 1, backgroundColor: dividerColor }}
            />
            {creating ? (
              <div className="flex items-center gap-2 rounded px-2 py-1.5">
                <Plus size={14} strokeWidth={2} aria-hidden="true" />
                <input
                  ref={newListInputRef}
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
                className={
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left " +
                  "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
                  "focus:outline-none focus-visible:bg-black/[0.04] " +
                  "dark:focus-visible:bg-white/[0.06]"
                }
                style={{ color: mutedColor }}>
                <Plus size={14} strokeWidth={2} aria-hidden="true" />
                <span className="flex-1 text-[13px] leading-tight">New list</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
