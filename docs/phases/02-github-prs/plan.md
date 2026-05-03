# Plan — GitHub PRs (WXT)

> Step-by-step build order. Each step ends with a working, demoable build (`pnpm compile && pnpm build` both green) and a single commit. Don't move to step N+1 until the exit criteria of step N pass.

---

## Step 1 — Phase docs (this commit)

**Goal:** Phase 02 fully planned on paper before any code touches.

- [x] Replace `docs/phases/02-github-prs/README.md` (drop the "Stub" disclaimer).
- [x] Write `docs/phases/02-github-prs/scope.md`.
- [x] Write `docs/phases/02-github-prs/plan.md` (this file).
- [x] Write `docs/phases/02-github-prs/ui-spec.md`.
- [x] Write `docs/phases/02-github-prs/verification.md`.
- [x] Update `docs/phases/README.md` index — flip the GitHub row from `Stub` → `Active — fully planned`.
- [x] Update `docs/roadmap.md` Phase Order table — same flip.
- [x] **Commit:** `docs(phase-02): plan GitHub PRs feature scope and UI`.

**Exit:** docs render cleanly; relative links resolve; the phases index reflects the new status.

---

## Step 2 — Data layer

**Goal:** state model + pure selectors + storage in place. No new UI.

- [ ] Create `lib/github/types.ts`:
  ```ts
  export type PrId = string;        // `${owner}/${repo}#${number}`
  export type RepoKey = string;     // `${owner}/${repo}`
  export type PrTab = 'mine' | 'review' | 'all';

  export type CiState =
    | 'success' | 'failure' | 'pending' | 'neutral' | 'none';
  export type ReviewDecision =
    | 'approved' | 'changes_requested' | 'review_required'
    | 'commented' | 'none';
  export type MergeState =
    | 'clean' | 'conflicting' | 'behind' | 'blocked' | 'unknown';

  export type ReviewerState =
    | 'approved' | 'changes_requested' | 'commented' | 'dismissed' | 'pending';

  export interface Reviewer {
    login: string;
    avatarUrl?: string;
    state: ReviewerState;
  }

  export type OverallState =
    | 'ready' | 'failed' | 'blocked' | 'pending' | 'neutral';

  export interface PullRequest {
    id: PrId;
    number: number;
    title: string;
    url: string;
    repo: RepoKey;
    author: string;
    authorAvatarUrl?: string;
    isDraft: boolean;
    state: 'open' | 'closed' | 'merged';
    headRef: string;
    baseRef: string;
    createdAt: number;
    updatedAt: number;
    commentsCount: number;
    reviewDecision: ReviewDecision;
    reviewers: Reviewer[];         // latest review per reviewer (incl. requested)
    ciState: CiState;
    failingChecks: number;
    totalChecks: number;
    mergeState: MergeState;
    overallState: OverallState;    // derived; see selectors.ts
    fromTab: ('mine' | 'review')[];// which raw queries surfaced this PR; 'all' is derived
  }

  export interface RepoMeta {
    key: RepoKey;
    enabled: boolean;
    discoveredAt: number;
  }

  export type GitHubView = PrTab | RepoKey | 'hidden';

  export interface GitHubUiState {
    activeTab: PrTab;              // 'mine' | 'review' | 'all'
    expanded: boolean;
    pinned: boolean;
    sidebarCollapsed: boolean;
    activeView: GitHubView;
    refreshIntervalMin: number;    // 1 | 5 | 15 | 30 | 60
    lastSyncAt?: number;
    lastSyncError?: string;
    rateLimitResetAt?: number;     // epoch when the X-RateLimit-Remaining=0 chip should clear
  }

  export interface GitHubAuthState {
    pat?: string;                  // sync-storage; never logged
    login?: string;                // resolved from /user
    avatarUrl?: string;            // viewer's avatar (PrViewerHeader)
    scopes?: string[];
  }
  ```
- [ ] Create `lib/github/format.ts`:
  - `formatRelative(ts, now)` → `'just now'` / `'2m ago'` / `'5h ago'` / `'3d ago'` / `'Apr 30'`.
  - `formatDayHeading(ts)` → `'Mon Apr 20 2026'` (used by date-grouped list).
  - `formatAgoShort(ts, now)` → `'1m'` / `'2h'` / `'3d'` for the panel header indicator.
  - `initialsOf(login)` → first two upper-cased characters for avatar fallback.
  - `branchLabel(head, base)` → `'feat/x → main'` (only used in tooltip; row no longer renders inline branch).
  - `statusMeta(...)` → `{ color, icon, label }` for status pills + overall-state icon, using design.md tokens.
  - `deriveOverallState(pr)` → `OverallState` per the rules in `scope.md` (ready / failed / blocked / pending / neutral). Inputs are already-normalised fields on `PullRequest` — the GraphQL→`PullRequest` mapping in `lib/github/api.ts` is responsible for normalising `statusCheckRollup.state` (`SUCCESS`/`FAILURE`/`PENDING`/…) → `CiState`, GraphQL `mergeable` (`MERGEABLE`/`CONFLICTING`/`UNKNOWN`) → `MergeState`, and lower-casing GraphQL review-state enums.
- [ ] Create `lib/github/selectors.ts`:
  - `selectByTab(prs, tab, repos, hidden)`:
    - `tab === 'mine'`   → `fromTab.includes('mine')`
    - `tab === 'review'` → `fromTab.includes('review')`
    - `tab === 'all'`    → either query surfaced it (deduped on `id`)
    - All variants: filter by repo enabled + not hidden, sort by `updatedAt` desc.
  - `groupByDay(prs)` → `Array<{ dayKey: string, label: string, items: PullRequest[] }>` for date-grouped rendering. Reuses `lib/todos/dates.ts` `dayKey()` for the key.
  - `selectHidden(prs, hidden)` — return PRs whose id is in `hidden` (sort + group by day).
  - `selectByRepo(prs, repoKey, hidden)` — filter `repo === repoKey` + not hidden, then `groupByDay`.
  - `groupByRepo(prs)` — `Record<RepoKey, PullRequest[]>` for sidebar repo counts.
  - `discoverRepos(prs, existing)` — diff new RepoKeys, append with `enabled: true, discoveredAt: now`.
  - `countByView(prs, repos, hidden)` — `{ mine, review, all, hidden, byRepo: Record<RepoKey, number> }`.
- [ ] Create `lib/github/mutations.ts` — pure, returns new arrays/objects:
  - `hidePr(hidden, id)`, `unhidePr(hidden, id)`
  - `toggleRepo(repos, key)`, `setRepoEnabled(repos, key, enabled)`
  - `mergePrs(existing, incoming)` — replace by id; preserve order if no change; drop PRs not in `incoming` (closed/merged elsewhere).
- [ ] Append to `lib/storage.ts`:
  ```ts
  export const githubAuthItem = storage.defineItem<GitHubAuthState>(
    'sync:gb-github-auth',
    { fallback: {} }
  );
  export const githubPrsItem = storage.defineItem<PullRequest[]>(
    'local:gb-github-prs',
    { fallback: [] }
  );
  export const githubReposItem = storage.defineItem<RepoMeta[]>(
    'local:gb-github-repos',
    { fallback: [] }
  );
  export const githubHiddenItem = storage.defineItem<PrId[]>(
    'local:gb-github-hidden',
    { fallback: [] }
  );
  export const githubUiItem = storage.defineItem<GitHubUiState>(
    'local:gb-github-ui',
    {
      fallback: {
        activeTab: 'review',         // 'mine' | 'review' | 'all'; default = review
        expanded: false,
        pinned: false,
        sidebarCollapsed: false,
        activeView: 'review',
        refreshIntervalMin: 5
      }
    }
  );
  ```
  Note: PAT in `sync:` so it survives profile reinstalls; PR cache is `local:`.
- [ ] **Commit:** `feat(github): data layer and storage`.

**Exit:** `pnpm compile && pnpm build` both green. No runtime change visible to the user yet.

---

## Step 3 — Background fetch pipeline (GraphQL) + alarms

**Goal:** SW owns all GitHub API calls. Content/options scripts never touch `api.github.com`. **Use the GitHub GraphQL v4 API** — one request per sync covers viewer + both queues + reviewers + CI rollup + mergeable state.

### 3.1 — Query

- [ ] Create `lib/github/query.ts` — exports the single static query string + the typed response shape. The query:
  ```graphql
  query GlimpsePrSnapshot($mineQ: String!, $reviewQ: String!) {
    viewer { login avatarUrl }
    mine:   search(first: 50, type: ISSUE, query: $mineQ)   { nodes { ...Pr } }
    review: search(first: 50, type: ISSUE, query: $reviewQ) { nodes { ...Pr } }
    rateLimit { remaining cost resetAt }
  }
  fragment Pr on PullRequest {
    id databaseId number title url isDraft updatedAt createdAt
    author { login ... on User { avatarUrl } }
    baseRefName headRefName
    repository { nameWithOwner }
    comments { totalCount }
    mergeable                            # CONFLICTING / MERGEABLE / UNKNOWN
    reviewDecision                       # APPROVED / CHANGES_REQUESTED / REVIEW_REQUIRED / null
    reviewRequests(first: 10) {
      nodes { requestedReviewer { ... on User { login avatarUrl } } }
    }
    latestReviews(first: 10) {
      nodes {
        author { login ... on User { avatarUrl } }
        state                            # APPROVED / CHANGES_REQUESTED / COMMENTED / DISMISSED
        submittedAt
      }
    }
    commits(last: 1) {
      nodes { commit { statusCheckRollup {
        state                            # SUCCESS / FAILURE / PENDING / EXPECTED / ERROR
        contexts(first: 50) {
          totalCount
          nodes {
            __typename
            ... on CheckRun       { conclusion status name }
            ... on StatusContext  { state context }
          }
        }
      } } }
    }
  }
  ```
- [ ] Variables passed in: `mineQ = "is:open is:pr author:@me archived:false"`, `reviewQ = "is:open is:pr review-requested:@me archived:false"`.

### 3.2 — `lib/github/api.ts`

- [ ] One transport function:
  - `gqlRequest<T>(pat, query, variables) → Promise<T>` — POSTs to `https://api.github.com/graphql`:
    - Headers: `Authorization: bearer ${pat}` (note: GraphQL prefers `bearer`, not `token`), `Content-Type: application/json`, `X-GitHub-Next-Global-ID: 1`.
    - Body: `JSON.stringify({ query, variables })`.
    - Always returns HTTP 200 on success or 401/403; the body's `errors[]` carries auth/scope/rate-limit details.
    - Inspects `data.rateLimit.remaining`. If `0`: throw typed `RateLimitError(resetAt)`.
    - Inspects `errors[]`: if any error has `type === 'RATE_LIMITED'` → `RateLimitError`. Other error types → typed `GraphQLError(messages[])`.
  - `getViewer(pat) → { login, avatarUrl, scopes }` — small `query { viewer { login avatarUrl } }` for the Options-page **Test connection** button. Scopes come from the response's `X-OAuth-Scopes` header (still present on GraphQL responses for classic PATs); fall back to `[]` for fine-grained PATs.
  - `fetchPrSnapshot(pat) → { viewer, prs: PullRequest[] }` — runs the snapshot query above and **maps GraphQL nodes into our `PullRequest` shape** (deduping by `id` across `mine` and `review`, tagging `fromTab`, deriving `overallState` and `reviewers[]` from `latestReviews + reviewRequests`).
