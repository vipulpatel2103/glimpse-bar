import { Fragment } from "react"
import { EyeOff, GitPullRequest, Inbox, Layers } from "lucide-react"

import bbIcon from "~/assets/bb.png"
import type { SidebarProps } from "~/lib/pr/adapter"
import { getRepoColor } from "~/lib/pr/format"
import {
  bitbucketReposItem,
  bitbucketUiItem,
  bitbucketWorkspacesItem
} from "~/lib/storage"
import type { BbRepoMeta, BbWorkspaceMeta } from "~/lib/bitbucket/types"

import { useStorageItem } from "../../hooks/useStorageItem"
import { SidebarDivider } from "../pr/sidebar/SidebarDivider"
import { SidebarHierarchyRow } from "../pr/sidebar/SidebarHierarchyRow"
import { SidebarLeafRow } from "../pr/sidebar/SidebarLeafRow"
import { SidebarSystemRow } from "../pr/sidebar/SidebarSystemRow"

export function BbSidebar({
  theme,
  activeView,
  counts,
  onChangeView
}: SidebarProps) {
  const divider = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"

  const [workspaces]    = useStorageItem(bitbucketWorkspacesItem)
  const [repos]         = useStorageItem(bitbucketReposItem)
  const [ui, setUi]     = useStorageItem(bitbucketUiItem)
  const wsList = workspaces as BbWorkspaceMeta[]
  const repoList = repos as BbRepoMeta[]

  const enabledWorkspaces = wsList.filter((w) => w.enabled)
  // With a single declared workspace (the common case post-API-token migration),
  // auto-expand its repos. Multi-workspace setups still honor user's toggle state.
  const explicitExpanded = ui.sidebarExpanded
  const expanded = new Set<string>(
    explicitExpanded ??
      (enabledWorkspaces.length === 1 ? [enabledWorkspaces[0]!.slug] : [])
  )

  const reposByWs = new Map<string, BbRepoMeta[]>()
  for (const r of repoList) {
    const arr = reposByWs.get(r.workspace) ?? []
    arr.push(r)
    reposByWs.set(r.workspace, arr)
  }
  for (const arr of reposByWs.values()) {
    arr.sort((a, b) => a.key.localeCompare(b.key))
  }

  function toggleWorkspace(slug: string) {
    const current = ui.sidebarExpanded ?? []
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug]
    void setUi({ ...ui, sidebarExpanded: next })
  }

  return (
    <aside
      role="navigation"
      aria-label="Bitbucket PR views"
      className="flex h-full w-[200px] shrink-0 flex-col"
      style={{ borderRight: `1px solid ${divider}` }}
    >
      <div
        className="flex h-11 shrink-0 items-center gap-1.5 px-3"
        style={{ borderBottom: `1px solid ${divider}` }}
      >
        <img
          src={bbIcon}
          alt=""
          aria-hidden="true"
          style={{ width: 14, height: 14, objectFit: "contain" }}
        />
        <span className="text-[14px] font-semibold leading-none">Bitbucket PRs</span>
      </div>

      <div className="flex flex-1 flex-col gap-px overflow-y-auto p-2">
        <SidebarSystemRow
          Icon={GitPullRequest}
          label="Mine"
          count={counts.mine}
          selected={activeView === "mine"}
          theme={theme}
          onClick={() => onChangeView("mine")}
        />
        <SidebarSystemRow
          Icon={Inbox}
          label="Review requests"
          count={counts.review}
          selected={activeView === "review"}
          theme={theme}
          onClick={() => onChangeView("review")}
        />
        <SidebarSystemRow
          Icon={Layers}
          label="All"
          count={counts.all}
          selected={activeView === "all"}
          theme={theme}
          onClick={() => onChangeView("all")}
        />
        <SidebarSystemRow
          Icon={EyeOff}
          label="Hidden"
          count={counts.hidden}
          selected={activeView === "hidden"}
          theme={theme}
          onClick={() => onChangeView("hidden")}
        />

        {enabledWorkspaces.length > 0 && (
          <>
            <SidebarDivider theme={theme} label="Workspaces" />
            {enabledWorkspaces.map((ws) => {
              const wsRepos = reposByWs.get(ws.slug) ?? []
              const wsCount = counts.byParent[ws.slug] ?? 0
              const isExpanded = expanded.has(ws.slug)
              return (
                <Fragment key={ws.slug}>
                  <SidebarHierarchyRow
                    label={ws.name}
                    slug={ws.slug}
                    count={wsCount}
                    expanded={isExpanded}
                    theme={theme}
                    onToggle={() => toggleWorkspace(ws.slug)}
                  />
                  {isExpanded && wsRepos.length > 0 && (
                    <div className="ml-3 flex flex-col gap-px">
                      {wsRepos.map((r) => (
                        <SidebarLeafRow
                          key={r.key}
                          label={r.key}
                          count={counts.byRepo[r.key] ?? 0}
                          color={getRepoColor(r.key)}
                          selected={activeView === r.key}
                          theme={theme}
                          onClick={() => onChangeView(r.key)}
                          disabled={!r.enabled}
                        />
                      ))}
                    </div>
                  )}
                </Fragment>
              )
            })}
          </>
        )}
      </div>
    </aside>
  )
}
