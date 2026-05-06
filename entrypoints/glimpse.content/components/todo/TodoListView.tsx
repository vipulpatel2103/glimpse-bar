import type { LucideIcon } from "lucide-react"
import { useCallback, useState, type DragEvent } from "react"

import type { SortMode, TodoItem } from "~/lib/todos/types"

import { TodoRow } from "./TodoRow"

const DRAG_MIME = "application/x-glimpse-todo-id"

// 2 cols × 3 rows of 2px dots — reads as `:::` and signals grippable.
// Hand-rolled per design system (no Lucide icon for drag grips).
function GripDots({ theme }: { theme: "light" | "dark" }) {
  const color =
    theme === "dark" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)"
  return (
    <span
      aria-hidden="true"
      className="grid grid-cols-2"
      style={{ gap: 2, pointerEvents: "none" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 2,
            height: 2,
            borderRadius: 9999,
            backgroundColor: color
          }}
        />
      ))}
    </span>
  )
}

interface TodoListViewProps {
  items: TodoItem[]
  now: number
  emptyHint: string
  EmptyIcon?: LucideIcon
  theme: "light" | "dark"
  /**
   * Per-item color lookup (Today / Inbox / Completed — items span many lists).
   * Takes priority over flat `listColor`.
   */
  colorOf?: (listId: string) => string | undefined
  /** Flat color for a single-list view (custom list view only). */
  listColor?: string
  /** Drives Move up / Move down items in row context menus. */
  sortMode?: SortMode
  /** Returns child subtasks for a given parent id (already sorted). */
  childrenOf?: (parentId: string) => TodoItem[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onSetDue: (id: string, dueAt: number | undefined) => void
  onUpdateText: (id: string, text: string) => void
  onDuplicate?: (id: string) => void
  onReorder?: (id: string, direction: -1 | 1) => void
  onAddSubtask?: (parentId: string, text: string) => void
  /**
   * Enables drag-drop reorder of the visible items. When provided, each row
   * becomes draggable and dropping fires this callback with the destination
   * neighbor and side. Today view wires this; other views leave it undefined.
   */
  onDragReorder?: (
    fromId: string,
    toId: string,
    place: "before" | "after"
  ) => void
}

export function TodoListView({
  items,
  now,
  emptyHint,
  EmptyIcon,
  theme,
  colorOf,
  listColor,
  sortMode,
  childrenOf,
  onToggle,
  onDelete,
  onSetDue,
  onUpdateText,
  onDuplicate,
  onReorder,
  onAddSubtask,
  onDragReorder
}: TodoListViewProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [overPlace, setOverPlace] = useState<"before" | "after" | null>(null)

  const dragEnabled = onDragReorder !== undefined

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, id: string) => {
      if (!dragEnabled) return
      // Stash the id on the dataTransfer so cross-instance / cross-shadow drags
      // still work even if React state re-mounts the source. State copy is for
      // visual feedback only.
      e.dataTransfer.setData(DRAG_MIME, id)
      e.dataTransfer.effectAllowed = "move"
      setDragId(id)
    },
    [dragEnabled]
  )

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, id: string) => {
      if (!dragEnabled) return
      // Without preventDefault the browser refuses to fire `drop`.
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      const rect = e.currentTarget.getBoundingClientRect()
      const place: "before" | "after" =
        e.clientY < rect.top + rect.height / 2 ? "before" : "after"
      if (id !== overId) setOverId(id)
      if (place !== overPlace) setOverPlace(place)
    },
    [dragEnabled, overId, overPlace]
  )

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      // Only clear when leaving the row entirely (relatedTarget outside it).
      const next = e.relatedTarget as Node | null
      if (next && e.currentTarget.contains(next)) return
      setOverId((prev) => prev)
    },
    []
  )

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, toId: string) => {
      if (!dragEnabled) return
      e.preventDefault()
      const fromId =
        e.dataTransfer.getData(DRAG_MIME) || dragId || ""
      setDragId(null)
      setOverId(null)
      setOverPlace(null)
      if (!fromId || fromId === toId) return
      const rect = e.currentTarget.getBoundingClientRect()
      const place: "before" | "after" =
        e.clientY < rect.top + rect.height / 2 ? "before" : "after"
      onDragReorder?.(fromId, toId, place)
    },
    [dragEnabled, dragId, onDragReorder]
  )

  const handleDragEnd = useCallback(() => {
    setDragId(null)
    setOverId(null)
    setOverPlace(null)
  }, [])

  if (items.length === 0) {
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

  const indicatorColor =
    theme === "dark" ? "rgba(96,165,250,0.9)" : "rgba(37,99,235,0.9)"

  // When draggable, reserve a 14px left gutter on the list container so the
  // grip lives OUTSIDE the row (no collision with the row's chevron slot).
  const listClass = dragEnabled
    ? "flex flex-1 flex-col gap-px overflow-y-auto pr-1 py-1"
    : "flex flex-1 flex-col gap-px overflow-y-auto px-1 py-1"
  const listStyle: React.CSSProperties | undefined = dragEnabled
    ? { paddingLeft: 14 }
    : undefined

  return (
    <div role="list" className={listClass} style={listStyle}>
      {items.map((item) => {
        const isDragging = dragId === item.id
        const showBefore =
          dragEnabled &&
          overId === item.id &&
          overPlace === "before" &&
          dragId !== item.id
        const showAfter =
          dragEnabled &&
          overId === item.id &&
          overPlace === "after" &&
          dragId !== item.id
        return (
          <div
            key={item.id}
            draggable={dragEnabled}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={handleDragEnd}
            className={dragEnabled ? "group/dh" : undefined}
            style={{
              position: "relative",
              opacity: isDragging ? 0.4 : 1,
              cursor: dragEnabled ? "grab" : undefined
            }}>
            {dragEnabled ? (
              // Grip lives in the list container's reserved 14px left gutter
              // (left:-12 inside this relative wrapper). Outside the row's
              // hover/content area, so it never collides with the chevron.
              // Subtle by default, brightens on row hover.
              <span
                aria-hidden="true"
                title="Drag to reorder"
                className="opacity-30 transition-opacity duration-100 group-hover/dh:opacity-90"
                style={{
                  position: "absolute",
                  left: -12,
                  // TodoRow is h-8 (32px). Pin grip to the parent row only —
                  // wrapper height grows when subtasks render, but grip must
                  // stay aligned with the parent's checkbox.
                  top: 0,
                  height: 32,
                  width: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 1
                }}>
                <GripDots theme={theme} />
              </span>
            ) : null}
            {showBefore ? (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 4,
                  right: 4,
                  top: -1,
                  height: 2,
                  borderRadius: 2,
                  backgroundColor: indicatorColor,
                  pointerEvents: "none"
                }}
              />
            ) : null}
            <TodoRow
              item={item}
              now={now}
              theme={theme}
              listColor={colorOf ? colorOf(item.listId) : listColor}
              subtasks={childrenOf ? childrenOf(item.id) : undefined}
              sortMode={sortMode}
              onToggle={onToggle}
              onDelete={onDelete}
              onSetDue={onSetDue}
              onUpdateText={onUpdateText}
              onDuplicate={onDuplicate}
              onReorder={onReorder}
              onAddSubtask={onAddSubtask}
            />
            {showAfter ? (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 4,
                  right: 4,
                  bottom: -1,
                  height: 2,
                  borderRadius: 2,
                  backgroundColor: indicatorColor,
                  pointerEvents: "none"
                }}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