- [ ] `missingScopes(scopes, required)` helper: classic PATs need `repo` (or `public_repo`). Fine-grained PATs report no scopes — surface a softer "Fine-grained token detected; ensure read access to *Pull requests*, *Contents*, *Metadata*" hint instead of a hard miss.

### 3.3 — `lib/github/sync.ts`

- [ ] `runSync({ manual })`:
  1. Read `githubAuthItem`. Bail if no PAT.
  2. **One** call: `const { viewer, prs } = await fetchPrSnapshot(pat)`.
  3. `mergePrs(existing, prs)` → persist `githubPrsItem`.
  4. `discoverRepos(prs, existingRepos)` → persist `githubReposItem`.
  5. Persist updated `githubAuthItem` (refresh `login` / `avatarUrl` if the user updated their profile).
  6. Persist `githubUiItem` with new `lastSyncAt`, clear `lastSyncError`, clear `rateLimitResetAt`.
  7. **`mergeable: UNKNOWN` re-fetch:** GitHub computes `mergeable` lazily after pushes; first read returns `UNKNOWN`. Collect all PR ids whose `mergeable === 'UNKNOWN'`, schedule a one-shot `setTimeout(re-fetch those by id, 8000)` with `query Reread($ids:[ID!]!){ nodes(ids:$ids){ ... on PullRequest { id mergeable } } }`. Patch only the `mergeState` field; don't trigger a full sync.
  8. On any thrown error: persist `lastSyncError` + (if `RateLimitError`) `rateLimitResetAt`. Don't clobber the PR cache.
  9. The `'all'` tab is **not** a separate query — derived in `selectByTab` from the same cache.
