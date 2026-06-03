import { Bell, EyeOff, Github, GitPullRequest, Inbox, Layers } from "lucide-react"

import type { SidebarProps } from "~/lib/pr/adapter"
import { getRepoColor } from "~/lib/pr/format"

import { useStorageItem } from "../../hooks/useStorageItem"
import { githubReposItem } from "~/lib/storage"
import type { RepoMeta } from "~/lib/github/types"

import { SidebarDivider } from "../pr/sidebar/SidebarDivider"
import { SidebarLeafRow } from "../pr/sidebar/SidebarLeafRow"
import { SidebarSystemRow } from "../pr/sidebar/SidebarSystemRow"

const ITEM_BASE =
  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] leading-tight text-left " +
  "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
  "focus:outline-none focus-visible:bg-black/[0.04] dark:focus-visible:bg-white/[0.06]"

const ACTIVE = "bg-black/[0.06] dark:bg-white/[0.10] font-semibold"

export function PrSidebar({
  theme,
  activeView,
  counts,
  totalChanges,
  onChangeView
}: SidebarProps) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const divider = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
  const [repos] = useStorageItem(githubReposItem)
  const repoList = repos as RepoMeta[]

  const repoEntries = Object.entries(counts.byRepo).sort(([a], [b]) =>
    a.localeCompare(b)
  )

  return (
    <aside
      role="navigation"
      aria-label="GitHub PR views"
      className="flex h-full w-[200px] shrink-0 flex-col"
      style={{ borderRight: `1px solid ${divider}` }}
    >
      <div
        className="flex h-11 shrink-0 items-center gap-1.5 px-3"
        style={{ borderBottom: `1px solid ${divider}` }}
      >
        <Github size={14} strokeWidth={2} aria-hidden="true" />
        <span className="text-[14px] font-semibold leading-none">GitHub PRs</span>
      </div>

      <div className="flex flex-1 flex-col gap-px overflow-y-auto p-2">
        {totalChanges > 0 && (
          <button
            type="button"
            onClick={() => onChangeView("changes")}
            aria-current={activeView === "changes" ? "page" : undefined}
            className={`${ITEM_BASE} ${activeView === "changes" ? ACTIVE : ""}`}
          >
            <Bell size={14} strokeWidth={2} aria-hidden="true" />
            <span className="flex-1 truncate">What&apos;s New</span>
            <span className="text-[12px] tabular-nums" style={{ color: muted }}>
              {totalChanges}
            </span>
          </button>
        )}

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

        {repoEntries.length > 0 && (
          <>
            <SidebarDivider theme={theme} label="Repos" />
            {repoEntries.map(([key, count]) => (
              <SidebarLeafRow
                key={key}
                label={key}
                count={count}
                color={getRepoColor(key)}
                selected={activeView === key}
                theme={theme}
                onClick={() => onChangeView(key)}
                disabled={!isRepoEnabled(repoList, key)}
              />
            ))}
          </>
        )}
      </div>
    </aside>
  )
}

function isRepoEnabled(list: RepoMeta[], key: string): boolean {
  const meta = list.find((r) => r.key === key)
  return meta === undefined ? true : meta.enabled
}
