import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  GitMerge,
  GitPullRequest,
  XCircle,
} from "lucide-react"

import { formatAgoShort } from "~/lib/github/format"
import type { ChangeEvent, ChangeEventType } from "~/lib/github/types"

interface Props {
  changes: ChangeEvent[]
  now: number
  theme: "light" | "dark"
  onClear: () => void
}

interface EventMeta {
  Icon: typeof XCircle
  color: string
  label: (e: ChangeEvent) => string
}

function getMeta(type: ChangeEventType, theme: "light" | "dark"): EventMeta {
  const red    = theme === "dark" ? "#f87171" : "#dc2626"
  const green  = theme === "dark" ? "#4ade80" : "#16a34a"
  const amber  = theme === "dark" ? "#fbbf24" : "#d97706"
  const blue   = theme === "dark" ? "#60a5fa" : "#2563eb"
  const purple = theme === "dark" ? "#c084fc" : "#9333ea"
  const muted  = theme === "dark" ? "#a3a3a3" : "#737373"

  switch (type) {
    case "new_review_request":
      return {
        Icon: GitPullRequest, color: blue,
        label: (e) => `Review requested: #${e.prNumber} ${e.prTitle}`
      }
    case "new_mine":
      return {
        Icon: GitPullRequest, color: muted,
        label: (e) => `New PR: #${e.prNumber} ${e.prTitle}`
      }
    case "ci_failure":
      return {
        Icon: XCircle, color: red,
        label: (e) => `CI failed on #${e.prNumber} ${e.prTitle}`
      }
    case "ci_success":
      return {
        Icon: CheckCircle, color: green,
        label: (e) => `CI passed on #${e.prNumber} ${e.prTitle}`
      }
    case "approved":
      return {
        Icon: CheckCircle2, color: green,
        label: (e) =>
          e.detail
            ? `#${e.prNumber} approved by @${e.detail}`
            : `#${e.prNumber} ${e.prTitle} approved`
      }
    case "changes_requested":
      return {
        Icon: AlertCircle, color: amber,
        label: (e) =>
          e.detail
            ? `@${e.detail} requested changes on #${e.prNumber}`
            : `Changes requested on #${e.prNumber} ${e.prTitle}`
      }
    case "conflict":
      return {
        Icon: GitMerge, color: amber,
        label: (e) => `Merge conflict: #${e.prNumber} ${e.prTitle}`
      }
    case "merged":
      return {
        Icon: GitMerge, color: purple,
        label: (e) => `#${e.prNumber} ${e.prTitle} merged`
      }
  }
}

export function ChangesView({ changes, now, theme, onClear }: Props) {
  const muted   = theme === "dark" ? "#a3a3a3" : "#737373"
  const divider = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
  const hoverBg = theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"

  if (changes.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "24px 16px",
          color: muted,
        }}
      >
        <CheckCircle2 size={28} strokeWidth={1.5} aria-hidden="true" />
        <span style={{ fontSize: 13, textAlign: "center" }}>
          No changes yet
        </span>
        <span style={{ fontSize: 11, textAlign: "center", opacity: 0.7 }}>
          Changes appear here after the next sync
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Toolbar row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "4px 10px",
          borderBottom: `1px solid ${divider}`,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onClear}
          style={{
            fontSize: 11,
            color: muted,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
            borderRadius: 4,
          }}
        >
          Clear all
        </button>
      </div>

    <div
      role="list"
      aria-label="Recent changes"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "4px 0",
      }}
    >
      {changes.map((event) => {
        const { Icon, color, label } = getMeta(event.type, theme)
        const text = label(event)
        const ago  = formatAgoShort(event.createdAt, now)

        return (
          <a
            key={event.id}
            role="listitem"
            href={event.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`${text} — open PR`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "7px 12px",
              textDecoration: "none",
              color: "inherit",
              borderBottom: `1px solid ${divider}`,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = hoverBg
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = ""
            }}
          >
            {/* Event icon */}
            <Icon
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              style={{ color, flexShrink: 0, marginTop: 1 }}
            />

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.4,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {text}
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 10,
                  color: muted,
                  display: "flex",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {event.repo}
                </span>
                <span style={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                  {ago}
                </span>
              </div>
            </div>
          </a>
        )
      })}
    </div>
    </div>
  )
}
