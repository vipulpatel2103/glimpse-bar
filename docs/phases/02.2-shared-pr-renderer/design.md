# Design — Shared PR Renderer

> Architecture spec for Phase 02.2. Mirrors the inline design produced by `/sc:design` so it stays referenceable during implementation.

---

## Decisions locked

- **Phase 02.2** — slots between 02.1 (Bitbucket) and 03 (Jira). Pure refactor; no new user-facing features.
- **No migration.** Storage keys bump (`gb-github-prs` → `gb-github-prs-v2` etc.) for impacted items. Old data orphaned harmlessly — first version is not yet published.
- **Old per-provider files deleted outright.** No re-export shims.
- **`NormalizedPr`** is the canonical PR type.
- **Adapter registry** lives in `lib/pr/adapters.ts` (separate from `lib/apps/registry.ts`). Apps registry references adapters by `providerId`.

---

## 1. Type system — `lib/pr/types.ts`

```ts
export type ProviderId = "github" | "bitbucket" | "gitlab" | "azure"

export type Tab = "mine" | "review" | "all"

export type CiState = "success" | "failure" | "pending" | "neutral" | "none"

export type ReviewDecision =
  | "approved" | "changes_requested" | "review_required"
  | "commented" | "none"

/** Widest union across all four providers; per-provider mappers pick a subset. */
export type ReviewerState =
  | "approved" | "changes_requested" | "dismissed" | "commented" | "pending"

export type MergeState =
  | "clean" | "conflicting" | "behind" | "blocked" | "unknown"

export type OverallState =
  | "ready" | "failed" | "blocked" | "pending" | "neutral"

export interface Reviewer {
  id: string                    // stable provider identifier
  displayName: string
  avatarUrl?: string
  state: ReviewerState
}

export interface NormalizedPr {
  id: string                    // `${providerId}:${nativeId}`
  providerId: ProviderId
  displayNumber: string         // "#1234" / "!45"
  number: number
  title: string
  url: string
  repo: string                  // path-shaped; also the sidebar/color key
  parent?: string               // workspace / group / org
  author: { displayName: string; avatarUrl?: string }
  isDraft: boolean
  state: "open" | "merged" | "closed" | "declined" | "superseded"
  headRef: string
  baseRef: string
  createdAt: number
  updatedAt: number
  commentsCount: number
  reviewDecision: ReviewDecision
  reviewers: Reviewer[]
  ciState: CiState
  failingChecks: number
  totalChecks: number
  mergeState: MergeState
  overallState: OverallState
  fromTab: Array<"mine" | "review">
}

export type View = Tab | "hidden" | "changes" | string  // string covers repo keys

export interface PrUiState {
  activeTab: Tab
  expanded: boolean
  pinned: boolean
  sidebarCollapsed: boolean
  activeView: View
  refreshIntervalMin: number
  sidebarExpanded?: string[]    // optional per-provider hierarchy state
  lastSyncAt?: number
  lastSyncError?: string
  rateLimitResetAt?: number
  lastOpenedAt?: number
}

export interface PrCounts {
  mine: number
  review: number
  all: number
  hidden: number
  byRepo: Record<string, number>
  byParent: Record<string, number>
}

export interface NormalizedChangeEvent {
  id: string
  prId: string
  prNumber: number
  prTitle: string
  repo: string
  prUrl: string
  type:
    | "new_review_request" | "new_mine"
    | "ci_failure" | "ci_success"
    | "approved" | "changes_requested"
    | "merged" | "declined" | "conflict"
  detail?: string
  createdAt: number
}

export type NotifBaseline = Record<string, {
  ciState: CiState
  reviewDecision: ReviewDecision
  fromTab: Array<"mine" | "review">
  mergeState: MergeState
  state: NormalizedPr["state"]
}>
```

### Why `parent` not `workspace`?
Generic field absorbs Bitbucket's workspace, GitLab's group, Azure's organization+project. Adapter knows what to call it for empty-state copy.

### Why `displayNumber` separate from `number`?
GitLab uses `!iid` (exclamation), Azure uses bare integers. `displayNumber` is the rendered string ("#1234", "!45"); `number` stays integer for sorting + URL building.

---

## 2. Adapter contract — `lib/pr/adapter.ts`

```ts
export interface ProviderAdapter {
  id: ProviderId

  brand: {
    name: string                // "GitHub PRs", "Bitbucket PRs"
    shortName: string           // "GitHub", "Bitbucket"
    iconUrl?: string
    Icon?: LucideIcon
  }

  storage: {
    auth:    WxtStorageItem<LooseAuth, ...>
    prs:     WxtStorageItem<NormalizedPr[], ...>
    hidden:  WxtStorageItem<string[], ...>
    ui:      WxtStorageItem<PrUiState, ...>
    changes: WxtStorageItem<NormalizedChangeEvent[], ...>
    baseline: WxtStorageItem<NotifBaseline, ...>
  }

  syncMessage: { type: string }
  optionsHash: string
  changeCredsLabel: string       // "Change PAT" / "Change credentials"
  segmentedLayoutId: string      // unique per provider — animation key

  isAuthed: (auth: LooseAuth) => boolean
  hasScope: (auth: LooseAuth, sidecar: unknown) => boolean
  viewerInfo: (auth: LooseAuth) => ViewerInfo | null

  getStatusPills: (pr: NormalizedPr) => StatusMeta[]

  emptyStateForView: (
    view: View,
    hasAuth: boolean,
    hasScope: boolean,
    handlers: { onConnect: () => void; onRetry: () => void }
  ) => EmptyStateConfig

  Sidebar: ComponentType<SidebarProps>
}
```

