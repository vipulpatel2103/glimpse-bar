import { Loader2 } from "lucide-react"

import type { ProviderAdapter, EmptyStateConfig } from "~/lib/pr/adapter"
import { resolveView } from "~/lib/pr/selectors"
import type { NormalizedPr, PrUiState } from "~/lib/pr/types"
import { usePrefersReducedMotion } from "../../hooks/useTheme"

import { PrCardRow } from "./PrCardRow"
import { PrDayHeading } from "./PrDayHeading"

interface Props {
  adapter: ProviderAdapter
  ui: PrUiState
  prs: NormalizedPr[]
  hidden: string[]
  hasAuth: boolean
  hasScope: boolean
  gate: (pr: NormalizedPr) => boolean
  now: number
  theme: "light" | "dark"
  onKebab?: (pr: NormalizedPr, anchor: HTMLElement) => void
  onHide?: (pr: NormalizedPr) => void
  onConnectClick: () => void
  onRetry: () => void
}

export function PrListView({
  adapter,
  ui,
  prs,
  hidden,
  hasAuth,
  hasScope,
  gate,
  now,
  theme,
  onKebab,
  onHide,
  onConnectClick,
  onRetry
}: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const reduced = usePrefersReducedMotion()

  // Provider gates the empty-state copy/icon based on auth + scope state.
  if (!hasAuth || !hasScope) {
    const cfg = adapter.emptyStateForView(
      ui.activeView,
      hasAuth,
      hasScope,
      { onConnect: onConnectClick, onRetry }
    )
    return <EmptyState cfg={cfg} theme={theme} />
  }

  // First sync loading (no cached data yet).
  if (prs.length === 0 && !ui.lastSyncAt && !ui.lastSyncError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 8, padding: 24 }}>
        <Loader2
          size={28}
          strokeWidth={1.5}
          style={{
            color: muted,
            animation: reduced ? "none" : "spin 600ms linear infinite"
          }}
          aria-label={`Syncing ${adapter.brand.shortName}…`}
        />
        <span style={{ fontSize: 12, color: muted }}>
          Syncing {adapter.brand.shortName}…
        </span>
      </div>
    )
  }

  // Sync error.
  if (ui.lastSyncError && prs.length === 0) {
    const cfg: EmptyStateConfig = {
      message: `Couldn't sync — ${ui.lastSyncError}`,
      action: { label: "Retry", onClick: onRetry }
    }
    return <EmptyState cfg={cfg} theme={theme} />
  }

  const groups = resolveView(prs, ui.activeView, ui.activeTab, gate, hidden)

  if (groups.length === 0 || groups.every((g) => g.items.length === 0)) {
    const cfg = adapter.emptyStateForView(
      ui.activeView,
      hasAuth,
      hasScope,
      { onConnect: onConnectClick, onRetry }
    )
    return <EmptyState cfg={cfg} theme={theme} />
  }

  return (
    <div role="list" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
      {groups.map((group, idx) => (
        <div key={group.key} role="group" aria-label={group.label}>
          <PrDayHeading label={group.label} theme={theme} isFirst={idx === 0} />
          {group.items.map((pr) => (
            <div key={pr.id} role="listitem">
              <PrCardRow
                pr={pr}
                adapter={adapter}
                theme={theme}
                onKebab={onKebab}
                onHide={onHide}
                isHidden={hidden.includes(pr.id)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function EmptyState({
  cfg,
  theme
}: {
  cfg: EmptyStateConfig
  theme: "light" | "dark"
}) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const mutedHalf = theme === "dark" ? "rgba(163,163,163,0.5)" : "rgba(115,115,115,0.5)"

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: 8,
        padding: "32px 24px",
        textAlign: "center"
      }}
    >
      {cfg.iconUrl ? (
        <img
          src={cfg.iconUrl}
          alt=""
          aria-hidden="true"
          style={{ width: 32, height: 32, opacity: 0.5 }}
        />
      ) : cfg.Icon ? (
        <cfg.Icon size={32} strokeWidth={1.5} style={{ color: mutedHalf }} aria-hidden="true" />
      ) : null}
      <span style={{ fontSize: 12, color: muted, lineHeight: 1.5 }}>{cfg.message}</span>
      {cfg.action && (
        <button
          type="button"
          onClick={cfg.action.onClick}
          style={{
            fontSize: 12,
            color: "#3b82f6",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 2
          }}
        >
          {cfg.action.label}
        </button>
      )}
    </div>
  )
}
