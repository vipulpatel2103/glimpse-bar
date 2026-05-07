import { ChevronDown, ChevronRight } from "lucide-react"

interface Props {
  label: string
  count: number
  expanded: boolean
  theme: "light" | "dark"
  onToggle: () => void
  /** Optional subtitle/slug rendered in monospace next to the label. */
  slug?: string
}

const ITEM_BASE =
  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] leading-tight text-left " +
  "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
  "focus:outline-none focus-visible:bg-black/[0.04] dark:focus-visible:bg-white/[0.06]"

export function SidebarHierarchyRow({
  label,
  count,
  expanded,
  theme,
  onToggle,
  slug
}: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const Chevron = expanded ? ChevronDown : ChevronRight
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      title={slug ?? label}
      className={ITEM_BASE}
    >
      <Chevron
        size={12}
        strokeWidth={2}
        aria-hidden="true"
        style={{ color: muted, flexShrink: 0 }}
      />
      <span className="flex-1 truncate font-medium">{label}</span>
      <span className="text-[12px] tabular-nums" style={{ color: muted }}>
        {count}
      </span>
    </button>
  )
}
