import { CalendarRange } from "lucide-react"

import { formatDayLabel } from "~/lib/todos/dates"
import type { UpcomingGroup } from "~/lib/todos/selectors"

import { TodoRow } from "./TodoRow"

interface TodoUpcomingViewProps {
  groups: UpcomingGroup[]
  now: number
  theme: "light" | "dark"
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onSetDue: (id: string, dueAt: number | undefined) => void
  onUpdateText: (id: string, text: string) => void
}

export function TodoUpcomingView({
  groups,
  now,
  theme,
  onToggle,
  onDelete,
  onSetDue,
  onUpdateText
}: TodoUpcomingViewProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        <CalendarRange
          size={32}
          strokeWidth={1.5}
          aria-hidden="true"
          style={{
            color: theme === "dark" ? "rgba(163,163,163,0.5)" : "rgba(115,115,115,0.5)"
          }}
        />
        <p
          className="text-[12px] leading-relaxed"
          style={{ color: theme === "dark" ? "#a3a3a3" : "#737373" }}>
          Calendar's clear for the next week.
        </p>
      </div>
    )
  }

  return (
    <div role="list" className="flex flex-1 flex-col overflow-y-auto px-1 py-1">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col">
          <div
            className="sticky top-0 z-[1] flex h-6 items-center px-2 text-[11px] font-semibold uppercase tracking-wide"
            style={{
              color: theme === "dark" ? "#a3a3a3" : "#737373",
              backgroundColor: theme === "dark" ? "#0a0a0a" : "#ffffff"
            }}>
            {formatDayLabel(group.ts, now)}
          </div>
          <div className="flex flex-col gap-px">
            {group.items.map((item) => (
              <TodoRow
                key={item.id}
                item={item}
                now={now}
                theme={theme}
                onToggle={onToggle}
                onDelete={onDelete}
                onSetDue={onSetDue}
                onUpdateText={onUpdateText}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
