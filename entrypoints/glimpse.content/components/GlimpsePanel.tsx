import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { useEffect, useRef, type CSSProperties } from "react"

import type { AppDefinition } from "~/lib/apps/types"
import {
  BAR_WIDTH,
  PANEL_GAP,
  PANEL_WIDTH,
  PANEL_WIDTH_EXPANDED,
  type Edge
} from "~/lib/storage"

import { ADAPTERS } from "~/lib/pr/adapters"

import { usePrefersReducedMotion } from "../hooks/useTheme"
import { useViewportWidth } from "../hooks/useViewportWidth"
import { PrApp } from "./pr/PrApp"
import { TodoApp } from "./todo/TodoApp"

interface GlimpsePanelProps {
  app: AppDefinition | null
  edge: Edge
  theme: "light" | "dark"
  /**
   * When true, outside-click no longer dismisses the panel. ESC and the
   * close button still work. Driven by the TODO app's "Pin panel" toggle.
   */
  pinned?: boolean
  /**
   * When true, the panel widens to ~720px and the active app may render
   * a sidebar. Falls back to compact when the viewport can't fit it.
   */
  expanded?: boolean
  onClose: () => void
}

const EXPAND_BREAKPOINT = 720

function compactWidthFor(vw: number): number {
  return Math.min(PANEL_WIDTH, Math.max(240, vw - 80))
}

function expandedWidthFor(vw: number): number {
  return Math.min(PANEL_WIDTH_EXPANDED, vw - 68)
}

function panelStyleWithoutWidth(
  edge: Edge,
  theme: "light" | "dark"
): CSSProperties {
  const offset = BAR_WIDTH + PANEL_GAP + 4
  const base: CSSProperties = {
    position: "fixed",
    top: 16,
    bottom: 16,
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
  pinned = false,
  expanded = false,
  onClose
}: GlimpsePanelProps) {
  const reduced = usePrefersReducedMotion()
  const vw = useViewportWidth()
  const panelRef = useRef<HTMLDivElement | null>(null)
  // Fallback to compact when the viewport can't comfortably fit the
  // expanded layout — keeps the bar usable on narrow windows.
  const effectiveExpanded = expanded && vw >= EXPAND_BREAKPOINT
  const targetWidth = effectiveExpanded
    ? expandedWidthFor(vw)
    : compactWidthFor(vw)

  useEffect(() => {
    if (!app) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    const onPointer = (e: PointerEvent) => {
      // While pinned, outside-click dismissal is suppressed. ESC and the
      // close button remain functional.
      if (pinned) return
      const panel = panelRef.current
      if (!panel) return
      // Use composedPath so we see through the shadow-root boundary.
      // e.target gets retargeted to <glimpse-ui> when the event bubbles
      // past the shadow root, which would (incorrectly) treat every
      // click inside the panel as "outside".
      const path = e.composedPath()
      if (path.includes(panel)) return
      // Click on bar → ignore (we share a shadow root with the bar)
      const rootNode = panel.getRootNode() as ShadowRoot | Document
      const bar =
        "querySelector" in rootNode
          ? rootNode.querySelector('[role="toolbar"]')
          : null
      if (bar && path.includes(bar)) return
      // Click on a portaled popover (DatePopover, ContextMenu,
      // ListConfigMenu) belongs to the panel logically even though the
      // host element is a sibling of the panel motion.div in DOM. The
      // host is tagged with data-glimpse-popover-host so we can detect it
      // here. Without this guard, picking a chip / menu item would dismiss
      // the panel mid-interaction.
      const hitsPopoverHost = path.some(
        (n) =>
          n instanceof HTMLElement &&
          n.dataset.glimpsePopoverHost === "true"
      )
      if (hitsPopoverHost) return
      onClose()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onPointer, true)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onPointer, true)
    }
  }, [app, onClose, pinned])

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
          initial={{ x: xOff, scale: 0.96, width: targetWidth }}
          animate={{
            x: 0,
            scale: 1,
            width: targetWidth,
            transition: reduced
              ? { duration: 0 }
              : {
                  default: { duration: 0.34, ease: easeOpen },
                  // Width tween (compact ↔ expanded) uses its own timing
                  // so toggling feels snappier than the open animation.
                  width: { duration: 0.28, ease: easeOpen }
                }
          }}
          exit={{
            x: xOff,
            scale: 0.96,
            transition: reduced
              ? { duration: 0 }
              : { duration: 0.2, ease: easeClose }
          }}
          style={{
            ...panelStyleWithoutWidth(edge, theme),
            transformOrigin,
            willChange: "transform"
          }}
          className="flex flex-col overflow-hidden rounded-2xl">
          {app.id === "todo" ? (
            <TodoApp theme={theme} />
          ) : app.providerId && ADAPTERS[app.providerId] ? (
            <PrApp adapter={ADAPTERS[app.providerId]!} theme={theme} />
          ) : (
            <>
              <header
                className="flex h-11 items-center gap-2 px-3"
                style={{
                  borderBottom:
                    theme === "dark"
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "1px solid rgba(0,0,0,0.06)"
                }}>
                {app.iconUrl ? (
                  <img
                    src={app.iconUrl}
                    alt=""
                    aria-hidden="true"
                    style={{ width: 16, height: 16, objectFit: "contain" }}
                  />
                ) : app.Icon ? (
                  <app.Icon size={16} strokeWidth={2} aria-hidden="true" />
                ) : null}
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
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
