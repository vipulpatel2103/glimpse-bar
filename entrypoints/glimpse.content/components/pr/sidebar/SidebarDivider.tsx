interface Props {
  theme: "light" | "dark"
  /** Optional uppercase section label rendered beneath the divider line. */
  label?: string
}

export function SidebarDivider({ theme, label }: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const divider = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
  return (
    <>
      <div className="my-2" style={{ height: 1, backgroundColor: divider }} />
      {label && (
        <div
          className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: muted }}
        >
          {label}
        </div>
      )}
    </>
  )
}
