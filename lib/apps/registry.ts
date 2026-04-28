import { CheckSquare, ExternalLink, Github, Settings } from "lucide-react"

import type { AppDefinition } from "./types"

const PlaceholderRenderer = () => null

// Master list. Entries with `enabled: false` are hidden from the Glimpse Bar
// until their phase ships. Re-enable by flipping the flag (and providing a
// real Renderer when the phase delivers one).
const ALL_APPS: AppDefinition[] = [
  {
    id: "todo",
    name: "TODO",
    Icon: CheckSquare,
    Renderer: PlaceholderRenderer,
    enabled: true
  },
  {
    id: "jira",
    name: "Jira",
    Icon: ExternalLink,
    Renderer: PlaceholderRenderer,
    // Hidden until phases/03-jira ships.
    enabled: false
  },
  {
    id: "github",
    name: "GitHub PRs",
    Icon: Github,
    Renderer: PlaceholderRenderer,
    // Hidden until phases/02-github-prs ships.
    enabled: false
  },
  {
    id: "settings",
    name: "Settings",
    Icon: Settings,
    Renderer: PlaceholderRenderer,
    isExternal: true,
    enabled: true
  }
]

export const APPS: AppDefinition[] = ALL_APPS.filter(
  (a) => a.enabled !== false
)
