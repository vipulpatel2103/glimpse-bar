import {
  AlertTriangle,
  Check,
  CircleHelp,
  FileEdit,
  Pencil,
  type LucideIcon
} from "lucide-react"

import type { StatusColor, StatusMeta } from "~/lib/pr/format"

interface Props {
  /** Provider-supplied pill list, already in priority order. */
  pills: StatusMeta[]
  theme: "light" | "dark"
}

const FG_COLORS: Record<StatusColor, { light: string; dark: string }> = {
  success: { light: "#16a34a", dark: "#22c55e" },
  warning: { light: "#d97706", dark: "#f59e0b" },
  error:   { light: "#dc2626", dark: "#ef4444" },
  info:    { light: "#2563eb", dark: "#3b82f6" },
  neutral: { light: "#525252", dark: "#a3a3a3" }
}

const BG_COLORS: Record<StatusColor, { light: string; dark: string }> = {
  success: { light: "rgba(22,163,74,0.10)",  dark: "rgba(34,197,94,0.16)" },
  warning: { light: "rgba(217,119,6,0.10)",  dark: "rgba(245,158,11,0.16)" },
  error:   { light: "rgba(220,38,38,0.10)",  dark: "rgba(239,68,68,0.16)" },
  info:    { light: "rgba(37,99,235,0.10)",  dark: "rgba(59,130,246,0.16)" },
  neutral: { light: "rgba(0,0,0,0.05)",      dark: "rgba(255,255,255,0.08)" }
}

const ICONS: Record<string, LucideIcon> = {
  Check,
  Pencil,
  CircleHelp,
  AlertTriangle,
  FileEdit
}

function Pill({ meta, theme }: { meta: StatusMeta; theme: "light" | "dark" }) {
  const fg = FG_COLORS[meta.color]?.[theme] ?? "#737373"
  const bg = BG_COLORS[meta.color]?.[theme] ?? "rgba(0,0,0,0.05)"
  const Icon = ICONS[meta.icon]

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        height: 18,
        borderRadius: 999,
        padding: "0 6px",
        backgroundColor: bg,
        color: fg,
        fontSize: 10,
        fontWeight: 600,
        lineHeight: 1,
        flexShrink: 0,
        whiteSpace: "nowrap"
      }}
    >
      {Icon && <Icon size={9} strokeWidth={2.5} aria-hidden="true" />}
      {meta.label}
    </span>
  )
}

/**
 * Renders the first 2 pills + a "+N" overflow chip when more pills exist.
 * Pill order + visibility is provider-controlled (adapter.getStatusPills).
 */
export function PrStatusBadges({ pills, theme }: Props) {
  const visible = pills.slice(0, 2)
  const overflow = pills.length - visible.length

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "nowrap" }}>
      {visible.map((meta, i) => (
        <Pill key={i} meta={meta} theme={theme} />
      ))}
      {overflow > 0 && (
        <span
          title={pills.slice(2).map((m) => m.label).join(", ")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 18,
            borderRadius: 999,
            padding: "0 6px",
            backgroundColor: BG_COLORS.neutral[theme],
            color: FG_COLORS.neutral[theme],
            fontSize: 10,
            fontWeight: 600,
            flexShrink: 0
          }}
        >
          +{overflow}
        </span>
      )}
    </span>
  )
}
