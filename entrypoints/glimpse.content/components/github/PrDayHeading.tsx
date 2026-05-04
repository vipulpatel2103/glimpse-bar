interface Props {
  label: string
  theme: "light" | "dark"
  /** First group in the list — omit the top separator/margin. */
  isFirst?: boolean
}

export function PrDayHeading({ label, theme, isFirst }: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const divider = theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
  const bg = theme === "dark" ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.95)"

  return (
    <div
      role="heading"
      aria-level={3}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        backgroundColor: bg,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)"
      }}
    >
      {/* Top separator — skipped for the very first group */}
      {!isFirst && (
        <div style={{ height: 1, backgroundColor: divider, marginBottom: 0 }} />
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: isFirst ? "6px 10px 5px" : "8px 10px 5px"
        }}
      >
        {/* Accent dot */}
        <span
          aria-hidden="true"
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: muted,
            flexShrink: 0,
            opacity: 0.6
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
            color: muted,
            letterSpacing: "0.03em",
            textTransform: "uppercase"
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
