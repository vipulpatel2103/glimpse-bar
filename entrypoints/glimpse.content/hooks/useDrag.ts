import type { PointerEvent as ReactPointerEvent } from "react"
import { useCallback, useRef, useState } from "react"

import { BAR_HEIGHT, BAR_WIDTH, type Edge, type Position } from "~/lib/storage"

export interface DragState {
  position: Position
  isDragging: boolean
  dragHandlers: {
    onPointerDown: (e: ReactPointerEvent) => void
    onPointerMove: (e: ReactPointerEvent) => void
    onPointerUp: (e: ReactPointerEvent) => void
    onPointerCancel: (e: ReactPointerEvent) => void
  }
}

interface UseDragArgs {
  initial: Position
  onCommit: (next: Position, edge: Edge) => void
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max)

export function useDrag({ initial, onCommit }: UseDragArgs): DragState {
  const [position, setPosition] = useState<Position>(initial)
  const [isDragging, setIsDragging] = useState(false)
  const offsetRef = useRef<Position>({ x: 0, y: 0 })
  const pointerIdRef = useRef<number | null>(null)
  const liveRef = useRef<Position>(initial)

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0) return
      const target = e.currentTarget as HTMLElement
      target.setPointerCapture(e.pointerId)
      pointerIdRef.current = e.pointerId
      offsetRef.current = {
        x: e.clientX - liveRef.current.x,
        y: e.clientY - liveRef.current.y
      }
      setIsDragging(true)
      e.preventDefault()
    },
    []
  )

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return
    // Use layout viewport (clientWidth/Height) so the scrollbar doesn't push
    // the bar over the scrollbar on Windows Chrome.
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
    setPosition(next)
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
      setPosition(snapped)
      pointerIdRef.current = null
      setIsDragging(false)
      onCommit(snapped, snappedEdge)
    },
    [onCommit]
  )

  return {
    position,
    isDragging,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finalize,
      onPointerCancel: finalize
    }
  }
}
