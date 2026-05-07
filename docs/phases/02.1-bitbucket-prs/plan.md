# Plan — Bitbucket PRs (WXT)

> Step-by-step build order. Each step ends with a working, demoable build (`pnpm compile && pnpm build` both green) and a single commit. Don't move to step N+1 until the exit criteria of step N pass.
>
> Most components mirror Phase 02 (GitHub PRs) 1:1. When the GitHub equivalent already documents a pattern, this plan only calls out **what's different**. Read [`../02-github-prs/plan.md`](../02-github-prs/plan.md) alongside this file.

---

## Step 1 — Phase docs (this commit)

**Goal:** Phase 02.1 fully planned on paper before any code touches.

- [x] Create `docs/phases/02.1-bitbucket-prs/README.md`.
- [x] Write `docs/phases/02.1-bitbucket-prs/scope.md`.
- [x] Write `docs/phases/02.1-bitbucket-prs/plan.md` (this file).
- [x] Write `docs/phases/02.1-bitbucket-prs/ui-spec.md`.
- [x] Write `docs/phases/02.1-bitbucket-prs/verification.md`.
- [x] Update `docs/phases/README.md` index — add Phase 02.1 row, status `Active — fully planned`.
- [x] Update `docs/roadmap.md` Phase Order — insert Phase 02.1 after Phase 02; add a Decision Log entry covering: Bitbucket Cloud only, `Workspace + Username + Token` auth, REST 2.0 (no GraphQL), workspaces opt-in, no conflict detection in v0, no new permissions.
- [ ] **Commit:** `docs(phase-02.1): plan Bitbucket PRs feature scope and UI`. _(user commits manually)_

**Exit:** docs render cleanly; relative links resolve; the phases index reflects the new status.

---

## Step 2 — Data layer

**Goal:** state model + pure selectors + storage in place. No new UI.