- [ ] Extend `entrypoints/background.ts` `GlimpseMessage` union:
  ```ts
  type GlimpseMessage =
    | { type: 'openOptionsPage' }
    | { type: 'gh:testPat'; pat: string }
    | { type: 'gh:sync'; manual?: boolean }
    | { type: 'gh:disconnect' };
  ```
  - `gh:testPat` → call `getViewer`, return `{ ok, login, avatarUrl, scopes, missingScopes }`. Does **not** persist anything — the Options page commits via `Save & sync` after a successful test.
  - `gh:sync` → `void runSync({ manual })`, respond `{ ok: true }` immediately (background continues; UI watches storage for results).
  - `gh:disconnect` → clear `githubAuthItem`, `githubPrsItem`, `githubReposItem`, `githubHiddenItem`. Leave `githubUiItem` (preserve user view preference).
- [ ] Alarm setup in the existing `defineBackground` body:
  ```ts
  // re-create the alarm on every SW startup; period reflects current UI state
  void githubUiItem.getValue().then((ui) =>
    chrome.alarms.create('gh-sync', { periodInMinutes: ui.refreshIntervalMin })
  );
  chrome.alarms.onAlarm.addListener((a) => {
    if (a.name === 'gh-sync') void runSync({ manual: false });
  });
  // when user changes interval in Options, re-create
  githubUiItem.watch((next, prev) => {
    if (next?.refreshIntervalMin !== prev?.refreshIntervalMin) {
      chrome.alarms.create('gh-sync', { periodInMinutes: next.refreshIntervalMin });
    }
  });
  ```
