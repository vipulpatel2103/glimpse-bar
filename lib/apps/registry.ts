import { CheckSquare, ExternalLink, Github, Settings } from "lucide-react"

import type { AppDefinition } from "./types"

const PlaceholderRenderer = () => null

export const APPS: AppDefinition[] = [
  {
    id: "todo",
    name: "TODO",
    Icon: CheckSquare,
    Renderer: PlaceholderRenderer
  },
  {
    id: "jira",
    name: "Jira",
    Icon: ExternalLink,
    Renderer: PlaceholderRenderer
  },
  {
    id: "github",
    name: "GitHub PRs",
    Icon: Github,
    Renderer: PlaceholderRenderer
  },
  {
    id: "settings",
    name: "Settings",
    Icon: Settings,
    Renderer: PlaceholderRenderer,
    isExternal: true
  }
]
