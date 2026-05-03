import { useState } from "react"

import { initialsOf, reviewerRingColor } from "~/lib/github/format"
import type { ReviewerState } from "~/lib/github/types"
import type { StatusColor } from "~/lib/github/format"

interface AvatarChipProps {
  login: string
  avatarUrl?: string
  /** undefined = author (no ring). */
  reviewState?: ReviewerState
  size?: 16 | 20 | 24 | 28
  theme: "light" | "dark"
}

const RING_COLORS: Record<StatusColor, { light: string; dark: string }> = {
  success: { light: "#16a34a", dark: "#22c55e" },
  warning: { light: "#d97706", dark: "#f59e0b" },
  error:   { light: "#dc2626", dark: "#ef4444" },
  info:    { light: "#2563eb", dark: "#3b82f6" },
  neutral: { light: "rgba(0,0,0,0.15)", dark: "rgba(255,255,255,0.18)" }
}

function ringColor(state: ReviewerState | undefined, theme: "light" | "dark"): string {
  if (!state) return RING_COLORS.neutral[theme]
  const token = reviewerRingColor(state)
  return RING_COLORS[token][theme]
}

export function AvatarChip({ login, avatarUrl, reviewState, size = 24, theme }: AvatarChipProps) {
  const [failed, setFailed] = useState(false)
  const color = ringColor(reviewState, theme)
  const tooltip = reviewState
    ? `@${login} — ${reviewState.replace("_", " ")}`
    : `@${login}`
  const fontSize = size <= 16 ? 8 : size <= 24 ? 9 : 10

  const commonStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    boxShadow: `0 0 0 2px ${color}`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  }

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt={`@${login}`}
        title={tooltip}
        loading="lazy"
        style={{ ...commonStyle, objectFit: "cover" }}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span
      title={tooltip}
      style={{
        ...commonStyle,
        backgroundColor: theme === "dark" ? "#262626" : "#e5e5e5",
        fontSize,
        fontWeight: 600,
        color: theme === "dark" ? "#a3a3a3" : "#525252",
        letterSpacing: 0
      }}
    >
      {initialsOf(login)}
    </span>
  )
}
