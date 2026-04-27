import { useCallback } from "react"

import { APPS } from "~/lib/apps/registry"
import type { AppDefinition } from "~/lib/apps/types"
import {
  activeAppItem,
  edgeItem,
  positionItem,
  transparencyItem,
  type Edge,
  type Position
} from "~/lib/storage"

import { GlimpseBar } from "./components/GlimpseBar"
import { GlimpsePanel } from "./components/GlimpsePanel"
import { useStorageItem } from "./hooks/useStorageItem"
import { useTheme } from "./hooks/useTheme"

const openOptionsPage = () => {
  // Content scripts can't reliably call chrome.runtime.openOptionsPage()
  // (it requires the extension's own context). Send a message to the
  // background service worker, which CAN open it.
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
  const [edge, setEdge] = useStorageItem(edgeItem)
  const [transparency] = useStorageItem(transparencyItem)
  const [activeAppId, setActiveAppId] = useStorageItem(activeAppItem)

  // First render uses fallback {0,0}; convert to right-center if still at origin.
  const displayPosition: Position =
    position.x === 0 && position.y === 0
      ? defaultPositionForViewport()
      : position

  const activeApp =
    APPS.find((a) => a.id === activeAppId && !a.isExternal) ?? null

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
      <GlimpseBar
        position={displayPosition}
        edge={edge}
        transparency={transparency}
        theme={theme}
        activeApp={activeAppId}
        onCommitPosition={onCommitPosition}
        onActivateApp={onActivateApp}
      />
      <GlimpsePanel
        app={activeApp}
        edge={edge}
        theme={theme}
        onClose={onClosePanel}
      />
    </div>
  )
}
