interface Props {
  label: string
  count: number
  color: string
  selected: boolean
  theme: "light" | "dark"
  onClick: () => void
  disabled?: boolean
}

const ITEM_BASE =
  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] leading-tight text-left " +
  "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
  "focus:outline-none focus-visible:bg-black/[0.04] dark:focus-visible:bg-white/[0.06]"

const ACTIVE = "bg-black/[0.06] dark:bg-white/[0.10] font-semibold"

export function SidebarLeafRow({
  label,
  count,
  color,
  selected,
  theme,
  onClick,
  disabled
}: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "page" : undefined}
      title={label}
      className={`${ITEM_BASE} ${selected ? ACTIVE : ""}`}
    >
      <span
        aria-hidden="true"
        style={{
          width: 3,
          height: 14,
          borderRadius: 2,
          flexShrink: 0,
          backgroundColor: color,
          opacity: disabled ? 0.35 : 1
        }}
      />
      <span
        className="flex-1 truncate font-mono text-[11px]"
        style={{ color: muted, opacity: disabled ? 0.55 : 1 }}
      >
        {label}
      </span>
      <span
        className="text-[12px] tabular-nums"
        style={{ color: muted }}
      >
        {count}
      </span>
    </button>
  )
}
