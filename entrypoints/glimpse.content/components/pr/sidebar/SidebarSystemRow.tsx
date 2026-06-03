import type { LucideIcon } from "lucide-react"

interface Props {
  Icon: LucideIcon
  label: string
  count: number
  selected: boolean
  theme: "light" | "dark"
  onClick: () => void
}

const ITEM_BASE =
  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] leading-tight text-left " +
  "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
  "focus:outline-none focus-visible:bg-black/[0.04] dark:focus-visible:bg-white/[0.06]"

const ACTIVE = "bg-black/[0.06] dark:bg-white/[0.10] font-semibold"

export function SidebarSystemRow({
  Icon,
  label,
  count,
  selected,
  theme,
  onClick
}: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "page" : undefined}
      className={`${ITEM_BASE} ${selected ? ACTIVE : ""}`}
    >
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      <span className="flex-1 truncate">{label}</span>
      <span className="text-[12px] tabular-nums" style={{ color: muted }}>
        {count}
      </span>
    </button>
  )
}