- [ ] Create `lib/bitbucket/types.ts`:
  ```ts
  export type BbPrId = string;        // `${workspace}/${repo}#${id}`
  export type BbRepoKey = string;     // `${workspace}/${repo}`
  export type BbWorkspaceSlug = string;
  export type BbTab = 'mine' | 'review' | 'all';

  export type BbCiState =
    | 'success' | 'failure' | 'pending' | 'neutral' | 'none';
  export type BbReviewDecision =
    | 'approved' | 'changes_requested' | 'review_required'
    | 'commented' | 'none';
  /** Bitbucket has no `conflicting` from the cheap API surface. */
  export type BbMergeState = 'clean' | 'unknown';

  export type BbReviewerState =
    | 'approved' | 'changes_requested' | 'commented' | 'pending';

  export interface BbReviewer {
    accountId: string;
    nickname: string;
    avatarUrl?: string;
    state: BbReviewerState;
  }

  export type BbOverallState =
    | 'ready' | 'failed' | 'pending' | 'neutral';

  export interface BbPullRequest {
    id: BbPrId;
    number: number;          // numeric id from Bitbucket
    title: string;
    url: string;             // pr.links.html.href
    workspace: BbWorkspaceSlug;
    repo: BbRepoKey;         // `workspace/repo`
    author: string;          // nickname
    authorAvatarUrl?: string;
    isDraft: boolean;
    state: 'open' | 'merged' | 'declined' | 'superseded';
    headRef: string;
    baseRef: string;
    createdAt: number;
    updatedAt: number;
    commentsCount: number;
    reviewDecision: BbReviewDecision;
    reviewers: BbReviewer[];
    ciState: BbCiState;
    failingChecks: number;
    totalChecks: number;
    mergeState: BbMergeState;
    overallState: BbOverallState;
    fromTab: Array<'mine' | 'review'>;
  }

  export interface BbWorkspaceMeta {
    slug: BbWorkspaceSlug;
    name: string;
    enabled: boolean;        // explicit opt-in
    discoveredAt: number;
  }

  export interface BbRepoMeta {
    key: BbRepoKey;
    workspace: BbWorkspaceSlug;
    enabled: boolean;
    discoveredAt: number;
  }

  export type BbView = BbTab | BbRepoKey | 'hidden' | 'changes';

  export interface BbUiState {
    activeTab: BbTab;
    expanded: boolean;
    pinned: boolean;
    sidebarCollapsed: boolean;
    activeView: BbView;
    refreshIntervalMin: number;
    lastSyncAt?: number;
    lastSyncError?: string;
    rateLimitResetAt?: number;
    lastOpenedAt?: number;
  }

  export interface BbAuthState {
    workspace?: BbWorkspaceSlug;  // declared workspace from Options form
    username?: string;
    token?: string;               // App Password or Workspace Access Token
    accountId?: string;
    nickname?: string;
    displayName?: string;
    avatarUrl?: string;
  }

  // Change feed mirrors GitHub's
  export type BbChangeEventType =
    | 'new_review_request' | 'new_mine'
    | 'ci_failure' | 'ci_success'
    | 'approved' | 'changes_requested'
    | 'merged' | 'declined';

  export interface BbChangeEvent {
    id: string;
    prId: BbPrId;
    prNumber: number;
    prTitle: string;
    repo: BbRepoKey;
    prUrl: string;
    type: BbChangeEventType;
    detail?: string;
    createdAt: number;
  }

  export type BbNotifBaseline = Record<
    BbPrId,
    {
      ciState: BbCiState;
      reviewDecision: BbReviewDecision;
      fromTab: Array<'mine' | 'review'>;
      state: BbPullRequest['state'];
    }
  >;
  ```
- [ ] Create `lib/bitbucket/format.ts` mirroring `lib/github/format.ts`:
  - `formatRelative`, `formatAgoShort`, `formatDayHeading`, `initialsOf`, `branchLabel`
  - `ciStatusMeta`, `reviewStatusMeta`, `draftMeta`, `overallStateMeta`, `reviewerRingColor`
  - `deriveOverallState(pr)` — mapping per `scope.md` (no `blocked`).
  - `getRepoColor(key)` — deterministic color (reuse algorithm from `lib/github/format.ts`; could later be moved to a shared `lib/colors.ts`, deferred).
- [ ] Create `lib/bitbucket/selectors.ts`:
  - `selectByTab(prs, tab)` — same shape as GitHub's.
  - `groupByDay(prs)`, `selectHidden(prs, hidden)`, `selectByRepo(prs, repoKey)`, `groupByRepo(prs)`, `groupByWorkspace(prs)`, `discoverRepos(prs, enabledWorkspaces, existing)`, `discoverWorkspaces(workspaces, existing)`, `countByView`, `resolveView`.
  - `discoverRepos` takes the **enabled** workspace set so we don't grow the repo list with PRs from disabled workspaces.
- [ ] Create `lib/bitbucket/mutations.ts`:
  - `hidePr`, `unhidePr`, `toggleRepo`, `setRepoEnabled`, `toggleWorkspace`, `setWorkspaceEnabled`, `mergePrs`, `patchCiState`.
  - `patchCiState(prs, patches)` — analogue of GitHub's `patchMergeState`, used after secondary status fetches.
- [ ] Append to `lib/storage.ts`:
  - `bitbucketAuthItem` (`sync:gb-bb-auth`)
  - `bitbucketPrsItem` (`local:gb-bb-prs`)
  - `bitbucketWorkspacesItem` (`local:gb-bb-workspaces`)
  - `bitbucketReposItem` (`local:gb-bb-repos`)
  - `bitbucketHiddenItem` (`local:gb-bb-hidden`)
  - `bitbucketUiItem` (`local:gb-bb-ui`)
  - `bitbucketChangesItem` (`local:gb-bb-changes`)
  - `bitbucketNotifBaselineItem` (`local:gb-bb-baseline`)
- [ ] **Commit:** `feat(bitbucket): types + storage + selectors + mutations` _(user commits manually)_

**Exit:** `pnpm compile && pnpm build` both green.

---

## Step 3 — Background fetch pipeline (REST 2.0) + alarms

**Goal:** SW owns all Bitbucket API calls. Content/options scripts never touch `api.bitbucket.org`.

### 3.1 — REST endpoints

- [ ] Create `lib/bitbucket/endpoints.ts` — small module that returns built URLs + path helpers. Keeps URL construction in one place:
  ```ts
  export const BB_BASE = 'https://api.bitbucket.org/2.0';
  export const userUrl = () => `${BB_BASE}/user`;
  export const workspacesUrl = (page = 1) =>
    `${BB_BASE}/user/permissions/workspaces?page=${page}&pagelen=50`;
  export const reposUrl = (ws: string, page = 1) =>
    `${BB_BASE}/repositories/${ws}?role=member&page=${page}&pagelen=100`;
  export const minePrsUrl = (accountId: string, page = 1) =>
    `${BB_BASE}/pullrequests/${accountId}?state=OPEN&page=${page}&pagelen=50`;
  export const reviewPrsUrl = (ws: string, repo: string, accountId: string, page = 1) =>
    `${BB_BASE}/repositories/${ws}/${repo}/pullrequests` +
    `?q=state%3D%22OPEN%22+AND+reviewers.account_id%3D%22${accountId}%22` +
    `&page=${page}&pagelen=50`;
  export const statusesUrl = (ws: string, repo: string, prId: number) =>
    `${BB_BASE}/repositories/${ws}/${repo}/pullrequests/${prId}/statuses?pagelen=50`;
  ```
- [ ] Create raw response types in `lib/bitbucket/raw.ts` (Bitbucket REST 2.0 envelope is `{ values: T[], next?, page, pagelen, size }`).

### 3.2 — `lib/bitbucket/api.ts`

- [ ] `bbRequest<T>(creds, url)` — core transport. Sets `Authorization: Basic base64(username:token)` and `Accept: application/json`. Inspects:
  - `401` → `BitbucketApiError('Bad credentials — check workspace, username, token')`
  - `403` → `BitbucketApiError('Forbidden — token missing required scope')`
  - `429` → `BitbucketRateLimitError(resetAtFromHeader)`
  - 5xx → `BitbucketApiError('Bitbucket {status}')`
  - paginates by following `next` URL up to a hard cap (10 pages = 500 items).
- [ ] `getViewer(creds)` → `{ accountId, nickname, displayName, avatarUrl }` via `GET /2.0/user`.
- [ ] `listWorkspaces(creds)` → `Array<{ slug, name }>` via `GET /2.0/user/permissions/workspaces` (paginated).
- [ ] `listReposInWorkspace(creds, workspaceSlug)` → `Array<BbRepoKey>` via `GET /2.0/repositories/{ws}` (paginated).
- [ ] `fetchMinePrs(creds, accountId)` → cross-workspace authored PRs (paginated). Maps via `mapBbPr(raw, ['mine'])`.
- [ ] `fetchReviewPrsForRepo(creds, ws, repo, accountId)` → review-requested PRs in one repo. Maps via `mapBbPr(raw, ['review'])`.
- [ ] `fetchPrStatuses(creds, ws, repo, prId)` → CI rollup for one PR. Returns `{ ciState, failingChecks, totalChecks }`.
- [ ] `mapBbPr(raw, fromTab)` — map raw PR to `BbPullRequest`. Drives `reviewDecision` from `participants[]` per scope rules. `mergeState` always starts as `'unknown'` (we don't fetch `/merge?dry_run`); promoted to `'clean'` only if a future enhancement adds it.
- [ ] `missingScopes(viewerProbeResult)` — best-effort: after `getViewer` succeeds, attempt `listWorkspaces`; if 403 → flag missing `account` / `repository` scope.

### 3.3 — `lib/bitbucket/sync.ts`

- [ ] `runSync({ manual })`:
  1. Read `bitbucketAuthItem` — bail if no creds.
  2. Read `bitbucketWorkspacesItem` — collect `enabled === true` slugs. If empty, set `lastSyncError` to a friendly `Enable a workspace in Options` message and bail (cache untouched).
  3. Read `bitbucketReposItem` — collect `enabled === true` repos within enabled workspaces.
  4. `getViewer(creds)` → refresh `accountId` / `nickname` / `avatarUrl` in `bitbucketAuthItem`.
  5. `fetchMinePrs(creds, accountId)` → filter to enabled workspaces client-side.
  6. For each enabled (workspace, repo) pair, `fetchReviewPrsForRepo(...)` — concurrency cap 5.
  7. Dedupe Mine + Review by `BbPrId`; build `fromTab` array.
  8. **CI rollup:** for each PR whose `updatedAt` changed since baseline, queue `fetchPrStatuses(...)` — concurrency cap 5. Patch `ciState` / `failingChecks` / `totalChecks` via `patchCiState` after each completes (best-effort; failures default to `none`).
  9. `mergePrs(existing, incoming)` → persist.
  10. Update `bitbucketReposItem` with `discoverRepos` (within enabled workspaces only).
  11. Diff vs `bitbucketNotifBaselineItem` → append change events to `bitbucketChangesItem` (skip on first-ever sync).
  12. Update `bitbucketNotifBaselineItem`.
  13. Update `bitbucketUiItem.lastSyncAt`, clear `lastSyncError` / `rateLimitResetAt`.
- [ ] On error: persist `lastSyncError` / `rateLimitResetAt`. PR cache untouched.
- [ ] `entrypoints/background.ts` extended:
  - `GlimpseMessage` union gets: `bb:testCreds` (one-off `getViewer`), `bb:listWorkspaces` (returns discovered list for Options), `bb:listRepos` (workspace slug → repos), `bb:sync` (manual flag), `bb:disconnect`.
  - New alarm name `bb-sync` set up in a `setupBbAlarm()` mirror of `setupGhAlarm()`.
  - Watcher on `bitbucketUiItem.refreshIntervalMin` re-creates the alarm.
  - `openOptionsPage` already handles arbitrary `hash` — Bitbucket section uses `#bitbucket`.
