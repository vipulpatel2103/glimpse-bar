import { useCallback, useEffect, useMemo, useState } from "react"

import type { ProviderAdapter } from "~/lib/pr/adapter"
import { hidePr, unhidePr } from "~/lib/pr/mutations"
import { countByView } from "~/lib/pr/selectors"
import type {
  NormalizedPr,
  Tab,
  View
} from "~/lib/pr/types"

import { useNowTick } from "../../hooks/useNowTick"
import { useStorageItem } from "../../hooks/useStorageItem"
import { useViewportWidth } from "../../hooks/useViewportWidth"
import type { ContextMenuAnchor } from "../todo/ContextMenu"

import { ChangesView } from "./ChangesView"
import { PrContextMenu } from "./PrContextMenu"
import { PrHeader } from "./PrHeader"
import { PrListView } from "./PrListView"
import { PrViewerHeader } from "./PrViewerHeader"

const EXPAND_BREAKPOINT = 720

interface Props {
  adapter: ProviderAdapter
  theme: "light" | "dark"
}

export function PrApp({ adapter, theme }: Props) {
  const [auth]                  = useStorageItem(adapter.storage.auth)
  const [prs]                   = useStorageItem(adapter.storage.prs)
  const [hidden, setHidden]     = useStorageItem(adapter.storage.hidden)
  const [ui, setUi]             = useStorageItem(adapter.storage.ui)
  const [changes, setChanges]   = useStorageItem(adapter.storage.changes)

  const now       = useNowTick(60_000)
  const vw        = useViewportWidth()
  const canExpand = vw >= EXPAND_BREAKPOINT

  const expanded = ui.expanded && canExpand

  // Adapter-driven gating + scope hooks. Adapter object is stable, so
  // calling these every render preserves hook order.
  const gate     = adapter.usePrGate()
  const hasScope = adapter.useHasScope()
  const hasAuth  = adapter.isAuthed(auth)
  const viewer   = adapter.viewerInfo(auth)

  // Capture unread count on mount, then mark panel "opened".
  const [sessionUnread, setSessionUnread] = useState<number>(0)
  useEffect(() => {
    const lastOpened = ui.lastOpenedAt ?? 0
    const unread = changes.filter((c) => c.createdAt > lastOpened).length
    setSessionUnread(unread)
    void setUi({ ...ui, lastOpenedAt: Date.now() })

    // First-open auto-sync: if creds + scope are present but no sync has
    // happened yet (and there's no current error/rate-limit), fire one.
    // Otherwise the panel sits on "Syncing…" until the alarm tick arrives.
    if (
      hasAuth &&
      hasScope &&
      !ui.lastSyncAt &&
      !ui.lastSyncError &&
      !ui.rateLimitResetAt
    ) {
      try {
        chrome.runtime?.sendMessage?.({
          ...adapter.syncMessage,
          manual: true
        })
      } catch {
        // silent
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(
    () => countByView(prs, gate, hidden),
    [prs, gate, hidden]
  )

  // ── Context menu state ──────────────────────────────────────────────────
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [menuPr,     setMenuPr]     = useState<NormalizedPr | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<ContextMenuAnchor | null>(null)

  const handleKebab = useCallback((pr: NormalizedPr, el: HTMLElement) => {
    setMenuPr(pr)
    setMenuAnchor({ kind: "element", el })
    setMenuOpen(true)
  }, [])

  const handleMenuClose = useCallback(() => setMenuOpen(false), [])

  // ── Hide / unhide ───────────────────────────────────────────────────────
  const handleHide = useCallback(() => {
    if (!menuPr) return
    void setHidden(hidePr(hidden, menuPr.id))
  }, [menuPr, hidden, setHidden])

  const handleUnhide = useCallback(() => {
    if (!menuPr) return
    void setHidden(unhidePr(hidden, menuPr.id))
  }, [menuPr, hidden, setHidden])

  const handleDirectToggleHide = useCallback(
    (pr: NormalizedPr) => {
      if (hidden.includes(pr.id)) {
        void setHidden(unhidePr(hidden, pr.id))
      } else {
        void setHidden(hidePr(hidden, pr.id))
      }
    },
    [hidden, setHidden]
  )

  // ── Navigation ──────────────────────────────────────────────────────────
  const handleTabChange = useCallback(
    (tab: Tab) => {
      void setUi({ ...ui, activeTab: tab, activeView: tab })
    },
    [ui, setUi]
  )

  const handleChangeView = useCallback(
    (view: View) => {
      if (view === "mine" || view === "review" || view === "all") {
        void setUi({ ...ui, activeTab: view, activeView: view })
      } else {
        void setUi({ ...ui, activeView: view })
      }
    },
    [ui, setUi]
  )

  const handleToggleExpanded = useCallback(() => {
    void setUi({ ...ui, expanded: !ui.expanded })
  }, [ui, setUi])

  const handleChangesClick = useCallback(() => {
    void setUi({ ...ui, activeView: "changes" })
  }, [ui, setUi])

  const handleClearChanges = useCallback(() => {
    void setChanges([])
    void setUi({ ...ui, activeView: ui.activeTab })
  }, [setChanges, ui, setUi])

  // ── Sync ────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    try {
      chrome.runtime?.sendMessage?.({
        ...adapter.syncMessage,
        manual: true
      })
    } catch {
      // silent
    }
  }, [adapter])

  const handleConnectClick = useCallback(() => {
    try {
      chrome.runtime?.sendMessage?.({
        type: "openOptionsPage",
        hash: adapter.optionsHash
      })
    } catch {
      // silent
    }
  }, [adapter])

  const isMenuPrHidden = menuPr ? hidden.includes(menuPr.id) : false
  const isChangesView = ui.activeView === "changes"

  const mainPane = (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden" }}>
      <PrViewerHeader adapter={adapter} viewer={viewer} theme={theme} />

      <PrHeader
        adapter={adapter}
        ui={ui}
        counts={counts}
        now={now}
        canExpand={canExpand}
        theme={theme}
        unreadChanges={sessionUnread}
        totalChanges={changes.length}
        onTabChange={handleTabChange}
        onToggleExpanded={handleToggleExpanded}
        onRefresh={handleRefresh}
        onChangesClick={handleChangesClick}
      />

      {isChangesView ? (
        <ChangesView
          changes={changes}
          now={now}
          theme={theme}
          onClear={handleClearChanges}
        />
      ) : (
        <PrListView
          adapter={adapter}
          ui={ui}
          prs={prs}
          hidden={hidden}
          hasAuth={hasAuth}
          hasScope={hasScope}
          gate={gate}
          now={now}
          theme={theme}
          onKebab={handleKebab}
          onHide={handleDirectToggleHide}
          onConnectClick={handleConnectClick}
          onRetry={handleRefresh}
        />
      )}
    </div>
  )

  const Sidebar = adapter.Sidebar

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", position: "relative" }}>
      {expanded && (
        <Sidebar
          theme={theme}
          activeView={ui.activeView}
          counts={counts}
          totalChanges={changes.length}
          onChangeView={handleChangeView}
        />
      )}

      {mainPane}

      <PrContextMenu
        adapter={adapter}
        pr={menuPr}
        open={menuOpen}
        anchor={menuAnchor}
        isHidden={isMenuPrHidden}
        theme={theme}
        onClose={handleMenuClose}
        onHide={handleHide}
        onUnhide={handleUnhide}
      />
    </div>
  )
}
