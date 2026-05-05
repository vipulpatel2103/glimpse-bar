import { AnimatePresence, motion } from "framer-motion"
import { Bell, Clock, Maximize2, Minimize2, RefreshCw } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { formatAgoShort } from "~/lib/github/format"
import type { PrCounts } from "~/lib/github/selectors"
import type { GitHubUiState, PrTab } from "~/lib/github/types"

import { usePrefersReducedMotion } from "../../hooks/useTheme"

interface Props {
  ui: GitHubUiState
  counts: PrCounts
  now: number
  canExpand: boolean
  theme: "light" | "dark"
  /** Unread changes since last panel open (captured at mount time). */
  unreadChanges: number
  /** Total events in the change feed — controls chip visibility. */
  totalChanges: number
  onTabChange: (tab: PrTab) => void
  onToggleExpanded: () => void
  onRefresh: () => void
  onChangesClick: () => void
}

const TABS: Array<{ id: PrTab; label: string }> = [
  { id: "mine",   label: "Mine"   },
  { id: "review", label: "Review" },
  { id: "all",    label: "All"    }
]

export function PrHeader({
  ui,
  counts,
  now,
  canExpand,
  theme,
  unreadChanges,
  totalChanges,
  onTabChange,
  onToggleExpanded,
  onRefresh,
  onChangesClick
}: Props) {
  const reduced = usePrefersReducedMotion()
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const divider = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"

  const [spinning, setSpinning] = useState(false)
  const lastSyncRef = useRef(ui.lastSyncAt)

  useEffect(() => {
    if (ui.lastSyncAt !== lastSyncRef.current) {
      lastSyncRef.current = ui.lastSyncAt
      setSpinning(false)
    }
  }, [ui.lastSyncAt])

  // Rate-limit state — computed from storage, clears automatically as `now` ticks.
  const isRateLimited = !!(ui.rateLimitResetAt && ui.rateLimitResetAt > now)
  const rateLimitMinutes = isRateLimited
    ? Math.max(1, Math.ceil(((ui.rateLimitResetAt ?? 0) - now) / 60_000))
    : 0

  function handleRefresh() {
    if (isRateLimited) return
    setSpinning(true)
    onRefresh()
  }

  const agoText = ui.lastSyncAt ? formatAgoShort(ui.lastSyncAt, now) : null
  const ExpandIcon = ui.expanded ? Minimize2 : Maximize2

  const trackBg = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
  const thumbBg = theme === "dark" ? "rgba(255,255,255,0.14)" : "#ffffff"

  const tabCount = (tab: PrTab) => {
    if (tab === "mine")   return counts.mine
    if (tab === "review") return counts.review
    return counts.all
  }

  // Tabs are visually muted when the sidebar "Hidden" view is active.
  const tabsMuted = ui.activeView === "hidden"

  const spinStyle: React.CSSProperties =
    spinning && !reduced
      ? { animation: "spin 600ms linear infinite" }
      : {}

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 10px",
        height: 44,
        borderBottom: `1px solid ${divider}`,
        flexShrink: 0
      }}
    >
      {/* Left: title + refresh + status indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1, flexShrink: 0 }}>
          PR&rsquo;s
        </span>

        <button
          type="button"
          aria-label={spinning ? "Syncing" : "Refresh"}
          title={isRateLimited ? `Rate-limited — resets in ${rateLimitMinutes}m` : "Refresh"}
          onClick={handleRefresh}
          disabled={spinning || isRateLimited}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: 4,
            border: "none",
            background: "none",
            cursor: spinning || isRateLimited ? "default" : "pointer",
            color: muted,
            padding: 0,
            flexShrink: 0,
            opacity: isRateLimited ? 0.4 : 1
          }}
        >
          <RefreshCw size={13} strokeWidth={2} aria-hidden="true" style={spinStyle} />
        </button>

        {/* Rate-limit chip — takes precedence over ago/error */}
        {isRateLimited ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              color: theme === "dark" ? "#f59e0b" : "#d97706",
              backgroundColor:
                theme === "dark"
                  ? "rgba(245,158,11,0.16)"
                  : "rgba(245,158,11,0.10)",
              borderRadius: 999,
              padding: "1px 6px",
              flexShrink: 0,
              whiteSpace: "nowrap"
            }}
            title={`Rate-limited — resets in ${rateLimitMinutes}m`}
          >
            <Clock size={9} strokeWidth={2} aria-hidden="true" />
            Rate-limited · resets in {rateLimitMinutes}m
          </span>
        ) : ui.lastSyncError ? (
          <span
            title={ui.lastSyncError}
            style={{
              fontSize: 10,
              color: theme === "dark" ? "#f87171" : "#dc2626",
              flexShrink: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            ✗ Sync error
          </span>
        ) : agoText ? (
          <span
            style={{
              fontSize: 10,
              color: muted,
              fontVariantNumeric: "tabular-nums",
              flexShrink: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {agoText}
          </span>
        ) : null}
      </div>

      {/* Segmented tab control — muted when Hidden view is active */}
      <div
        role="tablist"
        aria-label="PR queries"
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: trackBg,
          borderRadius: 999,
          padding: 2,
          gap: 0,
          flexShrink: 0,
          opacity: tabsMuted ? 0.45 : 1,
          transition: reduced ? "none" : "opacity 150ms ease-out"
        }}
      >
        {TABS.map(({ id, label }) => {
          const active = ui.activeTab === id
          const count = tabCount(id)
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                height: 24,
                padding: "0 8px",
                borderRadius: 999,
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                color: active
                  ? theme === "dark" ? "#fafafa" : "#171717"
                  : muted,
                zIndex: 1,
                whiteSpace: "nowrap",
                minWidth: 44
              }}
            >
              <AnimatePresence>
                {active && (
                  <motion.span
                    layoutId="gh-tab-thumb"
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 999,
                      backgroundColor: thumbBg,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                      zIndex: -1
                    }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { duration: 0.18, ease: [0.32, 0.72, 0, 1] }
                    }
                  />
                )}
              </AnimatePresence>
              {label}
              <span
                style={{
                  fontSize: 10,
                  fontVariantNumeric: "tabular-nums",
                  opacity: active ? 1 : 0.7
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Changes chip — always visible once the feed has events */}
      {totalChanges > 0 && (
        <button
          type="button"
          aria-label={
            unreadChanges > 0
              ? `${unreadChanges} new change${unreadChanges > 1 ? "s" : ""}`
              : "View changes"
          }
          title={
            unreadChanges > 0
              ? `${unreadChanges} new change${unreadChanges > 1 ? "s" : ""} since last visit`
              : "View change feed"
          }
          onClick={onChangesClick}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            height: 22,
            padding: unreadChanges > 0 ? "0 7px" : "0 6px",
            borderRadius: 999,
            cursor: "pointer",
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
            // Unread: solid blue pill; seen: icon-only ghost button
            backgroundColor: unreadChanges > 0
              ? "#3b82f6"
              : "transparent",
            border: unreadChanges > 0
              ? "none"
              : `1px solid ${theme === "dark" ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.18)"}`,
            color: unreadChanges > 0
              ? "#ffffff"
              : muted,
          }}
        >
          <Bell size={11} strokeWidth={2.5} aria-hidden="true" />
          {unreadChanges > 0 && (
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {unreadChanges}
            </span>
          )}
        </button>
      )}

      {/* Expand/collapse */}
      {canExpand && (
        <button
          type="button"
          aria-label={ui.expanded ? "Collapse panel" : "Expand panel"}
          title={ui.expanded ? "Collapse" : "Expand"}
          onClick={onToggleExpanded}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: 4,
            border: "none",
            background: "none",
            cursor: "pointer",
            color: muted,
            padding: 0,
            flexShrink: 0
          }}
        >
          <ExpandIcon size={13} strokeWidth={2} aria-hidden="true" />
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </header>
  )
}