- [ ] `wxt.config.ts`: add `'alarms'` to `permissions`. `<all_urls>` already covers `https://api.github.com/graphql` for the SW.
- [ ] **Commit:** `feat(github): GraphQL sync pipeline with alarms`.

**Exit:**
- In SW console: `await chrome.runtime.sendMessage({type:'gh:testPat', pat:'…'})` returns viewer login + avatar.
- `await chrome.runtime.sendMessage({type:'gh:sync', manual:true})` populates `githubPrsItem` from a single GraphQL POST (verify in DevTools → Network → only `api.github.com/graphql` requests; in Application → Storage → Extension Storage → Local).
- `data.rateLimit.cost` for the snapshot query stays under 5 points (one snapshot per minute = 300 points/hr, well inside the 5000-point quota).
- Build green.

---

## Step 4 — Options page: GitHub section

**Goal:** user can connect, test, disconnect, toggle repos, and configure refresh interval.

- [ ] Create `entrypoints/options/sections/GitHubSection.tsx`:
  - Section root has `id="github"` so the panel's "Change PAT" / "Connect GitHub" links can deep-link via `#github`.
  - **Two display modes** controlled by local component state `mode: 'connected' | 'connecting'`:
    - `connecting` mode (no PAT yet, or user clicked `Change PAT`):
      - PAT password input (`type="password"`) + `Test connection` button. Disabled until field is non-empty.
      - Shows `✓ Connected as @{login}` (with avatar) or `✗ {error}`. If `missingScopes.length > 0`, render an inline warning `Missing scope: repo`.
      - `Save & sync` button — persists PAT to `githubAuthItem` (also stores `login`, `avatarUrl`, `scopes` from the test result), calls `gh:sync`, switches to `connected` mode.
      - `Cancel` button — clears the input, returns to `connected` mode without persisting.
    - `connected` mode (PAT exists):
      - Viewer row: 28 px avatar + `@{login}` + scopes chips.
      - Right-aligned `Change PAT` button (toggles to `connecting` mode) and `Disconnect` button (red secondary; confirm dialog → `gh:disconnect`).
      - PAT input is **not rendered** in this mode (defense-in-depth: no chance of accidental echo).
  - **Refresh interval** select: `1 / 5 / 15 / 30 / 60` min. Updates `githubUiItem.refreshIntervalMin`.
  - **Repos:** list `RepoMeta[]` sorted by `key`; checkbox per repo. Empty state: `No repos discovered yet — sync to populate.`
  - **Status:** last-sync ISO, last-error if any, "Sync now" button (debounced 1 s).
