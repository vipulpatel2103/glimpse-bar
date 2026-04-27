import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { useEffect, useRef, type CSSProperties } from "react"

import type { AppDefinition } from "~/lib/apps/types"
import { BAR_WIDTH, PANEL_GAP, PANEL_WIDTH, type Edge } from "~/lib/storage"

import { usePrefersReducedMotion } from "../hooks/useTheme"

interface GlimpsePanelProps {
  app: AppDefinition | null
  edge: Edge
  theme: "light" | "dark"
  onClose: () => void
}

const panelStyle = (edge: Edge, theme: "light" | "dark"): CSSProperties => {
  // Use document layout viewport so we don't sit under page scrollbars.
  const vw =
    typeof document !== "undefined"
      ? document.documentElement.clientWidth
      : 1024
  const width = Math.min(PANEL_WIDTH, Math.max(240, vw - 80))
  const offset = BAR_WIDTH + PANEL_GAP + 4
  const base: CSSProperties = {
    position: "fixed",
    top: 16,
    bottom: 16,
    width: `${width}px`,
    // Solid opaque surface — no transparency.
    backgroundColor: theme === "dark" ? "#0a0a0a" : "#ffffff",
    opacity: 1,
    color: theme === "dark" ? "#fafafa" : "#171717",
    border:
      theme === "dark"
        ? "1px solid rgba(255,255,255,0.10)"
        : "1px solid rgba(0,0,0,0.10)",
    boxShadow:
      theme === "dark"
        ? "0 16px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)"
        : "0 16px 40px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.14)",
    pointerEvents: "auto",
    zIndex: 2147483647
  }
  if (edge === "right") return { ...base, right: `${offset}px` }
  return { ...base, left: `${offset}px` }
}

export function GlimpsePanel({
  app,
  edge,
  theme,
  onClose
}: GlimpsePanelProps) {
  const reduced = usePrefersReducedMotion()
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!app) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      const panel = panelRef.current
      if (!panel) return
      // Click inside panel → ignore
      if (panel.contains(target)) return
      // Click on bar → ignore (we share a shadow root with the bar)
      const rootNode = panel.getRootNode() as ShadowRoot | Document
      const bar =
        "querySelector" in rootNode
          ? rootNode.querySelector('[role="toolbar"]')
          : null
      if (bar && bar.contains(target)) return
      onClose()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onPointer, true)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onPointer, true)
    }
  }, [app, onClose])

  // Motion design:
  //   • Slide a meaningful distance (80px) so the panel reads as "emerging
  //     from behind the bar" rather than popping in place.
  //   • Anchor the scale transform to the bar-facing edge so the panel
  //     visually unfolds outward from the bar.
  //   • Open uses an emphasized ease-out (slow trail-in); close uses a
  //     sharper ease-in so dismissal feels decisive, not draggy.
  //   • prefers-reduced-motion: skip the slide + scale entirely.
  const SLIDE_PX = 80
  const xOff = edge === "right" ? SLIDE_PX : -SLIDE_PX
  const transformOrigin =
    edge === "right" ? "right center" : "left center"
  const easeOpen: [number, number, number, number] = [0.32, 0.72, 0, 1]
  const easeClose: [number, number, number, number] = [0.4, 0, 1, 1]

  return (
    <AnimatePresence>
      {app && (
        <motion.div
          key={app.id}
          ref={panelRef}
          role="dialog"
          aria-label={`${app.name} panel`}
          aria-modal="false"
          initial={{ x: xOff, scale: 0.96 }}
          animate={{
            x: 0,
            scale: 1,
            transition: reduced
              ? { duration: 0 }
              : { duration: 0.34, ease: easeOpen }
          }}
          exit={{
            x: xOff,
            scale: 0.96,
            transition: reduced
              ? { duration: 0 }
              : { duration: 0.2, ease: easeClose }
          }}
          style={{
            ...panelStyle(edge, theme),
            transformOrigin,
            willChange: "transform"
          }}
          className="flex flex-col overflow-hidden rounded-2xl">
          <header
            className="flex h-11 items-center gap-2 px-3"
            style={{
              borderBottom:
                theme === "dark"
                  ? "1px solid rgba(255,255,255,0.06)"
                  : "1px solid rgba(0,0,0,0.06)"
            }}>
            <app.Icon size={16} strokeWidth={2} aria-hidden="true" />
            <h2 className="flex-1 text-[14px] font-semibold leading-none">
              {app.name}
            </h2>
            <button
              type="button"
              aria-label={`Close ${app.name} panel`}
              onClick={onClose}
              className={
                "flex h-7 w-7 items-center justify-center rounded transition-colors " +
                "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              }>
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </header>
          <div className="flex flex-1 items-center justify-center px-6 py-8 text-center">
            <p
              className="text-[13px]"
              style={{
                color: theme === "dark" ? "#a3a3a3" : "#737373"
              }}>
              {app.name} — content lands in a later phase
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
