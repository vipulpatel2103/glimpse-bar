import type { PointerEventHandler } from "react"

interface DragHandleProps {
  isDragging: boolean
  onPointerDown: PointerEventHandler<HTMLDivElement>
  onPointerMove: PointerEventHandler<HTMLDivElement>
  onPointerUp: PointerEventHandler<HTMLDivElement>
  onPointerCancel: PointerEventHandler<HTMLDivElement>
}

// 2 rows × 4 cols of small filled circles — reads as `::::` and signals
// the area is grippable. Aria-label still describes the action.
export function DragHandle({ isDragging, ...handlers }: DragHandleProps) {
  return (
    <div
      role="presentation"
      aria-label="Drag Glimpse Bar"
      className={
        "flex h-[20px] w-full items-center justify-center select-none touch-none " +
        (isDragging ? "cursor-grabbing" : "cursor-grab")
      }
      {...handlers}>
      <div
        aria-hidden="true"
        className="grid grid-cols-4 gap-x-[3px] gap-y-[3px]">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="h-[3px] w-[3px] rounded-full bg-white/55"
          />
        ))}
      </div>
    </div>
  )
}
