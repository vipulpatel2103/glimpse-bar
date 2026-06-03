import { AlertTriangle, Check, Clock, Minus, X } from "lucide-react"

import { overallStateMeta } from "~/lib/pr/format"
import type { OverallState } from "~/lib/pr/types"

interface Props {
  state: OverallState
  theme: "light" | "dark"
}

const TOKEN_COLORS: Record<string, { light: string; dark: string }> = {
  success: { light: "#16a34a", dark: "#22c55e" },
  warning: { light: "#d97706", dark: "#f59e0b" },
  error:   { light: "#dc2626", dark: "#ef4444" },
  neutral: { light: "#737373", dark: "#a3a3a3" }
}

export function PrOverallStateIcon({ state, theme }: Props) {
  const meta = overallStateMeta(state)
  const colors = TOKEN_COLORS[meta.color] ?? TOKEN_COLORS.neutral
  const bg = theme === "dark" ? colors.dark : colors.light

  const Icon =
    meta.icon === "Check"         ? Check :
    meta.icon === "X"             ? X :
    meta.icon === "AlertTriangle" ? AlertTriangle :
    meta.icon === "Clock"         ? Clock :
    Minus

  return (
    <span
      title={meta.label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        borderRadius: "50%",
        backgroundColor: bg,
        flexShrink: 0
      }}
    >
      <Icon size={11} strokeWidth={2.5} color="#fff" aria-hidden="true" />
    </span>
  )
}
