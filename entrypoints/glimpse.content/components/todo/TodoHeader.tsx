import { AnimatePresence, motion } from "framer-motion"
import {
  CalendarRange,
  CheckCheck,
  ChevronDown,
  Inbox,
  Sunrise,
  type LucideIcon
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { SystemView } from "~/lib/todos/types"

import { usePrefersReducedMotion } from "../../hooks/useTheme"

interface TodoHeaderProps {
  theme: "light" | "dark"
  activeView: SystemView
  counts: { today: number; upcoming: number; inbox: number; completed: number }
  onChangeView: (view: SystemView) => void
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

export function TodoHeader({
  theme,
  activeView,
  counts,
  onChangeView
}: TodoHeaderProps) {
  const reduced = usePrefersReducedMotion()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const active = SYSTEM_VIEW_META.find((v) => v.id === activeView) ?? SYSTEM_VIEW_META[0]
  const ActiveIcon = active.Icon

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (popoverRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      close()
    }
    const onKey = (e: KeyboardEvent) => {
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

  const handlePick = useCallback(
    (view: SystemView) => {
      onChangeView(view)
      close()
    },
    [onChangeView, close]
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

  return (
    <header
      className="relative flex h-11 shrink-0 items-center px-3"
      style={{
        borderBottom:
          theme === "dark"
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(0,0,0,0.06)"
      }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "flex items-center gap-1.5 rounded px-1.5 py-1 -ml-1.5 " +
          "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        }
        aria-label={`${active.label} view — switch view`}
        aria-haspopup="listbox"
        aria-expanded={open}>
        <ActiveIcon size={14} strokeWidth={2} aria-hidden="true" />
        <span className="text-[14px] font-semibold leading-none">
          {active.label}
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

      <AnimatePresence>
        {open && (
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
              backgroundColor: popoverBg,
              border: popoverBorder,
              borderRadius: 8,
              boxShadow: popoverShadow,
              padding: 4,
              zIndex: 1,
              transformOrigin: "top left"
            }}>
            {SYSTEM_VIEW_META.map((view) => {
              const Icon = view.Icon
              const count = counts[view.id]
              const selected = view.id === activeView
              return (
                <button
                  key={view.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handlePick(view.id)}
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
                  <span className="flex-1 text-[13px] leading-tight">
                    {view.label}
                  </span>
                  <span
                    className="text-[12px] tabular-nums"
                    style={{
                      color: theme === "dark" ? "#a3a3a3" : "#737373"
                    }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
