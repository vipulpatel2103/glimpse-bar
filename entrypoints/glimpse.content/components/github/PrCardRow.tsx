import { ChevronRight, MessageSquare, MoreHorizontal } from "lucide-react"

import { formatRelative } from "~/lib/github/format"
import type { PullRequest } from "~/lib/github/types"
import { usePrefersReducedMotion } from "../../hooks/useTheme"

import { AvatarChip } from "./AvatarChip"
import { PrOverallStateIcon } from "./PrOverallStateIcon"
import { PrStatusBadges } from "./PrStatusBadges"

interface Props {
  pr: PullRequest
  now: number
  theme: "light" | "dark"
  /** Called when the kebab button is clicked. Step 6 wires this up. */
  onKebab?: (pr: PullRequest, anchor: HTMLElement) => void
}

export function PrCardRow({ pr, now, theme, onKebab }: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const divider = theme === "dark"
    ? "rgba(255,255,255,0.06)"
    : "rgba(0,0,0,0.06)"
  const reduced = usePrefersReducedMotion()

  const maxReviewers = 3
  const visibleReviewers = pr.reviewers.slice(0, maxReviewers)
  const overflowReviewers = pr.reviewers.length - visibleReviewers.length

  return (
    <a
      href={pr.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        padding: "8px 10px",
        borderBottom: `1px solid ${divider}`,
        position: "relative",
        cursor: "pointer",
        backgroundColor: "transparent",
        transition: reduced ? "none" : "background-color 100ms ease-out"
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor =
          theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
      }}
    >
      {/* Top line: #number + title */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 5 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: muted,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0
          }}
        >
          #{pr.number}
        </span>
        <span
          title={pr.title}
          style={{
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.35,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {pr.title}
        </span>
      </div>

      {/* Bottom line: avatar chain + status + comment count */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Author → reviewers */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <AvatarChip
            login={pr.author}
            avatarUrl={pr.authorAvatarUrl}
            size={20}
            theme={theme}
          />
          {pr.reviewers.length > 0 && (
            <>
              <ChevronRight
                size={10}
                strokeWidth={2}
                style={{ color: muted, flexShrink: 0 }}
                aria-hidden="true"
              />
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                {visibleReviewers.map((r) => (
                  <AvatarChip
                    key={r.login}
                    login={r.login}
                    avatarUrl={r.avatarUrl}
                    reviewState={r.state}
                    size={20}
                    theme={theme}
                  />
                ))}
                {overflowReviewers > 0 && (
                  <AvatarChip
                    login={`+${overflowReviewers}`}
                    size={20}
                    theme={theme}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Status pills */}
        <PrStatusBadges pr={pr} theme={theme} />

        {/* Overall-state icon */}
        <PrOverallStateIcon state={pr.overallState} theme={theme} />

        {/* Comment count */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            color: muted,
            flexShrink: 0
          }}
        >
          <MessageSquare size={11} strokeWidth={2} aria-hidden="true" />
          <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
            {pr.commentsCount}
          </span>
        </div>
      </div>

      {/* Age tooltip shown via title on the whole card */}
      <span
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          fontSize: 10,
          color: muted,
          opacity: 0,
          pointerEvents: "none"
        }}
        className="group-hover:opacity-100"
        aria-hidden="true"
      >
        {formatRelative(pr.updatedAt, now)}
      </span>

      {/* Kebab — revealed on hover (Step 6 wires the menu) */}
      {onKebab && (
        <button
          type="button"
          aria-label={`Options for PR #${pr.number}`}
          title="Options"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onKebab(pr, e.currentTarget)
          }}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: 4,
            border: "none",
            background: "transparent",
            color: muted,
            cursor: "pointer",
            opacity: 0,
            padding: 0
          }}
          className="group-hover:opacity-100 focus-visible:opacity-100"
        >
          <MoreHorizontal size={13} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </a>
  )
}
