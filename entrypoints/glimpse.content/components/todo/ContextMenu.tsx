import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Copy,
  GitBranch,
  Pencil,
  Trash2,
  type LucideIcon
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject
} from "react"

import { usePrefersReducedMotion } from "../../hooks/useTheme"

/**
 * Trigger anchor for the context menu. Two flavors:
 *   - `{ kind: 'element', el }` — anchor below an existing button
 *     (e.g. the row's `MoreHorizontal` kebab). Coordinates derive from
 *     the button's bbox.
 *   - `{ kind: 'point', x, y }` — anchor at a cursor position
 *     (right-click on a row).
 *
 * Coordinates are viewport (fixed) since the menu portals through
 * `<PopoverPortal>`, which lives outside the panel's transformed clip box.
 */
export type ContextMenuAnchor =
  | { kind: "element"; el: HTMLElement }
  | { kind: "point"; x: number; y: number }

export interface ContextMenuItem {
  id: string
  label: string
  Icon: LucideIcon
  /** Optional shortcut hint shown right-aligned, e.g. `E`, `⌫`. */
  shortcut?: string
  /** When true, the item renders dimmed and is unclickable / unfocusable. */
  disabled?: boolean
  /** When true, a 1 px divider is drawn ABOVE this item. */
  separatorBefore?: boolean
  /** Optional emphasis colour (e.g. red for Delete). */
  variant?: "default" | "danger"
  onClick: () => void
}

interface ContextMenuProps {
  open: boolean
  onClose: () => void
  anchor: ContextMenuAnchor | null
  items: ContextMenuItem[]
  theme: "light" | "dark"
  /** Outside-click suppression list: clicks on these elements should NOT close the menu. */
  ignoreRefs?: ReadonlyArray<RefObject<HTMLElement | null>>
}

const MENU_WIDTH = 200
const ESTIMATED_ROW_H = 30
const ESTIMATED_PADDING = 8

/** Built-in shared icons so callers don't need to re-import Lucide everywhere. */
export const ContextMenuIcons = {
  Edit: Pencil,
  Date: Calendar,
  Subtask: GitBranch,
  Duplicate: Copy,
  Delete: Trash2,
  MoveUp: ArrowUp,
  MoveDown: ArrowDown
}