- [ ] **No** new permission entries. Confirm `wxt.config.ts` permissions unchanged.
- [ ] **Commit:** `feat(bitbucket): SW fetch pipeline + alarms` _(user commits manually)_

**Exit:** Build green; manual smoke from Options shows `Test connection` + `Sync now` work; PR cache populates.

---

## Step 4 — Options page: Bitbucket section

**Goal:** user can connect, test, disconnect, opt-in to workspaces, toggle repos, configure refresh interval.

- [ ] Create `entrypoints/options/sections/BitbucketSection.tsx`:
  - `id="bitbucket"` anchor for deep-link.
  - Two modes: `connecting` / `connected` (mirrors `GitHubSection.tsx`).
  - **`connecting` mode** has three labeled inputs in this order: `Workspace`, `Username`, `Token`. Workspace + Username are pre-populated from storage when user clicked `Change credentials`; Token always blank.
  - `Test connection` button — disabled until all three fields non-empty. Spinner while testing. Status row beneath: `✓ Connected as @nickname` / `✗ Bad credentials` / `⚠ Token missing scope: pullrequest`.
  - `Save & sync` / `Cancel` row.
  - **`connected` mode**: viewer avatar + `@nickname` + `Workspace: acme-corp` chip + `Username: @vipul` chip + right-aligned `Change credentials` + `Disconnect` (with confirm dialog). Token field unmounted — never re-readable after save.
  - **Workspace list** beneath connection block (only visible in `connected` mode):
    - Auto-discovered list with checkboxes. Each row: workspace name + slug + `(N repos · M open PRs)` summary.
    - Empty state: `No workspaces discovered. Try Sync now.`
    - Toggling a workspace ON triggers `bb:listRepos` and persists discovered repos as `enabled: true`. Toggling OFF clears that workspace's repos from the cache + leaves their `enabled: false` for next time.
  - **Repo list** (collapsible per workspace; only enabled workspaces render):
    - Same shape as GitHub's repo list — checkbox + repo key + open-PR count.
    - Disabled (unticked) repos are skipped at fetch time.
  - **Refresh interval select** (1 / 5 / 15 / 30 / 60 min, default 5).
  - **Status row**: last-sync ISO, last-error, `Sync now` button (debounced 1 s).
  - **Heavy-budget warning**: when projected hourly request count > 800, render a soft amber warning row beneath the interval select (`Heavy: ~Nrk req/hr · consider longer interval`).
