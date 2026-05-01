import { AnimatePresence, motion } from "framer-motion"
import {
  Calendar,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  Sunrise,
  TreePine,
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


import {
  chipNextWeek,
  chipThisWeekend,
  chipToday,
  chipTomorrow
} from "~/lib/todos/dates"

import { usePrefersReducedMotion } from "../../hooks/useTheme"

interface DatePopoverProps {
  open: boolean
  onClose: () => void
  /** The element below which the popover should render. */
  anchorRef: RefObject<HTMLElement | null>
  currentDueAt?: number
  onPick: (dueAt: number | undefined) => void
  theme: "light" | "dark"
}

interface ChipDef {
  id: "today" | "tomorrow" | "weekend" | "next-week"
  label: string
  Icon: LucideIcon
  toDueAt: (now: number) => number
}

const CHIPS: ChipDef[] = [
  { id: "today", label: "Today", Icon: Sunrise, toDueAt: chipToday },
  { id: "tomorrow", label: "Tomorrow", Icon: CalendarPlus, toDueAt: chipTomorrow },
  { id: "weekend", label: "This Weekend", Icon: TreePine, toDueAt: chipThisWeekend },
  { id: "next-week", label: "Next Week", Icon: CalendarDays, toDueAt: chipNextWeek }
]

const POPOVER_WIDTH = 220

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function toDateInputValue(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function fromDateInputValue(value: string): number | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map((p) => parseInt(p, 10))
  if (!y || !m || !d) return undefined
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0)
  return dt.getTime()
}

export function DatePopover({
  open,
  onClose,
  anchorRef,
  currentDueAt,
  onPick,
  theme
}: DatePopoverProps) {
  const reduced = usePrefersReducedMotion()
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!open) return
    const anchor = anchorRef.current
    if (!anchor) return
    const anchorRect = anchor.getBoundingClientRect()

    // Popovers render inline (no portal) so position:fixed is captured by
    // the panel's transform (CLAUDE.md). Use position:absolute relative to
    // the panel (nearest positioned ancestor). Find the panel via closest().
    const panel = anchor.closest('[role="dialog"]') as HTMLElement | null
    const pr = panel?.getBoundingClientRect() ?? { top: 0, left: 0, width: 360, height: 600 }
    const panelW = pr.width ?? 360
    const panelH = pr.height ?? 600

    // Estimate popover height for flip decision.
    const estH = CHIPS.length * 32 + 48  // chips + pick-date row + remove-date row
    const topBelow = anchorRect.bottom + 4 - pr.top
    const top = topBelow + estH > panelH - 8
      ? anchorRect.top - pr.top - estH - 4
      : topBelow

    let left = anchorRect.right - POPOVER_WIDTH - pr.left
    if (left < 4) left = 4
    if (left + POPOVER_WIDTH > panelW - 4) left = panelW - POPOVER_WIDTH - 4

    setCoords({ top: Math.max(4, top), left })
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

  const handleChip = useCallback(
    (chip: ChipDef) => {
      onPick(chip.toDueAt(Date.now()))
      onClose()
    },
    [onPick, onClose]
  )

  const handleNativeChange = useCallback(
    (value: string) => {
      const ts = fromDateInputValue(value)
      if (ts !== undefined) {
        onPick(ts)
        onClose()
      }
    },
    [onPick, onClose]
  )


  const handleRemove = useCallback(() => {
    onPick(undefined)
    onClose()
  }, [onPick, onClose])

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
      {open && (
        <motion.div
          ref={popoverRef}
          role="listbox"
          aria-label="Pick a due date"
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
            // position:absolute relative to the panel (nearest
            // position:fixed ancestor). Avoids portal pointer-events
            // inheritance issues in WXT shadow DOM context.
            position: "absolute",
            top: coords.top,
            left: coords.left,
            width: POPOVER_WIDTH,
            backgroundColor: popoverBg,
            border: popoverBorder,
            borderRadius: 8,
            boxShadow: popoverShadow,
            padding: 4,
            zIndex: 9999,
            transformOrigin: "top right"
          }}>
          {CHIPS.map((chip) => {
            const Icon = chip.Icon
            return (
              <button
                key={chip.id}
                type="button"
                role="option"
                onClick={() => handleChip(chip)}
                className={
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left " +
                  "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
                  "focus:outline-none focus-visible:bg-black/[0.04] " +
                  "dark:focus-visible:bg-white/[0.06]"
                }>
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
                <span className="flex-1 text-[13px] leading-tight">{chip.label}</span>
              </button>
            )
          })}
          <div
            className="my-1"
            style={{ height: 1, backgroundColor: dividerColor }}
          />
          {/* Visible date input. The user interacts with it directly
              (click or keyboard). showPicker() / hidden-input tricks both
              fail in Chrome's content-script / shadow-root context, but a
              visible input that the user activates works reliably.
              colorScheme keeps the native widget styled for the theme. */}
          <label
            className={
              "flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 " +
              "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            }>
            <Calendar
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            />
            <input
              type="date"
              defaultValue={
                currentDueAt ? toDateInputValue(currentDueAt) : undefined
              }
              min={toDateInputValue(Date.now())}
              onChange={(e) => {
                if (e.target.value) {
                  // Only update the task's date — do NOT call onClose() here.
                  // onChange fires as soon as any sub-field (MM/DD/YYYY)
                  // becomes valid, so auto-closing collapses the popover on
                  // the user's first keystroke when defaultValue is pre-filled.
                  // The user closes naturally (click outside / Escape / chip).
                  const ts = fromDateInputValue(e.target.value)
                  if (ts !== undefined) onPick(ts)
                }
              }}
              className="flex-1 bg-transparent text-[13px] leading-tight focus:outline-none"
              style={{
                colorScheme: theme === "dark" ? "dark" : "light",
                minWidth: 0,
                cursor: "pointer"
              }}
              aria-label="Pick a date"
            />
          </label>
          {currentDueAt !== undefined && (
            <>
              <div
                className="my-1"
                style={{ height: 1, backgroundColor: dividerColor }}
              />
              <button
                type="button"
                onClick={handleRemove}
                className={
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left " +
                  "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                }
                style={{ color: mutedColor }}>
                <CalendarX size={14} strokeWidth={2} aria-hidden="true" />
                <span className="flex-1 text-[13px] leading-tight">Remove date</span>
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