export function ContextMenu({
  open,
  onClose,
  anchor,
  items,
  theme,
  ignoreRefs
}: ContextMenuProps) {
  const reduced = usePrefersReducedMotion()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [transformOrigin, setTransformOrigin] = useState("top left")

  // Compute anchor coordinates relative to the panel (position:absolute).
  useLayoutEffect(() => {
    if (!open || !anchor) return

    // Estimate menu height from item count for flip-decision before paint.
    const estHeight =
      items.length * ESTIMATED_ROW_H +
      ESTIMATED_PADDING +
      items.filter((i) => i.separatorBefore).length * 5

    // Find the panel element (nearest role=dialog ancestor). We use it as
    // the coordinate reference because popovers render with position:absolute
    // relative to the panel (the nearest position:fixed ancestor in the tree).
    const anchorEl = anchor.kind === "element" ? anchor.el : null
    const panel = anchorEl?.closest('[role="dialog"]') as HTMLElement | null
    const pr = panel?.getBoundingClientRect() ?? { top: 0, left: 0, width: 360, height: 600 }
    const panelW = pr.width ?? 360
    const panelH = pr.height ?? 600

    let top: number
    let left: number
    let origin: string

    if (anchor.kind === "element") {
      const rect = anchor.el.getBoundingClientRect()
      const wouldOverflowBelow = rect.bottom + 4 - pr.top + estHeight > panelH - 8
      if (wouldOverflowBelow) {
        top = rect.top - pr.top - estHeight - 4
        origin = "bottom right"
      } else {
        top = rect.bottom + 4 - pr.top
        origin = "top right"
      }
      left = rect.right - MENU_WIDTH - pr.left
    } else {
      // Cursor anchor (right-click): convert viewport coords to panel-relative.
      const relX = anchor.x - pr.left
      const relY = anchor.y - pr.top
      const overflowRight = relX + MENU_WIDTH > panelW - 8
      const overflowBottom = relY + estHeight > panelH - 8
      left = overflowRight ? relX - MENU_WIDTH : relX
      top = overflowBottom ? relY - estHeight : relY
      origin =
        (overflowBottom ? "bottom" : "top") +
        " " +
        (overflowRight ? "right" : "left")
    }

    if (left < 4) left = 4
    if (left + MENU_WIDTH > panelW - 4) left = panelW - MENU_WIDTH - 4
    if (top < 4) top = 4

    setCoords({ top, left })
    setTransformOrigin(origin)
  }, [open, anchor, items])

  // Initialize focus on the first non-disabled item when opening.
  useEffect(() => {
    if (!open) return
    const firstEnabled = items.findIndex((i) => !i.disabled)
    setFocusedIndex(firstEnabled === -1 ? 0 : firstEnabled)
  }, [open, items])

  // Move actual DOM focus when focusedIndex changes (so screen readers + a11y track it).
  useEffect(() => {
    if (!open) return
    const el = itemRefs.current[focusedIndex]
    if (el) el.focus()
  }, [open, focusedIndex])

  // Outside-click + Escape handler. Composed-path aware (shadow root).
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const path = e.composedPath()
      if (menuRef.current && path.includes(menuRef.current)) return
      if (anchor?.kind === "element" && path.includes(anchor.el)) return
      if (ignoreRefs) {
        for (const ref of ignoreRefs) {
          const node = ref.current
          if (node && path.includes(node)) return
        }
      }
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setFocusedIndex((idx) => nextEnabled(items, idx, +1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setFocusedIndex((idx) => nextEnabled(items, idx, -1))
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        const item = items[focusedIndex]
        if (item && !item.disabled) {
          item.onClick()
          onClose()
        }
      }
    }
    document.addEventListener("pointerdown", onDown, true)
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("pointerdown", onDown, true)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [open, anchor, items, focusedIndex, onClose, ignoreRefs])

  const handleClick = useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled) return
      item.onClick()
      onClose()
    },
    [onClose]
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

  return (
    <AnimatePresence>
      {open && anchor && (
        <motion.div
          ref={menuRef}
          role="menu"
          aria-label="Task actions"
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
            top: coords.top,
            left: coords.left,
            width: MENU_WIDTH,
            backgroundColor: popoverBg,
            border: popoverBorder,
            borderRadius: 8,
            boxShadow: popoverShadow,
            padding: 4,
            zIndex: 9999,
            transformOrigin
          }}>
            {items.map((item, idx) => {
              const Icon = item.Icon
              const focused = focusedIndex === idx
              const danger = item.variant === "danger"
              const fg = item.disabled
                ? mutedColor
                : danger
                  ? theme === "dark"
                    ? "#f87171"
                    : "#ef4444"
                  : undefined
              return (
                <div key={item.id}>
                  {item.separatorBefore ? (
                    <div
                      className="my-1"
                      style={{ height: 1, backgroundColor: dividerColor }}
                    />
                  ) : null}
                  <button
                    ref={(el) => {
                      itemRefs.current[idx] = el
                    }}
                    type="button"
                    role="menuitem"
                    aria-disabled={item.disabled || undefined}
                    tabIndex={focused ? 0 : -1}
                    disabled={item.disabled}
                    onClick={() => handleClick(item)}
                    onMouseEnter={() => {
                      if (!item.disabled) setFocusedIndex(idx)
                    }}
                    className={
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left " +
                      "focus:outline-none " +
                      (item.disabled
                        ? "opacity-50 cursor-not-allowed "
                        : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
                          "focus-visible:bg-black/[0.04] dark:focus-visible:bg-white/[0.06] ") +
                      (focused && !item.disabled
                        ? "bg-black/[0.04] dark:bg-white/[0.06] "
                        : "")
                    }
                    style={{ color: fg }}>
                    <Icon size={14} strokeWidth={2} aria-hidden="true" />
                    <span className="flex-1 truncate text-[13px] leading-tight">
                      {item.label}
                    </span>
                    {item.shortcut ? (
                      <span
                        className="text-[11px] tabular-nums"
                        style={{ color: mutedColor }}>
                        {item.shortcut}
                      </span>
                    ) : null}
                  </button>
                </div>
              )
            })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Find the next enabled item index in `dir` (+1 or -1), wrapping around. */
function nextEnabled(
  items: ContextMenuItem[],
  from: number,
  dir: 1 | -1
): number {
  if (items.length === 0) return 0
  let i = from
  for (let step = 0; step < items.length; step++) {
    i = (i + dir + items.length) % items.length
    if (!items[i].disabled) return i
  }
  return from
}
