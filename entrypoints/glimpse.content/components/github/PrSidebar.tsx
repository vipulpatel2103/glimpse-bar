import {
  EyeOff,
  GitBranch,
  GitPullRequest,
  Github,
  Inbox,
  Layers,
  type LucideIcon
} from "lucide-react"

import type { PrCounts } from "~/lib/github/selectors"
import type { GitHubView, PrTab, RepoKey } from "~/lib/github/types"

interface Props {
  theme: "light" | "dark"
  activeView: GitHubView
  counts: PrCounts
  onChangeView: (view: GitHubView) => void
}

interface SystemRow {
  id: PrTab | "hidden"
  label: string
  Icon: LucideIcon
  count: (c: PrCounts) => number
}

const SYSTEM_ROWS: SystemRow[] = [
  { id: "mine",   label: "Mine",            Icon: GitPullRequest, count: (c) => c.mine   },
  { id: "review", label: "Review requests", Icon: Inbox,          count: (c) => c.review },
  { id: "all",    label: "All",             Icon: Layers,         count: (c) => c.all    },
  { id: "hidden", label: "Hidden",          Icon: EyeOff,         count: (c) => c.hidden }
]

export function PrSidebar({ theme, activeView, counts, onChangeView }: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const divider = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
  const activeStyle = "bg-black/[0.06] dark:bg-white/[0.10] font-semibold"
  const itemBase =
    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] leading-tight text-left " +
    "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] " +
    "focus:outline-none focus-visible:bg-black/[0.04] dark:focus-visible:bg-white/[0.06]"

  const repoEntries = Object.entries(counts.byRepo).sort(([a], [b]) =>
    a.localeCompare(b)
  )

  return (
    <aside
      role="navigation"
      aria-label="PR views"
      className="flex h-full w-[200px] shrink-0 flex-col"
      style={{ borderRight: `1px solid ${divider}` }}
    >
      {/* Header */}
      <div
        className="flex h-11 shrink-0 items-center gap-1.5 px-3"
        style={{ borderBottom: `1px solid ${divider}` }}
      >
        <Github size={14} strokeWidth={2} aria-hidden="true" />
        <span className="text-[14px] font-semibold leading-none">GitHub PRs</span>
      </div>

      <div className="flex flex-1 flex-col gap-px overflow-y-auto p-2">
        {/* System views */}
        {SYSTEM_ROWS.map(({ id, label, Icon, count }) => {
          const selected = activeView === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeView(id as GitHubView)}
              aria-current={selected ? "page" : undefined}
              className={`${itemBase} ${selected ? activeStyle : ""}`}
            >
              <Icon size={14} strokeWidth={2} aria-hidden="true" />
              <span className="flex-1 truncate">{label}</span>
              <span
                className="text-[12px] tabular-nums"
                style={{ color: muted }}
              >
                {count(counts)}
              </span>
            </button>
          )
        })}

        {/* Repos divider + list */}
        {repoEntries.length > 0 && (
          <>
            <div
              className="my-2"
              style={{ height: 1, backgroundColor: divider }}
            />
            <div
              className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: muted }}
            >
              Repos
            </div>
            {repoEntries.map(([key, count]) => {
              const selected = activeView === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChangeView(key as RepoKey)}
                  aria-current={selected ? "page" : undefined}
                  title={key}
                  className={`${itemBase} ${selected ? activeStyle : ""}`}
                >
                  <GitBranch size={12} strokeWidth={2} aria-hidden="true" style={{ flexShrink: 0 }} />
                  <span
                    className="flex-1 truncate font-mono text-[11px]"
                    style={{ color: muted }}
                  >
                    {key}
                  </span>
                  <span
                    className="text-[12px] tabular-nums"
                    style={{ color: muted }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </>
        )}
      </div>
    </aside>
  )
}
