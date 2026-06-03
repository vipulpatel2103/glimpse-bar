import { AnimatePresence, motion } from "framer-motion"
import {
  Archive,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  Maximize2,
  Minimize2,
  Pencil,
  Pin,
  Plus,
  Search,
  StickyNote,
  Tag,
  Trash2,
  X,
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
  isSystemView,
  type LabelId,
  type LabelMeta,
  type NoteLayout,
  type SystemView
} from "~/lib/notes/types"

import { usePrefersReducedMotion } from "../../hooks/useTheme"

export interface ViewCounts {
  all: number
  pinned: number
  archived: number
  perLabel: Record<LabelId, number>
}

interface NotesHeaderProps {
  theme: "light" | "dark"
  activeView: SystemView | LabelId
  labels: LabelMeta[]
  counts: ViewCounts
  onChangeView: (view: SystemView | LabelId) => void
  onCreateLabel: (name: string) => void
  onRenameLabel: (id: LabelId, name: string) => void
  onRemoveLabel: (id: LabelId) => void
  /** Search state (owned by NotesApp). */
  searchOpen: boolean
  query: string
  onToggleSearch: () => void
  onQueryChange: (q: string) => void
  onCloseSearch: () => void
  /** Expanded mode (Step 9). */
  expanded: boolean
  canExpand: boolean
  layout: NoteLayout
  onToggleExpanded: () => void
  onToggleLayout: () => void
}

interface SystemViewMeta {
  id: SystemView
  label: string
  Icon: LucideIcon
}

export const SYSTEM_VIEW_META: SystemViewMeta[] = [
  { id: "pinned", label: "Pinned", Icon: Pin },
  { id: "all", label: "All", Icon: StickyNote },
  { id: "archived", label: "Archived", Icon: Archive }
]

