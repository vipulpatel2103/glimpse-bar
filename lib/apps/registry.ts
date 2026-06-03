import { CheckSquare, Github, Settings, StickyNote } from "lucide-react"

import bbIcon from "~/assets/bb.svg"
import type { AppDefinition } from "./types"

const PlaceholderRenderer = () => null

// Master list. Entries with `enabled: false` are hidden from the Glimpse Bar
// until their phase ships. PR-rendering apps use `providerId` instead of
// a direct `Renderer` — `GlimpsePanel` looks up the adapter via lib/pr/adapters.
const ALL_APPS: AppDefinition[] = [
  {
    id: "todo",
    name: "TODO",
    Icon: CheckSquare,
    Renderer: PlaceholderRenderer,
    enabled: true
  },
  {
    id: "notes",
    name: "Notes",
    Icon: StickyNote,
    // Dispatched by `app.id === "notes"` in GlimpsePanel (like TODO); the
    // Renderer field stays a placeholder so the registry doesn't pull the
    // whole NotesApp import graph at module load.
    Renderer: PlaceholderRenderer,
    enabled: true
  },
  {
    id: "github",
    name: "GitHub PRs",
    Icon: Github,
    providerId: "github",
    enabled: true
  },
  {
    id: "bitbucket",
    name: "Bitbucket PRs",
    iconUrl: bbIcon,
    providerId: "bitbucket",
    enabled: true
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
