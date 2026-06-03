import { ChevronRight, Eye, EyeOff, MessageSquare, MoreHorizontal } from "lucide-react"
import { useState } from "react"

import type { ProviderAdapter } from "~/lib/pr/adapter"
import { getRepoColor } from "~/lib/pr/format"
import type { NormalizedPr } from "~/lib/pr/types"
import { usePrefersReducedMotion } from "../../hooks/useTheme"

import { PrAvatarChip } from "./PrAvatarChip"
import { PrOverallStateIcon } from "./PrOverallStateIcon"
import { PrStatusBadges } from "./PrStatusBadges"

interface Props {
  pr: NormalizedPr
  adapter: ProviderAdapter
  theme: "light" | "dark"
  onKebab?: (pr: NormalizedPr, anchor: HTMLElement) => void
  onHide?: (pr: NormalizedPr) => void
  /** When true the quick-action shows Eye + "Unhide PR". */
  isHidden?: boolean
}

export function PrCardRow({ pr, adapter, theme, onKebab, onHide, isHidden }: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const divider = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
  const reduced = usePrefersReducedMotion()
  const repoColor = getRepoColor(pr.repo)
  const [hovered, setHovered] = useState(false)

  const maxReviewers = 3
  const visibleReviewers = pr.reviewers.slice(0, maxReviewers)
  const overflowReviewers = pr.reviewers.length - visibleReviewers.length
  const branchSummary = `${pr.headRef} → ${pr.baseRef}`
  const pills = adapter.getStatusPills(pr)

  return (
    <a
      href={pr.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        textDecoration: "none",
        color: "inherit",
        borderBottom: `1px solid ${divider}`,
        position: "relative",
        cursor: "pointer",
        backgroundColor: "transparent",
        transition: reduced ? "none" : "background-color 100ms ease-out"
      }}
      onMouseEnter={(e) => {
        setHovered(true)
        ;(e.currentTarget as HTMLElement).style.backgroundColor =
          theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"
      }}
      onMouseLeave={(e) => {
        setHovered(false)
        ;(e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
      }}
    >
      {/* Repo color bar — 3 px left strip */}
      <div
        aria-hidden="true"
        title={pr.repo}
        style={{
          width: 3,
          flexShrink: 0,
          backgroundColor: repoColor,
          alignSelf: "stretch"
        }}
      />

      <div style={{ flex: 1, minWidth: 0, padding: "7px 10px 7px 8px" }}>
        {/* Line 1: #displayNumber + title */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 5,
            marginBottom: 3,
            paddingRight: 46
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: muted,
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0
            }}
          >
            {pr.displayNumber}
          </span>
          <span
            title={pr.title}
            style={{
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.3,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {pr.title}
          </span>
        </div>

        {/* Line 2: repo · head→base meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 5
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: repoColor,
              flexShrink: 0,
              opacity: 0.8
            }}
          />
          <span
            title={`${pr.repo} · ${branchSummary}`}
            style={{
              fontSize: 10,
              color: muted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1
            }}
          >
            <span style={{ fontWeight: 500 }}>{pr.repo}</span>
            <span style={{ opacity: 0.6 }}> · {branchSummary}</span>
          </span>
        </div>

        {/* Line 3: avatars → status pills + state icon + comment count */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
            <PrAvatarChip
              displayName={pr.author.displayName}
              avatarUrl={pr.author.avatarUrl}
              size={20}
              theme={theme}
            />
            {pr.reviewers.length > 0 && (
              <>
                <ChevronRight
                  size={9}
                  strokeWidth={2}
                  style={{ color: muted, flexShrink: 0 }}
                  aria-hidden="true"
                />
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {visibleReviewers.map((r) => (
                    <PrAvatarChip
                      key={r.id}
                      displayName={r.displayName}
                      avatarUrl={r.avatarUrl}
                      reviewState={r.state}
                      size={20}
                      theme={theme}
                    />
                  ))}
                  {overflowReviewers > 0 && (
                    <PrAvatarChip
                      displayName={`+${overflowReviewers}`}
                      size={20}
                      theme={theme}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          <div style={{ flex: 1 }} />

          <PrStatusBadges pills={pills} theme={theme} />
          <PrOverallStateIcon state={pr.overallState} theme={theme} />

          <div style={{ display: "flex", alignItems: "center", gap: 2, color: muted, flexShrink: 0 }}>
            <MessageSquare size={11} strokeWidth={2} aria-hidden="true" />
            <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
              {pr.commentsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Quick-hide + kebab */}
      {(onHide || onKebab) && (
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            display: "flex",
            alignItems: "center",
            gap: 2,
            opacity: hovered ? 1 : 0,
            transition: reduced ? "none" : "opacity 100ms ease-out",
            pointerEvents: hovered ? "auto" : "none"
          }}
        >
          {onHide && (
            <button
              type="button"
              aria-label={isHidden ? `Unhide PR ${pr.displayNumber}` : `Hide PR ${pr.displayNumber}`}
              title={isHidden ? "Unhide PR" : "Hide PR"}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onHide(pr)
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: 4,
                border: "none",
                background: "transparent",
                color: isHidden ? "#3b82f6" : muted,
                cursor: "pointer",
                padding: 0
              }}
            >
              {isHidden
                ? <Eye size={12} strokeWidth={2} aria-hidden="true" />
                : <EyeOff size={12} strokeWidth={2} aria-hidden="true" />
              }
            </button>
          )}
          {onKebab && (
            <button
              type="button"
              aria-label={`Options for PR ${pr.displayNumber}`}
              title="Options"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onKebab(pr, e.currentTarget)
              }}
              style={{
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
                padding: 0
              }}
            >
              <MoreHorizontal size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </a>
  )
}
