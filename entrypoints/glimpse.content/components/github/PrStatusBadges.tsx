import {
  AlertTriangle,
  Check,
  CircleHelp,
  FileEdit,
  Pencil,
  type LucideIcon
} from "lucide-react"

import {
  ciStatusMeta,
  draftMeta,
  mergeStateMeta,
  reviewStatusMeta,
  type StatusColor,
  type StatusMeta
} from "~/lib/github/format"
import type { PullRequest } from "~/lib/github/types"

interface Props {
  pr: PullRequest
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
  Check:         Check,
  Pencil:        Pencil,
  CircleHelp:    CircleHelp,
  AlertTriangle: AlertTriangle,
  FileEdit:      FileEdit
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
 * Builds the priority-ordered pill list for a PR.
 * At most 2 pills render; extra collapse to a "+N" neutral chip.
 */
export function PrStatusBadges({ pr, theme }: Props) {
  const candidates: StatusMeta[] = []

  const mergePill = mergeStateMeta(pr.mergeState)
  if (mergePill) candidates.push(mergePill)

  const reviewPill = reviewStatusMeta(pr.reviewDecision)
  if (reviewPill) candidates.push(reviewPill)

  if (pr.isDraft) candidates.push(draftMeta())

  // CI only shown if not already dominated by merge/review state.
  if (candidates.length < 2 && pr.ciState !== "none" && pr.ciState !== "neutral") {
    candidates.push(ciStatusMeta(pr.ciState))
  }

  const visible = candidates.slice(0, 2)
  const overflow = candidates.length - visible.length

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "nowrap" }}>
      {visible.map((meta, i) => (
        <Pill key={i} meta={meta} theme={theme} />
      ))}
      {overflow > 0 && (
        <span
          title={candidates.slice(2).map((m) => m.label).join(", ")}
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
