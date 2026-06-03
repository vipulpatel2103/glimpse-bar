import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"

import type { ProviderId } from "../pr/types"

export type AppId = "todo" | "notes" | "github" | "bitbucket" | "settings"

export interface AppDefinition {
  id: AppId
  name: string
  /** Lucide icon component. Mutually exclusive with `iconUrl`. */
  Icon?: LucideIcon
  /**
   * URL/path of a raster (or SVG) image asset. Used for brand marks that
   * don't fit Lucide's monochrome stroke style. Renders as 18 px in the bar.
   */
  iconUrl?: string
  /**
   * Component rendered when the app's panel is active. Optional for PR
   * apps — they delegate to the shared `<PrApp>` via `providerId`.
   */
  Renderer?: ComponentType
  /**
   * For PR-renderer apps: which provider's adapter drives the shared panel.
   * Mutually exclusive with `Renderer`.
   */
  providerId?: ProviderId
  /** True for apps that open externally (e.g. Settings → options page). */
  isExternal?: boolean
  /**
   * Hard-coded visibility flag. When `false`, the icon is omitted from the
   * Glimpse Bar entirely. Reserved for app entries that are scaffolded but
   * not yet usable.
   */
  enabled?: boolean
}