- [ ] Mounted in `entrypoints/options/main.tsx` after `GitHubSection` with an `<hr/>` separator.
- [ ] On mount: if `location.hash === '#bitbucket'`, `scrollIntoView`.
- [ ] `openOptionsPage` SW handler already supports `hash?` — content script sends `{ type: 'openOptionsPage', hash: 'bitbucket' }`.
- [ ] Token never logged, echoed, or in any URL. Verify in DevTools.
- [ ] **Commit:** `feat(bitbucket): options page section` _(user commits manually)_

**Exit:** Credential round-trip works. Workspace + repo toggles persist. Build green.

---

## Step 5 — Compact panel: BbApp + viewer header + tabs + grouped list + card row

**Goal:** the minimum panel UX for Bitbucket. Mirrors Phase 02 Step 5.

- [ ] Add `assets/bb.png` import path. Extend `lib/apps/types.ts`:
  ```ts
  export interface AppDefinition {
    id: AppId;
    name: string;
    Icon?: LucideIcon;
    iconUrl?: string;        // NEW — preferred over Icon when set
    Renderer: ComponentType;
    isExternal?: boolean;
    enabled?: boolean;
  }
  ```
- [ ] Update `entrypoints/glimpse.content/components/AppIconButton.tsx` to render `<img src={iconUrl}>` (sized 18 × 18, `pointerEvents:none` to keep clicks on the button) when `iconUrl` is set; otherwise render `<Icon size={18} strokeWidth={2.25} />`.
- [ ] `lib/apps/registry.ts`: add `bitbucket` entry between `github` and `settings`:
  ```ts
  import bbIcon from '~/assets/bb.png';
  ...
  { id: 'bitbucket', name: 'Bitbucket PRs', iconUrl: bbIcon, Renderer: BbApp, enabled: true },
  ```
