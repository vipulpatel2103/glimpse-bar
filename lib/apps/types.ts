import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"

export type AppId = "todo" | "jira" | "github" | "settings"

export interface AppDefinition {
  id: AppId
  name: string
  Icon: LucideIcon
  Renderer: ComponentType
  isExternal?: boolean
  /**
   * Hard-coded visibility flag. When `false`, the icon is omitted from the
   * Glimpse Bar entirely (not just disabled). Reserved for app entries that
   * are scaffolded but not yet usable. The TODO phase introduces a
   * user-controllable enable/disable toggle in the Options page.
   */
  enabled?: boolean
}
