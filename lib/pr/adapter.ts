// ProviderAdapter — the contract every PR provider implements.
// Shared <PrApp /> reads only this interface; provider-specific code
// (auth UI, REST/GraphQL transport, sync orchestrator) stays in the
// provider's own module.

import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import type { WxtStorageItem } from "@wxt-dev/storage"

import type { StatusMeta } from "./format"
import type {
  NormalizedChangeEvent,
  NormalizedPr,
  NotifBaseline,
  PrCounts,
  PrUiState,
  ProviderId,
  View
} from "./types"

// ── Helper types consumed by <PrApp /> + child components ──────────────────

export interface ViewerInfo {
  displayName: string
  avatarUrl?: string
  /** Optional secondary line — e.g. "workspace: acme" or scope chips. */
  subtitle?: string
}

export interface EmptyStateConfig {
  Icon?: LucideIcon
  iconUrl?: string
  message: string
  action?: { label: string; onClick: () => void }
}

export interface SidebarProps {
  theme: "light" | "dark"
  activeView: View
  counts: PrCounts
  totalChanges: number
  onChangeView: (view: View) => void
}

/**
 * Auth state is intentionally typed loose. The shared UI only reads viewer
 * fields via `viewerInfo()`. Providers' own modules retain full typed access
 * to their auth shape internally.
 */
export type LooseAuth = Record<string, unknown>

// ── Storage handles bundle ─────────────────────────────────────────────────

export interface AdapterStorage {
  auth:     WxtStorageItem<LooseAuth, Record<string, unknown>>
  prs:      WxtStorageItem<NormalizedPr[], Record<string, unknown>>
  hidden:   WxtStorageItem<string[], Record<string, unknown>>
  ui:       WxtStorageItem<PrUiState, Record<string, unknown>>
  changes:  WxtStorageItem<NormalizedChangeEvent[], Record<string, unknown>>
  baseline: WxtStorageItem<NotifBaseline, Record<string, unknown>>
}

// ── ProviderAdapter ────────────────────────────────────────────────────────

export interface ProviderAdapter {
  id: ProviderId

  brand: {
    /** Long form for sidebar header + "Connect X" empty state. */
    name: string
    /** Short form for "Open in X" context-menu item. */
    shortName: string
    iconUrl?: string
    Icon?: LucideIcon
  }

  storage: AdapterStorage

  /** SW message tag for manual sync (e.g. `{ type: "gh:sync" }`). */
  syncMessage: { type: string }
  /** Hash for `chrome.runtime.sendMessage({ type: "openOptionsPage", hash })`. */
  optionsHash: string
  /** Header viewer-strip link copy. */
  changeCredsLabel: string
  /** Unique animation key for the segmented tab thumb. */
  segmentedLayoutId: string

  /** Auth predicate: true if creds are present + functional. */
  isAuthed: (auth: LooseAuth) => boolean
  /** Pluck viewer info for the header strip. Returns null when not authed. */
  viewerInfo: (auth: LooseAuth) => ViewerInfo | null

  /** Hook called by <PrApp /> to compute the gating callback for selectors. */
  usePrGate: () => (pr: NormalizedPr) => boolean

  /** Hook called by <PrApp /> to determine whether the panel has a usable scope. */
  useHasScope: () => boolean

  /** Per-provider status pill priority + visibility. */
  getStatusPills: (pr: NormalizedPr) => StatusMeta[]

  /** Per-view empty-state config. */
  emptyStateForView: (
    view: View,
    hasAuth: boolean,
    hasScope: boolean,
    handlers: { onConnect: () => void; onRetry: () => void }
  ) => EmptyStateConfig

  /** Per-provider sidebar component built from shared sidebar primitives. */
  Sidebar: ComponentType<SidebarProps>
}