- [ ] Mount in `entrypoints/options/main.tsx` as a sibling section to Appearance; `<hr/>` separators per existing convention. On mount, if `location.hash === '#github'`, scroll the section into view.
- [ ] Extend `entrypoints/background.ts` `openOptionsPage` handler to accept an optional `hash` (`{type:'openOptionsPage', hash:'github'}`); pass it through to the URL when calling `chrome.runtime.openOptionsPage`. Keep the existing zero-arg form working.
- [ ] Token entry follows project-wide rule: never log PAT, never put in URL or query string, never echo back. After save, the input is unmounted (not just masked) so it cannot be re-read.
- [ ] **Commit:** `feat(github): options page connection UI`.

**Exit:** PAT round-trip works on a real account. Toggling a repo flips persisted `enabled`. Build green.

---

## Step 5 — Compact panel: PrApp + viewer header + tabs + grouped list + card row

**Goal:** the minimum panel UX matching the screenshot. Compact mode (360 px); viewer header on top; `Mine | Review | All` segmented control; date-grouped card list; click a card to open the PR.

- [ ] Wire registry: `lib/apps/registry.ts` — flip `github` to `enabled: true`, set `Renderer: PrApp`.
- [ ] Create `entrypoints/glimpse.content/components/github/PrApp.tsx`:
  - Mirrors `TodoApp` shape. Reads `githubAuthItem` / `githubPrsItem` / `githubReposItem` / `githubHiddenItem` / `githubUiItem` via `useStorageItem`.
  - If no PAT: render an empty-state CTA "Connect GitHub" → opens Options page via `chrome.runtime.sendMessage({type:'openOptionsPage', hash:'github'})`.
  - Otherwise compose: `PrViewerHeader` (top strip) + `PrHeader` (title + refresh + segmented control) + `PrListView` (date-grouped cards) for `selectByTab(prs, ui.activeTab, repos, hidden)`.
- [ ] Create `PrViewerHeader.tsx`:
  - 28 px `AvatarChip` from `auth.avatarUrl` + `@{login}` (13 px 600).
  - Right side: `Change PAT` link (Lucide `KeyRound` 12 px + 11 px text); on click → `chrome.runtime.sendMessage({type:'openOptionsPage', hash:'github'})`.
  - Bottom 1 px `gb-divider-soft`.
- [ ] Create `PrHeader.tsx`:
  - Left block: `PR's` title (16 px 700) + refresh button (Lucide `RefreshCw` 14 px; spins while syncing) + `Nm ago` indicator using `formatAgoShort(lastSyncAt, now)`.
  - Right block: segmented control (`Mine` · `Review` · `All`). Each pill carries a count derived from `countByView`.
    - Active pill background slides via `framer-motion` `layoutId="pr-tab-thumb"` (180 ms emphasized ease-out; reduced-motion → instant).
    - `aria-selected` + visible background carry the active state (no color-only signal).
  - Maximize / minimize button on the far right (hidden when `vw < 720`).
  - Error chip when `lastSyncError`. Rate-limit chip when `rateLimitResetAt > now`.
- [ ] Create `PrListView.tsx`:
  - Empty / loading / error states per `ui-spec.md` §5.
  - Otherwise: render `groupByDay(items)` as: a sticky `PrDayHeading` per group followed by a stack of `PrCardRow`s for the group's items.
  - `role="list"`; each card root carries `role="listitem"`.
- [ ] Create `PrDayHeading.tsx`:
  - Sticky `top-0`, `gb-panel-bg/95 backdrop-blur`, label from `formatDayHeading(ts)`.
  - `role="heading" aria-level="3"`.
- [ ] Create `PrCardRow.tsx`:
  - `<a href={pr.url} target="_blank" rel="noopener" className="group …">` per `ui-spec.md` §3.3.
  - Top line: `#NUMBER` prefix + title (truncate). Hover-revealed kebab top-right.
  - Bottom line: author `AvatarChip` → `ChevronRight` → reviewer `AvatarChip` cluster → spacer → status pills (max 2 + overflow) → 24 px overall-state icon → comment count + `MessageSquare` icon.
  - `e.stopPropagation()` on the kebab so the wrapping `<a>` doesn't navigate.
