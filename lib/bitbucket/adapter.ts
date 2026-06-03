// Bitbucket adapter — wires Bitbucket-specific state + behavior into the
// shared PR renderer (lib/pr).

import { Building2, EyeOff, GitPullRequest, Inbox, KeyRound } from "lucide-react"
import { useMemo } from "react"
import type { WxtStorageItem } from "@wxt-dev/storage"

import bbIcon from "~/assets/bb.svg"
import { BbSidebar } from "~/entrypoints/glimpse.content/components/bitbucket/BbSidebar"
import { useStorageItem } from "~/entrypoints/glimpse.content/hooks/useStorageItem"

import {
  ciStatusMeta,
  draftMeta,
  reviewStatusMeta,
  type StatusMeta
} from "../pr/format"
import type { LooseAuth, ProviderAdapter } from "../pr/adapter"
import type { NormalizedPr, View } from "../pr/types"
import {
  bitbucketAuthItem,
  bitbucketChangesItem,
  bitbucketHiddenItem,
  bitbucketNotifBaselineItem,
  bitbucketPrsItem,
  bitbucketReposItem,
  bitbucketUiItem,
  bitbucketWorkspacesItem
} from "../storage"
import type { BbRepoMeta, BbWorkspaceMeta } from "./types"

function useBbGate(): (pr: NormalizedPr) => boolean {
  const [workspaces] = useStorageItem(bitbucketWorkspacesItem)
  const [repos]      = useStorageItem(bitbucketReposItem)
  const wsList = workspaces as BbWorkspaceMeta[]
  const repoList = repos as BbRepoMeta[]

  return useMemo(() => {
    const enabledWs = new Set(
      wsList.filter((w) => w.enabled).map((w) => w.slug)
    )
    const repoEnabled = new Map<string, boolean>()
    for (const r of repoList) repoEnabled.set(r.key, r.enabled)

    return (pr: NormalizedPr) => {
      if (!pr.parent || !enabledWs.has(pr.parent)) return false
      const flag = repoEnabled.get(pr.repo)
      // Newly-seen repos default to OFF — user explicitly opts in via Options.
      return flag === undefined ? false : flag
    }
  }, [wsList, repoList])
}

function useBbHasScope(): boolean {
  const [workspaces] = useStorageItem(bitbucketWorkspacesItem)
  return (workspaces as BbWorkspaceMeta[]).some((w) => w.enabled)
}

function getBbStatusPills(pr: NormalizedPr): StatusMeta[] {
  const out: StatusMeta[] = []

  // No `Conflicts` pill in v0 — Bitbucket REST 2.0 doesn't expose mergeable cheaply.
  const review = reviewStatusMeta(pr.reviewDecision)
  if (review) out.push(review)

  if (pr.isDraft) out.push(draftMeta())

  if (out.length < 2 && pr.ciState !== "none" && pr.ciState !== "neutral") {
    out.push(ciStatusMeta(pr.ciState))
  }
  return out
}

function emptyStateForView(
  view: View,
  hasAuth: boolean,
  hasScope: boolean,
  handlers: { onConnect: () => void; onRetry: () => void }
) {
  if (!hasAuth) {
    return {
      Icon: KeyRound,
      message: "Connect Bitbucket to see your PRs.",
      action: { label: "Open settings →", onClick: handlers.onConnect }
    }
  }
  if (!hasScope) {
    return {
      Icon: Building2,
      message: "Enable a workspace in Options to start syncing.",
      action: { label: "Open settings →", onClick: handlers.onConnect }
    }
  }
  if (view === "mine")   return { Icon: GitPullRequest, message: "You haven't opened any PRs." }
  if (view === "review") return { Icon: Inbox,          message: "No PRs awaiting your review." }
  if (view === "all")    return { iconUrl: bbIcon,      message: "No open PRs in your queue." }
  if (view === "hidden") return { Icon: EyeOff,         message: "Nothing hidden." }
  return { Icon: GitPullRequest, message: "No PRs in this repo." }
}

export const bitbucketAdapter: ProviderAdapter = {
  id: "bitbucket",

  brand: {
    name:      "Bitbucket PRs",
    shortName: "Bitbucket",
    iconUrl:   bbIcon
  },

  storage: {
    auth:     bitbucketAuthItem as unknown as WxtStorageItem<LooseAuth, Record<string, unknown>>,
    prs:      bitbucketPrsItem,
    hidden:   bitbucketHiddenItem,
    ui:       bitbucketUiItem,
    changes:  bitbucketChangesItem,
    baseline: bitbucketNotifBaselineItem
  },

  syncMessage:      { type: "bb:sync" },
  optionsHash:      "bitbucket",
  changeCredsLabel: "Change credentials",
  segmentedLayoutId: "bb-tab-thumb",

  isAuthed: (auth) =>
    Boolean(
      (auth as { token?: string }).token &&
      (auth as { username?: string }).username
    ),
  viewerInfo: (auth) => {
    const a = auth as { nickname?: string; avatarUrl?: string; workspace?: string }
    if (!a.nickname) return null
    return {
      displayName: a.nickname,
      avatarUrl:   a.avatarUrl,
      subtitle:    a.workspace ? `workspace: ${a.workspace}` : undefined
    }
  },

  usePrGate:   useBbGate,
  useHasScope: useBbHasScope,

  getStatusPills:    getBbStatusPills,
  emptyStateForView,

  Sidebar: BbSidebar
}
