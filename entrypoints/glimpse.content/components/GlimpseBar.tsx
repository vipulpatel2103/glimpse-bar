import { useCallback, useRef, type CSSProperties } from "react"

import type { AppDefinition, AppId } from "~/lib/apps/types"
import { BAR_WIDTH, type Edge, type Position } from "~/lib/storage"

import { useDrag } from "../hooks/useDrag"
import { AppIconButton } from "./AppIconButton"
import { DragHandle } from "./DragHandle"

interface GlimpseBarProps {
  apps: AppDefinition[]
  position: Position
  edge: Edge
  transparency: number
  theme: "light" | "dark"
  activeApp: AppId | null
  onCommitPosition: (next: Position, edge: Edge) => void
  onActivateApp: (app: AppDefinition) => void
}

const clampAlpha = (a: number) => Math.max(0.15, Math.min(1, a))

export function GlimpseBar({
  apps,
  position,
  edge,
  transparency,
  theme,
  activeApp,
  onCommitPosition,
  onActivateApp
}: GlimpseBarProps) {
  // Keep the latest canonical position in a ref so the drag handler can read
  // it on pointerdown without re-creating callbacks on every render.
  const positionRef = useRef<Position>(position)
  positionRef.current = position

  const { livePos, isDragging, dragHandlers } = useDrag({
    getCurrentPosition: () => positionRef.current,
    onCommit: onCommitPosition
  })

  // While dragging: use livePos. Idle: use the canonical (storage-backed)
  // position from props. This avoids the "Y resets after refresh" bug caused
  // by useState seeding once and ignoring later prop updates.
  const renderPos: Position = isDragging && livePos ? livePos : position

  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([])

  const handleArrow = useCallback((idx: number, dir: "up" | "down") => {
    const len = buttonsRef.current.length
    if (len === 0) return
    const next = dir === "down" ? idx + 1 : idx - 1
    const target = next < 0 ? len - 1 : next >= len ? 0 : next
    buttonsRef.current[target]?.focus()
  }, [])

  const alpha = clampAlpha(transparency)
  const railRgba =
    theme === "dark"
      ? `rgba(15, 15, 15, ${alpha})`
      : `rgba(23, 23, 23, ${alpha})`

  const radiusClass = isDragging
    ? "rounded-2xl"
    : edge === "right"
      ? "rounded-l-2xl"
      : "rounded-r-2xl"

  // Positioning strategy:
  //   • While dragging: free placement via `transform: translate3d(x, y, 0)`
  //     anchored at top-left.
  //   • When snapped: use CSS `right: 0` / `left: 0` so the bar tracks the
  //     LAYOUT viewport edge (excluding the page scrollbar). `window.innerWidth`
  //     includes the scrollbar on Windows Chrome, which would otherwise hide
  //     the bar partially under the scrollbar.
  const positionStyle: CSSProperties = isDragging
    ? {
        left: 0,
        top: 0,
        transform: `translate3d(${renderPos.x}px, ${renderPos.y}px, 0)`
      }
    : edge === "right"
      ? { right: 0, top: renderPos.y }
      : { left: 0, top: renderPos.y }

  const style: CSSProperties = {
    position: "fixed",
    width: `${BAR_WIDTH}px`,
    zIndex: 2147483647,
    backgroundColor: railRgba,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: isDragging
      ? "0 8px 24px rgba(0, 0, 0, 0.25)"
      : "0 4px 16px rgba(0, 0, 0, 0.18)",
    backdropFilter: "blur(10px) saturate(1.4)",
    WebkitBackdropFilter: "blur(10px) saturate(1.4)",
    pointerEvents: "auto",
    ...positionStyle
  }

  const settingsIndex = apps.findIndex((a) => a.id === "settings")

  return (
    <div
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Glimpse Bar"
      style={style}
      className={
        "flex flex-col items-center gap-1.5 px-1 py-2 " + radiusClass
      }>
      <DragHandle isDragging={isDragging} {...dragHandlers} />
      {apps.map((app, idx) => {
        const isActive = activeApp === app.id && !app.isExternal
        const insertDividerAbove = idx === settingsIndex
        const label = app.isExternal
          ? "Open Glimpse Bar options"
          : `Open ${app.name} panel`
        return (
          <div
            key={app.id}
            className={
              insertDividerAbove
                ? "w-full pt-1.5 mt-0.5 border-t border-white/10 flex justify-center"
                : ""
            }>
            <AppIconButton
              ref={(el) => {
                buttonsRef.current[idx] = el
              }}
              Icon={app.Icon}
              label={label}
              isActive={isActive}
              theme={theme}
              onActivate={() => onActivateApp(app)}
              onArrowKey={(dir) => handleArrow(idx, dir)}
            />
          </div>
        )
      })}
    </div>
  )
}