- [ ] Create `AvatarChip.tsx`:
  - Props: `{ login, avatarUrl?, state?: ReviewerState | 'author', size?: 16|24|28 }`.
  - `<img>` first; on `onError` swap to initials `<span>`.
  - Outer ring (`box-shadow: 0 0 0 2px <color>`) per the §3.6 mapping.
  - `title` attr always set to `@{login}` (and ` — {state}` for non-author non-pending).
- [ ] Create `PrStatusBadges.tsx` and `PrOverallStateIcon.tsx`:
  - Pill primitive per `ui-spec.md` §3.4. Composes the at-most-two pill rule.
  - Round overall-state icon per §3.5.
- [ ] Refresh button → `gh:sync` with `manual:true`. Disabled while syncing (track `lastSyncAt` change).
- [ ] **Commit:** `feat(github): compact PR panel with tabs`.

**Exit:** Real account: switch tabs, see PRs with correct badges, click row opens PR in a new tab. Build green. Manually verified on at least one site (per CLAUDE.md "verify before claiming done").

---

## Step 6 — Context menu + Hide + Sidebar (expanded)

**Goal:** hide/unhide flow, expanded sidebar with views and per-repo filtering.

- [ ] Create `PrContextMenu.tsx`:
  - Items: `Open in GitHub`, `Copy PR link`, `Copy branch name`, `Hide PR` (or `Unhide PR` in Hidden view).
  - Reuses portal/popover patterns from `todo/ContextMenu.tsx` (composedPath dismissal, transformed-ancestor offset compensation — both gotchas already in CLAUDE.md).
- [ ] Create `PrSidebar.tsx`:
  - Visible in expanded mode (`PANEL_WIDTH_EXPANDED`).
  - System rows in order: `Mine` (`GitPullRequest`), `Review` (`Inbox`), `All` (`Layers`), `Hidden` (`EyeOff`) with counts.
  - Repos: dynamic list of `enabled` repos (`GitBranch` icon) with PR counts; clicking a repo sets `activeView` to that repo and filters the list to PRs from it (intersected with the active tab).
- [ ] Wire view rules in `PrApp`:
  - When `activeView === 'mine' | 'review' | 'all'`: list = `selectByTab(...)` then `groupByDay(...)`.
  - When `activeView === 'hidden'`: list = `selectHidden(...)` then `groupByDay(...)`. The segmented control is visually muted but stays on screen.
  - When `activeView` is a `RepoKey`: list = `selectByRepo(...)` further filtered by `activeTab`, then `groupByDay(...)`.
- [ ] Persist `activeView` to `githubUiItem`.
- [ ] **Commit:** `feat(github): context menu, hide, and expanded sidebar`.

**Exit:** Hide a PR → disappears, persists across reload, visible in Hidden view, unhide returns it to its tab. Repo filter narrows the list. Build green.

---

## Step 7 — Polish + verification

- [x] Empty / loading / error states polished per `ui-spec.md` tokens. `prefers-reduced-motion` honored on tab switches and row hovers.
- [x] Rate-limit visibility: when `RateLimitError` thrown, header chip shows `Rate-limited · resets in Nm`; auto-clears at `rateLimitResetAt`.
- [x] PAT scope check: missing-scope banner in Options (`TestResultRow` in `GitHubSection`). Private PRs silently 404 otherwise — Options-side responsibility.
- [x] A11y: tabs are `<button role="tab">` inside `role="tablist" aria-label="PR queries"`, list is `role="list"`, rows are `<a href>`. Day headings `role="heading" aria-level={3}`.
- [ ] Run through `verification.md` checklist on a real account with at least 5 open PRs across 3+ repos, with at least one each of: draft, approved, changes-requested, conflicting, CI failing.
- [x] Update `docs/roadmap.md` Decision Log: `alarms` permission rationale (added in Step 1 docs).
- [ ] If a non-obvious bug is fixed, augment `CLAUDE.md` Critical Conventions per the working agreement.
- [ ] **Commit:** `feat(github): polish, a11y, rate-limit handling`.

**Exit:** Full verification checklist passes. `pnpm compile && pnpm build` green. Manual smoke OK on Chrome + Edge + Firefox (smoke).

---

## Tag the phase done

- [ ] Tag the commit `github/done`.
- [ ] Update `docs/phases/README.md` and `docs/roadmap.md` to mark phase Shipped (date).