The auth state is intentionally typed loose. Adapter exposes typed `isAuthed` / `viewerInfo` accessors. This avoids generic-explosion in `<PrApp>`.

### `lib/pr/adapters.ts`

```ts
export const ADAPTERS: Record<ProviderId, ProviderAdapter | undefined> = {
  github:    githubAdapter,
  bitbucket: bitbucketAdapter,
  gitlab:    undefined,  // Phase 02.3
  azure:     undefined   // Phase 02.4
}
```

`AppDefinition` gains `providerId?: ProviderId`. `GlimpsePanel` looks up the adapter:

```tsx
{app.id === "todo"  ? <TodoApp theme={theme} />
 : app.providerId   ? <PrApp adapter={ADAPTERS[app.providerId]!} theme={theme} />
 : <FallbackHeader app={app} theme={theme} />}
```

---

## 3. Storage layout

| Item | Old type | New type | Key change |
|---|---|---|---|
| `githubAuthItem` | `GitHubAuthState` | unchanged | unchanged |
| `bitbucketAuthItem` | `BbAuthState` | unchanged | unchanged |
| `githubPrsItem` | `PullRequest[]` | **`NormalizedPr[]`** | `gb-github-prs` → `gb-github-prs-v2` |
| `bitbucketPrsItem` | `BbPullRequest[]` | **`NormalizedPr[]`** | `gb-bb-prs` → `gb-bb-prs-v2` |
| `githubReposItem` | `RepoMeta[]` | unchanged | unchanged |
| `bitbucketReposItem` | `BbRepoMeta[]` | unchanged | unchanged |
| `bitbucketWorkspacesItem` | `BbWorkspaceMeta[]` | unchanged | unchanged |
| `githubHiddenItem` | `string[]` | unchanged | unchanged |
| `bitbucketHiddenItem` | `string[]` | unchanged | unchanged |
| `githubUiItem` | `GitHubUiState` | **`PrUiState`** | `gb-github-ui` → `gb-github-ui-v2` |
| `bitbucketUiItem` | `BbUiState` | **`PrUiState`** | `gb-bb-ui` → `gb-bb-ui-v2` |
| `githubChangesItem` | `ChangeEvent[]` | **`NormalizedChangeEvent[]`** | bumped |
| `bitbucketChangesItem` | `BbChangeEvent[]` | **`NormalizedChangeEvent[]`** | bumped |
| `githubNotifBaselineItem` | local | `NotifBaseline` (from `lib/pr`) | bumped |
| `bitbucketNotifBaselineItem` | local | same | bumped |

Auth + hierarchy items keep their keys + types (genuinely provider-specific). Cache + UI + change-feed items bump to force a clean start with the new shape.

---

## 4. File layout (post-refactor)

```
lib/pr/                              ← NEW shared layer
├── types.ts                         NormalizedPr + all unions
├── format.ts                        formatters + status meta + deriveOverallState + getRepoColor
├── selectors.ts                     selectByTab, groupByDay, ..., resolveView (over NormalizedPr[])
├── mutations.ts                     hidePr, unhidePr, mergePrs, patchCiState, patchMergeState
├── notif.ts                         buildBaseline, diffPrState, appendChanges
├── adapter.ts                       ProviderAdapter interface + helper types
└── adapters.ts                      ADAPTERS registry indexed by ProviderId

lib/github/                          ← provider module
├── types.ts                         GitHubAuthState, RepoMeta, GitHubUiState removed
├── api.ts                           GraphQL transport + mapToNormalized
├── query.ts                         unchanged
├── sync.ts                          writes NormalizedPr[]
└── adapter.ts                       NEW — exports `githubAdapter`

lib/bitbucket/                       ← provider module
├── types.ts                         BbAuthState, BbWorkspaceMeta, BbRepoMeta only
├── api.ts                           REST transport + mapToNormalized
├── endpoints.ts                     unchanged
├── raw.ts                           unchanged
├── sync.ts                          writes NormalizedPr[]
└── adapter.ts                       NEW — exports `bitbucketAdapter`

# DELETED:
- lib/github/format.ts
- lib/github/selectors.ts
- lib/github/mutations.ts
- lib/github/notif.ts
- lib/bitbucket/format.ts
- lib/bitbucket/selectors.ts
- lib/bitbucket/mutations.ts
- lib/bitbucket/notif.ts

entrypoints/glimpse.content/components/pr/    ← NEW shared visual layer
├── PrApp.tsx
├── PrViewerHeader.tsx
├── PrHeader.tsx
├── PrListView.tsx
├── PrCardRow.tsx
├── PrAvatarChip.tsx
├── PrStatusBadges.tsx
├── PrOverallStateIcon.tsx
├── PrDayHeading.tsx
├── PrContextMenu.tsx
├── ChangesView.tsx
└── sidebar/
    ├── SidebarSystemRow.tsx
    ├── SidebarHierarchyRow.tsx
    ├── SidebarLeafRow.tsx
    └── SidebarDivider.tsx

entrypoints/glimpse.content/components/github/PrSidebar.tsx     ← rewritten with shared primitives
entrypoints/glimpse.content/components/bitbucket/BbSidebar.tsx  ← rewritten with shared primitives

# DELETED:
- entrypoints/glimpse.content/components/github/{PrApp,PrViewerHeader,PrHeader,PrListView,PrCardRow,AvatarChip,PrStatusBadges,PrOverallStateIcon,PrDayHeading,PrContextMenu,ChangesView}.tsx
- entrypoints/glimpse.content/components/bitbucket/{BbApp,BbViewerHeader,BbHeader,BbListView,BbCardRow,BbAvatarChip,BbStatusBadges,BbOverallStateIcon,BbDayHeading,BbContextMenu}.tsx
```

