// GitHub adapter — wires the GitHub-specific state + behavior into the shared
// PR renderer (lib/pr).

import { Github, GitPullRequest, Inbox, KeyRound, EyeOff } from "lucide-react"
import { useMemo } from "react"
import type { WxtStorageItem } from "@wxt-dev/storage"

import {
  ciStatusMeta,
  draftMeta,
  mergeStateMeta,
  reviewStatusMeta,
  type StatusMeta
} from "../pr/format"
import type { LooseAuth, ProviderAdapter } from "../pr/adapter"
import type { NormalizedPr, View } from "../pr/types"
import { useStorageItem } from "~/entrypoints/glimpse.content/hooks/useStorageItem"
import { PrSidebar } from "~/entrypoints/glimpse.content/components/github/PrSidebar"
import {
  githubAuthItem,
  githubChangesItem,
  githubHiddenItem,
  githubNotifBaselineItem,
  githubPrsItem,
  githubReposItem,
  githubUiItem
} from "../storage"
import type { RepoMeta } from "./types"

function useGitHubGate(): (pr: NormalizedPr) => boolean {
  const [repos] = useStorageItem(githubReposItem)
  const list = repos as RepoMeta[]
  return useMemo(() => {
    const enabled = new Map<string, boolean>()
    for (const r of list) enabled.set(r.key, r.enabled)
    return (pr: NormalizedPr) => {
      // Newly-discovered repos default to enabled until persisted.
      const flag = enabled.get(pr.repo)
      return flag === undefined ? true : flag
    }
  }, [list])
}

function getGitHubStatusPills(pr: NormalizedPr): StatusMeta[] {
  const out: StatusMeta[] = []

  const conflict = mergeStateMeta(pr.mergeState)
  if (conflict) out.push(conflict)

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
  _hasScope: boolean,
  handlers: { onConnect: () => void; onRetry: () => void }
) {
  if (!hasAuth) {
    return {
      Icon: KeyRound,
      message: "Connect GitHub to see your PRs.",
      action: { label: "Open settings →", onClick: handlers.onConnect }
    }
  }
  if (view === "mine")   return { Icon: GitPullRequest, message: "You haven't opened any PRs." }
  if (view === "review") return { Icon: Inbox,          message: "No PRs awaiting your review." }
  if (view === "all")    return { Icon: Github,         message: "No open PRs in your queue." }
  if (view === "hidden") return { Icon: EyeOff,         message: "Nothing hidden." }
  return { Icon: GitPullRequest, message: "No PRs in this repo." }
}

export const githubAdapter: ProviderAdapter = {
  id: "github",

  brand: {
    name:      "GitHub PRs",
    shortName: "GitHub",
    Icon:      Github
  },

  storage: {
    // Cast: provider-typed auth widens to LooseAuth for shared UI consumption.
    // setValue is contravariant so direct assignment fails; the shared layer
    // never writes auth itself (only reads via viewerInfo / isAuthed).
    auth:     githubAuthItem as unknown as WxtStorageItem<LooseAuth, Record<string, unknown>>,
    prs:      githubPrsItem,
    hidden:   githubHiddenItem,
    ui:       githubUiItem,
    changes:  githubChangesItem,
    baseline: githubNotifBaselineItem
  },

  syncMessage:      { type: "gh:sync" },
  optionsHash:      "github",
  changeCredsLabel: "Change PAT",
  segmentedLayoutId: "gh-tab-thumb",

  isAuthed:   (auth) => Boolean((auth as { pat?: string }).pat),
  viewerInfo: (auth) => {
    const a = auth as { login?: string; avatarUrl?: string }
    if (!a.login) return null
    return { displayName: a.login, avatarUrl: a.avatarUrl }
  },

  usePrGate:   useGitHubGate,
  useHasScope: () => true, // GitHub auth alone is sufficient.

  getStatusPills:    getGitHubStatusPills,
  emptyStateForView,

  Sidebar: PrSidebar
}