export function NotesHeader({
  theme,
  activeView,
  labels,
  counts,
  onChangeView,
  onCreateLabel,
  onRenameLabel,
  onRemoveLabel,
  searchOpen,
  query,
  onToggleSearch,
  onQueryChange,
  onCloseSearch,
  expanded,
  canExpand,
  layout,
  onToggleExpanded,
  onToggleLayout
}: NotesHeaderProps) {
  const reduced = usePrefersReducedMotion()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")
  const [renamingId, setRenamingId] = useState<LabelId | null>(null)
  const [renameDraft, setRenameDraft] = useState("")
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setCreating(false)
    setNewLabelName("")
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
  let TitleIcon: LucideIcon = StickyNote
  let titleLabel = "All"
  if (isSystemView(activeView)) {
    const meta = SYSTEM_VIEW_META.find((m) => m.id === activeView)
    if (meta) {
      TitleIcon = meta.Icon
      titleLabel = meta.label
    }
  } else {
    const label = labels.find((l) => l.id === activeView)
    if (label) {
      TitleIcon = Tag
      titleLabel = label.name
    }
  }

  const handlePick = useCallback(
    (view: SystemView | LabelId) => {
      onChangeView(view)
      close()
    },
    [onChangeView, close]
  )

  const handleCreateSubmit = useCallback(() => {
    const trimmed = newLabelName.trim()
    if (trimmed) onCreateLabel(trimmed)
    setCreating(false)
    setNewLabelName("")
  }, [newLabelName, onCreateLabel])

  const handleNewLabelKey = useCallback(
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
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const headerBorder =
    theme === "dark"
      ? "1px solid rgba(255,255,255,0.06)"
      : "1px solid rgba(0,0,0,0.06)"

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
        "focus:outline-none focus-visible:bg-black/[0.04] dark:focus-visible:bg-white/[0.06] " +
        (selected ? "bg-black/[0.06] dark:bg-white/[0.10] font-semibold" : "")
      }>
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      <span className="flex-1 truncate text-[13px] leading-tight">{label}</span>
      <span className="text-[12px] tabular-nums" style={{ color: muted }}>
        {count}
      </span>
    </button>
  )

  const iconBtn =
    "flex h-7 w-7 items-center justify-center rounded transition-colors " +
    "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"

  if (searchOpen) {
    return (
      <header
        className="relative z-10 flex h-11 shrink-0 items-center gap-1 px-2"
        style={{ borderBottom: headerBorder }}>
        <Search size={16} strokeWidth={2} aria-hidden="true" style={{ color: muted, marginLeft: 4 }} />
        <input
          autoFocus
          type="search"
          role="searchbox"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault()
              onCloseSearch()
            }
          }}
          placeholder="Search notes…"
          aria-label="Search notes"
          className="h-full flex-1 bg-transparent text-[13px] leading-tight placeholder:text-neutral-500 focus:outline-none"
        />
        <button
          type="button"
          aria-label="Close search"
          title="Close search"
          onClick={onCloseSearch}
          className={iconBtn}
          style={{ color: muted }}>
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>
    )
  }

  return (
    <header
      className="relative z-10 flex h-11 shrink-0 items-center px-3"
      style={{ borderBottom: headerBorder }}>
      {expanded ? (
        // In expanded mode the sidebar drives view switching, so the header
        // collapses to a static title.
        <div className="-ml-1.5 flex max-w-[260px] items-center gap-1.5 px-1.5 py-1">
          <TitleIcon size={16} strokeWidth={2} aria-hidden="true" />
          <span className="truncate text-[14px] font-semibold leading-none">
            {titleLabel}
          </span>
        </div>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={
            "-ml-1.5 flex max-w-[240px] items-center gap-1.5 rounded px-1.5 py-1 " +
            "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          }
          aria-label={`${titleLabel} view — switch view`}
          aria-haspopup="listbox"
          aria-expanded={open}>
          <TitleIcon size={16} strokeWidth={2} aria-hidden="true" />
          <span className="truncate text-[14px] font-semibold leading-none">
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

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          aria-label="Search notes"
          title="Search notes"
          onClick={onToggleSearch}
          className={iconBtn}
          style={{ color: muted }}>
          <Search size={16} strokeWidth={2} aria-hidden="true" />
        </button>
        {expanded ? (
          <button
            type="button"
            aria-label={layout === "grid" ? "List layout" : "Grid layout"}
            title={layout === "grid" ? "List layout" : "Grid layout"}
            onClick={onToggleLayout}
            className={iconBtn}
            style={{ color: muted }}>
            {layout === "grid" ? (
              <ListIcon size={16} strokeWidth={2} aria-hidden="true" />
            ) : (
              <LayoutGrid size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        ) : null}
        {canExpand ? (
          <button
            type="button"
            aria-label={expanded ? "Collapse panel" : "Expand panel"}
            title={expanded ? "Collapse" : "Expand"}
            onClick={onToggleExpanded}
            className={iconBtn}
            style={{ color: muted }}>
            {expanded ? (
              <Minimize2 size={16} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Maximize2 size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {open && !expanded && (
          <motion.div
            ref={popoverRef}
            role="listbox"
            aria-label="Note views"
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
                view.id === "all"
                  ? counts.all
                  : view.id === "pinned"
                    ? counts.pinned
                    : counts.archived,
                view.id === activeView,
                () => handlePick(view.id)
              )
            )}

            {labels.length > 0 && (
              <>
                <div className="my-1" style={{ height: 1, backgroundColor: dividerColor }} />
                <div
                  className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide"
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
                    role="option"
                    aria-selected={label.id === activeView}
                    onClick={() => handlePick(label.id)}
                    className={
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left " +
                      "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
                      "focus:outline-none focus-visible:bg-black/[0.04] dark:focus-visible:bg-white/[0.06] " +
                      (label.id === activeView
                        ? "bg-black/[0.06] dark:bg-white/[0.10] font-semibold"
                        : "")
                    }>
                    <Tag size={14} strokeWidth={2} aria-hidden="true" />
                    <span className="flex-1 truncate text-[13px] leading-tight">
                      {label.name}
                    </span>
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

            <div className="my-1" style={{ height: 1, backgroundColor: dividerColor }} />
            {creating ? (
              <div className="flex items-center gap-2 rounded px-2 py-1.5">
                <Plus size={14} strokeWidth={2} aria-hidden="true" />
                <input
                  autoFocus
                  type="text"
                  value={newLabelName}
                  placeholder="Label name"
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={handleNewLabelKey}
                  onBlur={handleCreateSubmit}
                  className="h-5 flex-1 bg-transparent text-[13px] leading-tight placeholder:text-neutral-500 focus:outline-none"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className={
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left " +
                  "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
                  "focus:outline-none focus-visible:bg-black/[0.04] dark:focus-visible:bg-white/[0.06]"
                }
                style={{ color: muted }}>
                <Plus size={14} strokeWidth={2} aria-hidden="true" />
                <span className="flex-1 text-[13px] leading-tight">New label</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
