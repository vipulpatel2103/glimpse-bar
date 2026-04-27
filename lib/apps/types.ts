import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"

export type AppId = "todo" | "jira" | "github" | "settings"

export interface AppDefinition {
  id: AppId
  name: string
  Icon: LucideIcon
  Renderer: ComponentType
  isExternal?: boolean
}
