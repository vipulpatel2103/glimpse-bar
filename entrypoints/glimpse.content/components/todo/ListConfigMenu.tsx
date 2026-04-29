import { AnimatePresence, motion } from "framer-motion"
import { Pin } from "lucide-react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject
} from "react"

import type {
  NewTaskPosition,
  ShowCompletedWindow,
  SortMode
} from "~/lib/todos/types"

import { usePrefersReducedMotion } from "../../hooks/useTheme"
import { PopoverPortal } from "../PopoverPortal"

interface ListConfigMenuProps {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  theme: "light" | "dark"
  // Per-list config (only present when a list is the active view).
  sort?: SortMode
  newTaskPosition?: NewTaskPosition
  showCompleted?: ShowCompletedWindow
  onChangeSort?: (mode: SortMode) => void
  onChangeNewTaskPosition?: (pos: NewTaskPosition) => void
  onChangeShowCompleted?: (window: ShowCompletedWindow) => void
  // Global UI flag.
  pinned: boolean
  onTogglePinned: (next: boolean) => void
}

const POPOVER_WIDTH = 240

function Section({
  title,
  theme,
  children
}: {
  title: string
  theme: "light" | "dark"
  children: React.ReactNode
}) {
  return (
    <div className="px-1 py-1">
      <div
        className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: theme === "dark" ? "#a3a3a3" : "#737373" }}>
        {title}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

interface RadioRowProps {
  label: string
  selected: boolean
  onClick: () => void
  theme: "light" | "dark"
}

function RadioRow({ label, selected, onClick, theme }: RadioRowProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left " +
        "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
        "focus:outline-none focus-visible:bg-black/[0.04] " +
        "dark:focus-visible:bg-white/[0.06]"
      }>
      <span
        className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full border"
        style={{
          borderColor: selected
            ? "#3b82f6"
            : theme === "dark"
              ? "rgba(255,255,255,0.35)"
              : "rgba(0,0,0,0.30)"
        }}>
        {selected ? (
          <span
            className="block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "#3b82f6" }}
          />
        ) : null}
      </span>
      <span className="flex-1 text-[13px] leading-tight">{label}</span>
    </button>
  )
}

export function ListConfigMenu({
  open,
  onClose,
  anchorRef,
  theme,
  sort,
  newTaskPosition,
  showCompleted,
  onChangeSort,
  onChangeNewTaskPosition,
  onChangeShowCompleted,
  pinned,
  onTogglePinned
}: ListConfigMenuProps) {
  const reduced = usePrefersReducedMotion()
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!open) return
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    // Portal target lives outside the panel's transform + overflow clip,
    // so viewport coordinates apply directly.
    let left = rect.right - POPOVER_WIDTH
    if (left < 8) left = 8
    const estimatedHeight = 320
    const top = rect.top - estimatedHeight - 4
    setCoords({ top, left })
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const path = e.composedPath()
      if (popoverRef.current && path.includes(popoverRef.current)) return
      if (anchorRef.current && path.includes(anchorRef.current)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener("pointerdown", onDown, true)
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("pointerdown", onDown, true)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [open, onClose, anchorRef])

  const handlePinToggle = useCallback(() => {
    onTogglePinned(!pinned)
  }, [pinned, onTogglePinned])

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

  const showListSections =
    sort !== undefined &&
    newTaskPosition !== undefined &&
    showCompleted !== undefined

  return (
    <PopoverPortal>
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popoverRef}
          role="menu"
          aria-label="List settings"
          initial={{ opacity: 0, scale: 0.96, y: 4 }}
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
            y: 4,
            transition: reduced
              ? { duration: 0 }
              : { duration: 0.14, ease: [0.4, 0, 1, 1] }
          }}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: POPOVER_WIDTH,
            backgroundColor: popoverBg,
            border: popoverBorder,
            borderRadius: 8,
            boxShadow: popoverShadow,
            zIndex: 2147483647,
            transformOrigin: "bottom right"
          }}>
          {showListSections && (
            <>
              <Section title="Sort" theme={theme}>
                <RadioRow
                  label="Manual"
                  selected={sort === "manual"}
                  onClick={() => onChangeSort?.("manual")}
                  theme={theme}
                />
                <RadioRow
                  label="By date"
                  selected={sort === "date"}
                  onClick={() => onChangeSort?.("date")}
                  theme={theme}
                />
                <RadioRow
                  label="Alphabetical"
                  selected={sort === "alpha"}
                  onClick={() => onChangeSort?.("alpha")}
                  theme={theme}
                />
              </Section>
              <div style={{ height: 1, backgroundColor: dividerColor }} />
              <Section title="Add new tasks at" theme={theme}>
                <RadioRow
                  label="Bottom"
                  selected={newTaskPosition === "bottom"}
                  onClick={() => onChangeNewTaskPosition?.("bottom")}
                  theme={theme}
                />
                <RadioRow
                  label="Top"
                  selected={newTaskPosition === "top"}
                  onClick={() => onChangeNewTaskPosition?.("top")}
                  theme={theme}
                />
              </Section>
              <div style={{ height: 1, backgroundColor: dividerColor }} />
              <Section title="Show completed" theme={theme}>
                <RadioRow
                  label="Never"
                  selected={showCompleted === "never"}
                  onClick={() => onChangeShowCompleted?.("never")}
                  theme={theme}
                />
                <RadioRow
                  label="Today"
                  selected={showCompleted === "today"}
                  onClick={() => onChangeShowCompleted?.("today")}
                  theme={theme}
                />
                <RadioRow
                  label="30 days"
                  selected={showCompleted === "30d"}
                  onClick={() => onChangeShowCompleted?.("30d")}
                  theme={theme}
                />
                <RadioRow
                  label="Always"
                  selected={showCompleted === "always"}
                  onClick={() => onChangeShowCompleted?.("always")}
                  theme={theme}
                />
              </Section>
              <div style={{ height: 1, backgroundColor: dividerColor }} />
            </>
          )}
          <div className="px-1 py-1">
            <button
              type="button"
              role="switch"
              aria-checked={pinned}
              onClick={handlePinToggle}
              className={
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left " +
                "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
                "focus:outline-none focus-visible:bg-black/[0.04] " +
                "dark:focus-visible:bg-white/[0.06]"
              }>
              <Pin size={14} strokeWidth={2} aria-hidden="true" />
              <span className="flex-1 text-[13px] leading-tight">Pin panel</span>
              <span
                className="flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors"
                style={{
                  backgroundColor: pinned
                    ? "#3b82f6"
                    : theme === "dark"
                      ? "rgba(255,255,255,0.20)"
                      : "rgba(0,0,0,0.20)"
                }}>
                <span
                  className="block h-3 w-3 rounded-full bg-white transition-transform"
                  style={{
                    transform: pinned ? "translateX(12px)" : "translateX(0)"
                  }}
                />
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </PopoverPortal>
  )
}
