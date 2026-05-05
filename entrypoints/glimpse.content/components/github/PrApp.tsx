import { useCallback, useEffect, useMemo, useState } from "react"

import {
  githubAuthItem,
  githubChangesItem,
  githubHiddenItem,
  githubPrsItem,
  githubReposItem,
  githubUiItem,
} from "~/lib/storage"
import { hidePr, unhidePr } from "~/lib/github/mutations"
import { countByView } from "~/lib/github/selectors"
import type {
  ChangeEvent,
  GitHubAuthState,
  GitHubUiState,
  GitHubView,
  PrId,
  PrTab,
  PullRequest,
  RepoMeta
} from "~/lib/github/types"

import { useNowTick } from "../../hooks/useNowTick"
import { useStorageItem } from "../../hooks/useStorageItem"
import { useViewportWidth } from "../../hooks/useViewportWidth"
import type { ContextMenuAnchor } from "../todo/ContextMenu"
import { ChangesView } from "./ChangesView"
import { PrContextMenu } from "./PrContextMenu"
import { PrHeader } from "./PrHeader"
import { PrListView } from "./PrListView"
import { PrSidebar } from "./PrSidebar"
import { PrViewerHeader } from "./PrViewerHeader"

const EXPAND_BREAKPOINT = 720

interface Props {
  theme: "light" | "dark"
}

export function PrApp({ theme }: Props) {
  const [auth]        = useStorageItem(githubAuthItem)
  const [prs]         = useStorageItem(githubPrsItem)
  const [repos]       = useStorageItem(githubReposItem)
  const [hidden, setHidden] = useStorageItem(githubHiddenItem)
  const [ui, setUi]   = useStorageItem(githubUiItem)
  const [changes, setChanges] = useStorageItem(githubChangesItem)

  const now       = useNowTick(60_000)
  const vw        = useViewportWidth()
  const canExpand = vw >= EXPAND_BREAKPOINT

  const uiState   = ui      as GitHubUiState
  const authState = auth    as GitHubAuthState
  const prList    = prs     as PullRequest[]
  const repoList  = repos   as RepoMeta[]
  const hiddenIds = hidden  as PrId[]
  const changesList = changes as ChangeEvent[]

  const expanded = uiState.expanded && canExpand

  // Unread count at mount time — computed before we reset lastOpenedAt.
  const [sessionUnread, setSessionUnread] = useState<number>(0)

  // On mount: capture unread count for this session's chip, then clear the dot.
  useEffect(() => {
    const lastOpened = uiState.lastOpenedAt ?? 0
    const unread = changesList.filter((c) => c.createdAt > lastOpened).length
    setSessionUnread(unread)
    void setUi({ ...uiState, lastOpenedAt: Date.now() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally once on mount

  const counts = useMemo(
    () => countByView(prList, repoList, hiddenIds),
    [prList, repoList, hiddenIds]
  )

  // ── Context menu state ──────────────────────────────────────────────────
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [menuPr,     setMenuPr]     = useState<PullRequest | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<ContextMenuAnchor | null>(null)

  const handleKebab = useCallback((pr: PullRequest, el: HTMLElement) => {
    setMenuPr(pr)
    setMenuAnchor({ kind: "element", el })
    setMenuOpen(true)
  }, [])

  const handleMenuClose = useCallback(() => setMenuOpen(false), [])

  // ── Hide / unhide ───────────────────────────────────────────────────────
  const handleHide = useCallback(() => {
    if (!menuPr) return
    void setHidden(hidePr(hiddenIds, menuPr.id))
  }, [menuPr, hiddenIds, setHidden])

  const handleUnhide = useCallback(() => {
    if (!menuPr) return
    void setHidden(unhidePr(hiddenIds, menuPr.id))
  }, [menuPr, hiddenIds, setHidden])

  /** Quick-action button on each card: hides if visible, unhides if in Hidden view. */
  const handleDirectToggleHide = useCallback(
    (pr: PullRequest) => {
      if (hiddenIds.includes(pr.id)) {
        void setHidden(unhidePr(hiddenIds, pr.id))
      } else {
        void setHidden(hidePr(hiddenIds, pr.id))
      }
    },
    [hiddenIds, setHidden]
  )

  // ── Navigation ──────────────────────────────────────────────────────────
  const handleTabChange = useCallback(
    (tab: PrTab) => {
      void setUi({ ...uiState, activeTab: tab, activeView: tab })
    },
    [uiState, setUi]
  )

  const handleChangeView = useCallback(
    (view: GitHubView) => {
      if (view === "mine" || view === "review" || view === "all") {
        void setUi({ ...uiState, activeTab: view, activeView: view })
      } else {
        // repo key, "hidden", or "changes" — keep activeTab unchanged
        void setUi({ ...uiState, activeView: view })
      }
    },
    [uiState, setUi]
  )

  const handleToggleExpanded = useCallback(() => {
    void setUi({ ...uiState, expanded: !uiState.expanded })
  }, [uiState, setUi])

  const handleChangesClick = useCallback(() => {
    void setUi({ ...uiState, activeView: "changes" })
  }, [uiState, setUi])

  const handleClearChanges = useCallback(() => {
    void setChanges([])
    void setUi({ ...uiState, activeView: uiState.activeTab })
  }, [setChanges, uiState, setUi])

  // ── Sync ────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    try {
      chrome.runtime?.sendMessage?.({ type: "gh:sync", manual: true })
    } catch {
      // silent
    }
  }, [])

  const handleConnectClick = useCallback(() => {
    try {
      chrome.runtime?.sendMessage?.({ type: "openOptionsPage", hash: "github" })
    } catch {
      // silent
    }
  }, [])

  // ── Is currently shown PR hidden? ───────────────────────────────────────
  const isMenuPrHidden = menuPr ? hiddenIds.includes(menuPr.id) : false

  // ── Layout ──────────────────────────────────────────────────────────────
  const isChangesView = uiState.activeView === "changes"

  const mainPane = (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden" }}>
      {/* Viewer strip */}
      <PrViewerHeader auth={authState} theme={theme} />

      {/* Panel header: title + refresh + segmented tabs + expand */}
      <PrHeader
        ui={uiState}
        counts={counts}
        now={now}
        canExpand={canExpand}
        theme={theme}
        unreadChanges={sessionUnread}
        totalChanges={changesList.length}
        onTabChange={handleTabChange}
        onToggleExpanded={handleToggleExpanded}
        onRefresh={handleRefresh}
        onChangesClick={handleChangesClick}
      />

      {/* Changes feed or PR list */}
      {isChangesView ? (
        <ChangesView
          changes={changesList}
          now={now}
          theme={theme}
          onClear={handleClearChanges}
        />
      ) : (
        <PrListView
          auth={authState}
          ui={uiState}
          prs={prList}
          repos={repoList}
          hidden={hiddenIds}
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

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", position: "relative" }}>
      {expanded && (
        <PrSidebar
          theme={theme}
          activeView={uiState.activeView}
          counts={counts}
          totalChanges={changesList.length}
          onChangeView={handleChangeView}
        />
      )}

      {mainPane}

      {/* Context menu — renders position:absolute relative to the panel */}
      <PrContextMenu
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