**Net change:** delete ~22 component files + 8 lib files; create ~14 component files + 6 lib files; net **-10 files**, ~**-1 200 LOC** of duplication.

---

## 5. Sync sequence

```
SW alarm tick   ┐
                ├→ runSync({ manual })
panel refresh   ┘       │
                        │
                        ├→ provider api.ts: fetch raw from API
                        │       (GraphQL for GH, REST for BB)
                        │
                        ├→ mapToNormalized(raw[]) → NormalizedPr[]
                        │
                        ├→ mergePrs(existing, incoming)              [shared]
                        │
                        ├→ adapter.storage.prs.setValue(merged)
                        │
                        ├→ diffPrState(baseline, merged) → events    [shared]
                        │
                        ├→ adapter.storage.changes.setValue(append)
                        │
                        ├→ adapter.storage.baseline.setValue(buildBaseline(merged))
                        │
                        └→ ui: lastSyncAt=now, error=undefined
```

Provider-specific concerns (GitHub UNKNOWN-mergeable rechecks, Bitbucket per-PR statuses fetch) stay inside each `sync.ts`. They mutate `NormalizedPr[]` via the shared `patchCiState` / `patchMergeState`.

---

## 6. Apps registry change

```ts
// lib/apps/types.ts
export interface AppDefinition {
  id: AppId
  name: string
  Icon?: LucideIcon
  iconUrl?: string
  Renderer?: ComponentType         // ← optional now
  providerId?: ProviderId          // ← NEW
  isExternal?: boolean
  enabled?: boolean
}
```

```ts
// lib/apps/registry.ts (post-refactor)
const ALL_APPS: AppDefinition[] = [
  { id: "todo",      name: "TODO",          Icon: CheckSquare, Renderer: PlaceholderRenderer, enabled: true },
  { id: "github",    name: "GitHub PRs",    Icon: Github,      providerId: "github",    enabled: true },
  { id: "bitbucket", name: "Bitbucket PRs", iconUrl: bbIcon,   providerId: "bitbucket", enabled: true },
  { id: "settings",  name: "Settings",      Icon: Settings,    Renderer: PlaceholderRenderer, isExternal: true, enabled: true }
]
```

GitLab/Azure later just register: `{ id: "gitlab", iconUrl, providerId: "gitlab", enabled: true }` + write `gitlabAdapter` + populate `ADAPTERS.gitlab`. Zero touches to `components/pr/`.

---

## 7. Risks + mitigations

| Risk | Mitigation |
|---|---|
| Adapter interface gets leaky when GitLab needs extra storage | Adapter declares `sidecar?` slot; shared `<PrApp>` ignores it. |
| Reviewer-state union grows | Open by design; `reviewerRingColor` falls back to `neutral`. |
| Status-pill priority diverges per provider | Adapter's `getStatusPills(pr)` owns ordering. |
| 3-tier hierarchy (GitLab subgroups) | Treat `parent` as slash-separated path; sidebar splits on `/`. |
| Two PR panels animate same tab thumb | Adapter's unique `segmentedLayoutId`. |

---

## 8. What this design does NOT do

- **No new auth abstraction.** Each provider's options-page section stays unique.
- **No new permissions.** Same as Phase 02.1.
- **No new user-facing features.** Pure refactor.
- **No GitLab / Azure code.** Only the surface shape that *would* support them.
- **No bundle bloat.** Expect content-script to *shrink* by ~30 kB after duplicate components are removed.
