import { useCallback, useEffect, useMemo } from "react"

import { APPS } from "~/lib/apps/registry"
import type { AppDefinition } from "~/lib/apps/types"
import type { ChangeEvent, GitHubUiState } from "~/lib/github/types"
import {
  activeAppItem,
  edgeItem,
  githubChangesItem,
  githubUiItem,
  hiddenAppsItem,
  positionItem,
  todoUiItem,
  transparencyItem,
  type AppId,
  type Edge,
  type Position
} from "~/lib/storage"

import { GlimpseBar } from "./components/GlimpseBar"
import { GlimpsePanel } from "./components/GlimpsePanel"
import { PopoverPortalProvider } from "./components/PopoverPortal"
import { useStorageItem } from "./hooks/useStorageItem"
import { useTheme } from "./hooks/useTheme"

const openOptionsPage = () => {
  try {
    chrome.runtime?.sendMessage?.({ type: "openOptionsPage" }, (resp) => {
      const err = chrome.runtime.lastError
      if (err) {
        // eslint-disable-next-line no-console
        console.warn("[glimpse-bar] openOptionsPage SW error:", err.message)
        return
      }
      if (resp && !resp.ok) {
        // eslint-disable-next-line no-console
        console.warn("[glimpse-bar] openOptionsPage failed:", resp.error)
      }
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[glimpse-bar] failed to send openOptionsPage message", err)
  }
}

const defaultPositionForViewport = (): Position => {
  if (typeof document === "undefined") return { x: 0, y: 0 }
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  return {
    x: Math.max(0, vw - 44),
    y: Math.max(16, Math.floor(vh / 2 - 110))
  }
}

export default function App() {
  const theme = useTheme()
  const [position, setPosition] = useStorageItem(positionItem)
  const [edge, setEdge]         = useStorageItem(edgeItem)
  const [transparency]          = useStorageItem(transparencyItem)
  const [activeAppId, setActiveAppId] = useStorageItem(activeAppItem)
  const [hiddenApps]            = useStorageItem(hiddenAppsItem)
  const [todoUi]                = useStorageItem(todoUiItem)
  const [githubUi]              = useStorageItem(githubUiItem)
  const [githubChanges]         = useStorageItem(githubChangesItem)

  // Derive the list of apps shown in the bar.
  // "settings" can never be hidden (it's the only way back to Options).
  const visibleApps = useMemo<AppDefinition[]>(
    () => APPS.filter(
      (a) => a.id === "settings" || !(hiddenApps as AppId[]).includes(a.id)
    ),
    [hiddenApps]
  )

  // Blue dot on the GitHub icon when there are unread change events.
  const githubHasDot = useMemo(() => {
    const changes = githubChanges as ChangeEvent[]
    const lastOpened = (githubUi as GitHubUiState).lastOpenedAt ?? 0
    return changes.some((c) => c.createdAt > lastOpened)
  }, [githubChanges, githubUi])

  const displayPosition: Position =
    position.x === 0 && position.y === 0
      ? defaultPositionForViewport()
      : position

  const activeApp =
    visibleApps.find((a) => a.id === activeAppId && !a.isExternal) ?? null

  // Auto-close the panel if the user hides the currently-active app.
  useEffect(() => {
    if (
      activeAppId &&
      (hiddenApps as AppId[]).includes(activeAppId as AppId)
    ) {
      void setActiveAppId(null)
    }
  }, [hiddenApps, activeAppId, setActiveAppId])

  const onCommitPosition = useCallback(
    (next: Position, e: Edge) => {
      void setPosition(next)
      void setEdge(e)
    },
    [setPosition, setEdge]
  )

  const onActivateApp = useCallback(
    (app: AppDefinition) => {
      if (app.isExternal) {
        openOptionsPage()
        return
      }
      void setActiveAppId(app.id)
    },
    [setActiveAppId]
  )

  const onClosePanel = useCallback(() => {
    void setActiveAppId(null)
  }, [setActiveAppId])

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <PopoverPortalProvider>
        <GlimpseBar
          apps={visibleApps}
          position={displayPosition}
          edge={edge}
          transparency={transparency}
          theme={theme}
          activeApp={activeAppId}
          badges={{ github: githubHasDot }}
          onCommitPosition={onCommitPosition}
          onActivateApp={onActivateApp}
        />
        <GlimpsePanel
          app={activeApp}
          edge={edge}
          theme={theme}
          pinned={
            (activeApp?.id === "todo"   && todoUi.pinned) ||
            (activeApp?.id === "github" && githubUi.pinned)
          }
          expanded={
            (activeApp?.id === "todo"   && todoUi.expanded) ||
            (activeApp?.id === "github" && githubUi.expanded)
          }
          onClose={onClosePanel}
        />
      </PopoverPortalProvider>
    </div>
  )
}
