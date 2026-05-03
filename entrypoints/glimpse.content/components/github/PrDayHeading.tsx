interface Props {
  label: string
  theme: "light" | "dark"
}

export function PrDayHeading({ label, theme }: Props) {
  return (
    <div
      role="heading"
      aria-level={3}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        padding: "4px 8px 3px",
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.2,
        color: theme === "dark" ? "#a3a3a3" : "#737373",
        backgroundColor: theme === "dark"
          ? "rgba(10,10,10,0.95)"
          : "rgba(255,255,255,0.95)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        borderBottom: theme === "dark"
          ? "1px solid rgba(255,255,255,0.04)"
          : "1px solid rgba(0,0,0,0.04)"
      }}
    >
      {label}
    </div>
  )
}
