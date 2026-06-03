import { useCallback, useEffect, useMemo, useState } from "react"

import { APPS } from "~/lib/apps/registry"
import type { AppDefinition } from "~/lib/apps/types"
import type {
  NormalizedChangeEvent,
  PrUiState
} from "~/lib/pr/types"
import {
  activeAppItem,
  bitbucketChangesItem,
  bitbucketUiItem,
  edgeItem,
  githubChangesItem,
  githubUiItem,
  hiddenAppsItem,
  notesUiItem,
  positionItem,
  todoUiItem,
  transparencyItem,
  type AppId,
  type Edge,
  type Position
} from "~/lib/storage"

import { GlimpseBar } from "./components/GlimpseBar"
import { GlimpsePanel } from "./components/GlimpsePanel"
import { NotesQuickCompose } from "./components/notes/NotesQuickCompose"
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
  const [notesUi]               = useStorageItem(notesUiItem)
  const [githubUi]              = useStorageItem(githubUiItem)
  const [githubChanges]         = useStorageItem(githubChangesItem)
  const [bitbucketUi]           = useStorageItem(bitbucketUiItem)
  const [bitbucketChanges]      = useStorageItem(bitbucketChangesItem)

  // Bar quick-compose: Shift+click on the Notes tile anchors a floating
  // composer here (lives in App so it survives panel open/close).
  const [quickAnchor, setQuickAnchor] = useState<DOMRect | null>(null)
  const onQuickComposeNotes = useCallback((el: HTMLElement) => {
    setQuickAnchor(el.getBoundingClientRect())
  }, [])

  // Transient toast (e.g. note-capture limit reached, broadcast by the SW).
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    const onMsg = (msg: unknown) => {
      if (
        msg &&
        typeof msg === "object" &&
        (msg as { type?: string }).type === "notesLimitReached"
      ) {
        setToast("Note limit reached (100). Archive or delete old notes.")
      }
    }
    chrome.runtime?.onMessage?.addListener(onMsg)
    return () => chrome.runtime?.onMessage?.removeListener(onMsg)
  }, [])
  useEffect(() => {
    if (!toast) return
    const h = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(h)
  }, [toast])

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
    const changes = githubChanges as NormalizedChangeEvent[]
    const lastOpened = (githubUi as PrUiState).lastOpenedAt ?? 0
    return changes.some((c) => c.createdAt > lastOpened)
  }, [githubChanges, githubUi])

  // Same for Bitbucket.
  const bitbucketHasDot = useMemo(() => {
    const changes = bitbucketChanges as NormalizedChangeEvent[]
    const lastOpened = (bitbucketUi as PrUiState).lastOpenedAt ?? 0
    return changes.some((c) => c.createdAt > lastOpened)
  }, [bitbucketChanges, bitbucketUi])

  const displayPosition: Position =
    position.x === 0 && position.y === 0
      ? defaultPositionForViewport()
      : position

  const activeApp =
    visibleApps.find((a) => a.id === activeAppId && !a.isExternal) ?? null

  // Migration: Phase 03 replaced the (never-shipped) Jira app with Notes. If a
  // stale `activeAppItem` somehow holds "jira", clear it so the panel doesn't
  // try to resolve a missing app. Belt-and-braces — the icon never shipped.
  useEffect(() => {
    if ((activeAppId as string) === "jira") void setActiveAppId(null)
  }, [activeAppId, setActiveAppId])

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
      // Toggle: clicking the active app's icon closes the panel. Bypasses
      // `pinned` because this is a deliberate close, not outside-click.
      void setActiveAppId(activeAppId === app.id ? null : app.id)
    },
    [activeAppId, setActiveAppId]
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
          badges={{ github: githubHasDot, bitbucket: bitbucketHasDot }}
          onCommitPosition={onCommitPosition}
          onActivateApp={onActivateApp}
          onQuickComposeNotes={onQuickComposeNotes}
        />
        <GlimpsePanel
          app={activeApp}
          edge={edge}
          theme={theme}
          pinned={
            (activeApp?.id === "todo"      && todoUi.pinned) ||
            (activeApp?.id === "notes"     && notesUi.pinned) ||
            (activeApp?.id === "github"    && githubUi.pinned) ||
            (activeApp?.id === "bitbucket" && bitbucketUi.pinned)
          }
          expanded={
            (activeApp?.id === "todo"      && todoUi.expanded) ||
            (activeApp?.id === "notes"     && notesUi.expanded) ||
            (activeApp?.id === "github"    && githubUi.expanded) ||
            (activeApp?.id === "bitbucket" && bitbucketUi.expanded)
          }
          onClose={onClosePanel}
        />
        {quickAnchor ? (
          <NotesQuickCompose
            anchorRect={quickAnchor}
            edge={edge}
            theme={theme}
            onClose={() => setQuickAnchor(null)}
          />
        ) : null}
        {toast ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "fixed",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 2147483647,
              pointerEvents: "none",
              maxWidth: "min(360px, 90vw)",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              lineHeight: 1.3,
              textAlign: "center",
              backgroundColor: theme === "dark" ? "#fafafa" : "#171717",
              color: theme === "dark" ? "#171717" : "#fafafa",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
            }}>
            {toast}
          </div>
        ) : null}
      </PopoverPortalProvider>
    </div>
  )
}
