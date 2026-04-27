import type { PointerEvent as ReactPointerEvent } from "react"
import { useCallback, useRef, useState } from "react"

import { BAR_HEIGHT, BAR_WIDTH, type Edge, type Position } from "~/lib/storage"

export interface DragState {
  /**
   * Position to render WHILE DRAGGING. `null` when idle — render the canonical
   * position from props instead. This separation avoids the stale-initial-state
   * bug where useState seeds once and ignores later prop updates.
   */
  livePos: Position | null
  isDragging: boolean
  dragHandlers: {
    onPointerDown: (e: ReactPointerEvent) => void
    onPointerMove: (e: ReactPointerEvent) => void
    onPointerUp: (e: ReactPointerEvent) => void
    onPointerCancel: (e: ReactPointerEvent) => void
  }
}

interface UseDragArgs {
  /** Canonical position from storage. Read fresh on every pointerdown. */
  getCurrentPosition: () => Position
  onCommit: (next: Position, edge: Edge) => void
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max)

export function useDrag({
  getCurrentPosition,
  onCommit
}: UseDragArgs): DragState {
  const [livePos, setLivePos] = useState<Position | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const offsetRef = useRef<Position>({ x: 0, y: 0 })
  const pointerIdRef = useRef<number | null>(null)
  const liveRef = useRef<Position>({ x: 0, y: 0 })

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0) return
      // Snapshot the CURRENT canonical position at drag start. This is where
      // the bar visually sits right now; pointer offset is measured from it.
      const start = getCurrentPosition()
      liveRef.current = start
      offsetRef.current = {
        x: e.clientX - start.x,
        y: e.clientY - start.y
      }
      const target = e.currentTarget as HTMLElement
      target.setPointerCapture(e.pointerId)
      pointerIdRef.current = e.pointerId
      setLivePos(start)
      setIsDragging(true)
      e.preventDefault()
    },
    [getCurrentPosition]
  )

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return
    // Layout viewport (clientWidth/Height) excludes the scrollbar so the bar
    // doesn't sit under it on Windows Chrome.
    const vw = document.documentElement.clientWidth
    const vh = document.documentElement.clientHeight
    const nx = clamp(e.clientX - offsetRef.current.x, 0, vw - BAR_WIDTH)
    const ny = clamp(
      e.clientY - offsetRef.current.y,
      16,
      Math.max(16, vh - BAR_HEIGHT - 16)
    )
    const next = { x: nx, y: ny }
    liveRef.current = next
    setLivePos(next)
  }, [])

  const finalize = useCallback(
    (e: ReactPointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return
      const vw = document.documentElement.clientWidth
      const center = vw / 2
      const snappedEdge: Edge =
        liveRef.current.x + BAR_WIDTH / 2 < center ? "left" : "right"
      const snappedX =
        snappedEdge === "left" ? 0 : Math.max(0, vw - BAR_WIDTH)
      const snapped = { x: snappedX, y: liveRef.current.y }
      liveRef.current = snapped
      pointerIdRef.current = null
      setIsDragging(false)
      setLivePos(null)
      onCommit(snapped, snappedEdge)
    },
    [onCommit]
  )

  return {
    livePos,
    isDragging,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finalize,
      onPointerCancel: finalize
    }
  }
}
