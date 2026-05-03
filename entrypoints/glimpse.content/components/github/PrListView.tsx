import {
  AlertCircle,
  EyeOff,
  Github,
  GitPullRequest,
  Inbox,
  KeyRound,
  Loader2,
  type LucideIcon
} from "lucide-react"

import { usePrefersReducedMotion } from "../../hooks/useTheme"

import { resolveView } from "~/lib/github/selectors"
import type {
  GitHubAuthState,
  GitHubUiState,
  PrId,
  PullRequest,
  RepoMeta
} from "~/lib/github/types"

import { PrCardRow } from "./PrCardRow"
import { PrDayHeading } from "./PrDayHeading"

interface Props {
  auth: GitHubAuthState
  ui: GitHubUiState
  prs: PullRequest[]
  repos: RepoMeta[]
  hidden: PrId[]
  now: number
  theme: "light" | "dark"
  onKebab?: (pr: PullRequest, anchor: HTMLElement) => void
  onConnectClick: () => void
  onRetry: () => void
}

export function PrListView({
  auth,
  ui,
  prs,
  repos,
  hidden,
  now,
  theme,
  onKebab,
  onConnectClick,
  onRetry
}: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const reduced = usePrefersReducedMotion()

  // No PAT → connect CTA.
  if (!auth.pat) {
    return (
      <EmptyState
        Icon={KeyRound}
        theme={theme}
        message="Connect GitHub to see your PRs."
        action={{ label: "Open settings →", onClick: onConnectClick }}
      />
    )
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
          aria-label="Syncing GitHub…"
        />
        <span style={{ fontSize: 12, color: muted }}>Syncing GitHub…</span>
      </div>
    )
  }

  // Sync error.
  if (ui.lastSyncError && prs.length === 0) {
    return (
      <EmptyState
        Icon={AlertCircle}
        theme={theme}
        message={`Couldn't sync — ${ui.lastSyncError}`}
        action={{ label: "Retry", onClick: onRetry }}
      />
    )
  }

  const groups = resolveView(prs, ui.activeView, ui.activeTab, repos, hidden)

  if (groups.length === 0 || groups.every((g) => g.items.length === 0)) {
    const { Icon, message } = emptyStateForView(ui.activeView)
    return <EmptyState Icon={Icon} theme={theme} message={message} />
  }

  return (
    <div
      role="list"
      style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
    >
      {groups.map((group) => (
        <div key={group.key} role="group" aria-label={group.label}>
          <PrDayHeading label={group.label} theme={theme} />
          {group.items.map((pr) => (
            <div key={pr.id} role="listitem">
              <PrCardRow
                pr={pr}
                now={now}
                theme={theme}
                onKebab={onKebab}
              />
            </div>
          ))}
        </div>
      ))}

      {/* @keyframes spin is defined in PrHeader which always mounts alongside this view */}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function emptyStateForView(view: string): { Icon: LucideIcon; message: string } {
  if (view === "mine")   return { Icon: GitPullRequest, message: "You haven't opened any PRs." }
  if (view === "review") return { Icon: Inbox,          message: "No PRs awaiting your review." }
  if (view === "all")    return { Icon: Github,         message: "No open PRs in your queue." }
  if (view === "hidden") return { Icon: EyeOff,         message: "Nothing hidden." }
  // Per-repo view
  return { Icon: GitPullRequest, message: "No PRs in this repo." }
}

function EmptyState({
  Icon,
  theme,
  message,
  action
}: {
  Icon: LucideIcon
  theme: "light" | "dark"
  message: string
  action?: { label: string; onClick: () => void }
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
      <Icon size={32} strokeWidth={1.5} style={{ color: mutedHalf }} aria-hidden="true" />
      <span style={{ fontSize: 12, color: muted, lineHeight: 1.5 }}>{message}</span>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
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
          {action.label}
        </button>
      )}
    </div>
  )
}