- [ ] Create `entrypoints/glimpse.content/components/bitbucket/`:
  - `BbApp.tsx` — orchestrator. Reads 8 storage items; "Connect Bitbucket" CTA when no creds; "Enable a workspace in Options" CTA when creds exist but no workspace enabled; composes viewer header + panel header + list.
  - `BbViewerHeader.tsx` — 24 px avatar + `@nickname` + `Change credentials` link (opens Options via SW message with `hash: 'bitbucket'`).
  - `BbHeader.tsx`:
    - `PR's` title + refresh (↻, spins, respects reduced motion) + `Nm ago` indicator.
    - `Mine | Review | All` segmented pill control with `framer-motion layoutId="bb-tab-thumb"` animated thumb.
    - Error chip + rate-limit chip (`Rate-limited · resets in Nm`) with countdown.
    - Tabs visually muted (opacity 0.45) when `activeView === 'hidden'`.
    - Maximize / minimize button.
  - `BbListView.tsx` — empty / loading (Loader2) / error states + date-grouped `BbDayHeading` + `BbCardRow` list.
  - `BbDayHeading.tsx` — sticky heading (identical to GitHub's).
  - `BbCardRow.tsx`:
    - 3 px colored left border (deterministic repo color).
    - Top line: `#ID` + title.
    - Meta line: `workspace/repo · head → base`.
    - Bottom line: author + reviewer chain + status pills (max 2 + overflow) + overall-state icon + comment count.
    - Quick-hide button (EyeOff / Eye, JS `hovered` state).
  - `BbStatusBadges.tsx` — priority order: `Changes requested` > `Approved` > `Review required` > `Draft`. (No `Conflicts`.)
  - `BbOverallStateIcon.tsx` — 20 px filled circle. Mapping per scope.
  - `BbAvatarChip.tsx` — same primitive as GitHub's; could later be promoted to `lib/components/AvatarChip.tsx`. For Phase 02.1 we keep a thin wrapper to avoid touching Phase 02 files.
- [ ] Refresh button → `bb:sync manual:true`; spinner stops when `lastSyncAt` advances.
- [ ] `App.tsx` already reads `hiddenAppsItem` and computes `visibleApps` — adding `bitbucket` to the registry is sufficient.
- [ ] **Commit:** `feat(bitbucket): compact panel` _(user commits manually)_

**Exit:** Real account — tabs, badges, click-to-open. Build green.

---

## Step 6 — Context menu + Hide + Sidebar (expanded)

**Goal:** hide/unhide flow, expanded sidebar with views and per-workspace + per-repo filtering.

- [ ] `BbContextMenu.tsx` — wraps existing `ContextMenu`; items: `Open in Bitbucket`, `Copy PR link`, `Copy branch name`, `Hide PR` / `Unhide PR`. Clipboard falls back to `execCommand` for http pages.
- [ ] `BbSidebar.tsx` — 200 px sidebar. System rows (`Mine` / `Review requests` / `All` / `Hidden`) on top, then per-workspace groups beneath a divider. Each workspace renders as a heading with its repos as child rows underneath (3 px color swatch + PR count). Workspaces collapsible (per-row `expanded` state in `BbUiState.sidebarExpandedWorkspaces?: BbWorkspaceSlug[]`).
- [ ] View rules wired in `BbApp`:
  - `mine` / `review` / `all` → `selectByTab`.
  - `hidden` → `selectHidden`.
  - `BbRepoKey` → `selectByRepo` intersected with `activeTab`.
- [ ] `activeView` persisted to `bitbucketUiItem`.
- [ ] Quick-hide button on each card: `EyeOff` (hide) or `Eye` (unhide, blue tint) based on `isHidden` prop; toggle handler in `BbApp` checks `hiddenIds.includes(pr.id)`.
- [ ] **Commit:** `feat(bitbucket): context menu + hide + sidebar` _(user commits manually)_

**Exit:** Hide → disappears → visible in Hidden view → unhide returns it. Workspace + repo filtering works. Build green.

---

## Step 7 — Polish + verification

- [x] Empty / loading / error states polished. `prefers-reduced-motion` honored on tab switch, spinner, card hover transition.
- [x] **Heavy-budget warning** in Options when projected req/hr > 800.
- [x] Rate-limit chip: amber pill `Rate-limited · resets in Nm`, auto-clears via 60 s tick. Refresh button disabled + dimmed while rate-limited.
- [x] Token scope check: missing-scope warning surfaced in Options after `Test connection` succeeds but a probing `listWorkspaces` returns 403.
- [x] A11y: `role="tablist"` + `role="tab"` + `aria-selected`; `role="list"` + `role="listitem"`; rows as `<a href>`; day headings `role="heading" aria-level={3}`; avatar `title` attrs carry reviewer state.
- [ ] Manual verification: run [`verification.md`](verification.md) full Acceptance Criteria on a real Bitbucket account. _(user)_
- [x] `docs/roadmap.md` Decision Log updated: Bitbucket Cloud only, REST 2.0 (no GraphQL), workspaces opt-in, no `Conflicts` pill in v0, no new permissions.
- [x] `CLAUDE.md` augmented: Bitbucket's three-identifier trap (`account_id` vs `nickname` vs `username` vs `uuid`) + Basic-auth scheme works for both App Password and Workspace Access Token + `iconUrl` precedence note.
- [ ] **Commit:** `chore(bitbucket): polish + a11y + docs` _(user commits manually — code complete, build green)_

**Exit:** `pnpm compile && pnpm build` green. Manual smoke confirmed by user.

---

## Tag the phase done

- [ ] Tag the commit `bitbucket/done`.
- [ ] Update `docs/phases/README.md` and `docs/roadmap.md` to mark phase Shipped (date).
