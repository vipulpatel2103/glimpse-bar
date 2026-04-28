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
    const rect = anchor.getBoundingClientRect()
    // Anchor below the icon, right-aligned to it so we keep the popover
    // inside the panel for typical row-right placements.
    let left = rect.right - POPOVER_WIDTH
    if (left < 8) left = 8
    setCoords({ top: rect.bottom + 4, left })
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
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: POPOVER_WIDTH,
            backgroundColor: popoverBg,
            border: popoverBorder,
            borderRadius: 8,
            boxShadow: popoverShadow,
            padding: 4,
            zIndex: 2147483647,
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
          <label
            className={
              "flex w-full items-center gap-2 rounded px-2 py-1.5 " +
              "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer"
            }>
            <Calendar size={14} strokeWidth={2} aria-hidden="true" />
            <span className="flex-1 text-[13px] leading-tight">Pick date…</span>
            <input
              type="date"
              defaultValue={currentDueAt ? toDateInputValue(currentDueAt) : undefined}
              min={toDateInputValue(Date.now())}
              onChange={(e) => handleNativeChange(e.target.value)}
              className="bg-transparent text-[12px] focus:outline-none"
              style={{ color: mutedColor }}
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
