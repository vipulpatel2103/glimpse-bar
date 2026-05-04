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

- [x] Create `lib/github/types.ts`:
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

  export interface PullRequest { ... }
  export interface RepoMeta { ... }
  export type GitHubView = PrTab | RepoKey | 'hidden';
  export interface GitHubUiState { ... }
  export interface GitHubAuthState { ... }
  ```
- [x] Create `lib/github/format.ts`:
  - `formatRelative`, `formatAgoShort`, `formatDayHeading`, `initialsOf`, `branchLabel`
  - `ciStatusMeta`, `reviewStatusMeta`, `mergeStateMeta`, `draftMeta`, `overallStateMeta`, `reviewerRingColor`
  - `deriveOverallState(pr)` → `OverallState`
  - _(extra beyond plan)_ `getRepoColor(key)` — deterministic repo color for sidebar + card bar.
- [x] Create `lib/github/selectors.ts`:
  - `selectByTab`, `groupByDay`, `selectHidden`, `selectByRepo`, `groupByRepo`, `discoverRepos`, `countByView`
  - _(extra)_ `resolveView` — single entry point for PrApp to resolve any `GitHubView` to day-grouped PRs.
- [x] Create `lib/github/mutations.ts`:
  - `hidePr`, `unhidePr`, `toggleRepo`, `setRepoEnabled`, `mergePrs`
  - _(extra)_ `patchMergeState` — targeted patch for UNKNOWN-mergeable re-fetch.
- [x] Append to `lib/storage.ts`:
  - `githubAuthItem` (`sync:gb-github-auth`)
  - `githubPrsItem` (`local:gb-github-prs`)
  - `githubReposItem` (`local:gb-github-repos`)
  - `githubHiddenItem` (`local:gb-github-hidden`)
  - `githubUiItem` (`local:gb-github-ui`)
- [x] **Commit:** _(user commits manually)_

**Exit:** `pnpm compile && pnpm build` both green. ✅

---

## Step 3 — Background fetch pipeline (GraphQL) + alarms

**Goal:** SW owns all GitHub API calls. Content/options scripts never touch `api.github.com`.

### 3.1 — Query

- [x] Create `lib/github/query.ts` — `PR_SNAPSHOT_QUERY`, `VIEWER_QUERY`, `RECHECK_MERGEABLE_QUERY` + raw GQL TypeScript response types.
- [x] Variables passed in: `mineQ = "is:open is:pr author:@me archived:false"`, `reviewQ = "is:open is:pr review-requested:@me archived:false"`.
  - _Note: plan showed `latestReviews` field; actual query uses `reviews(last: 30)` to capture all review states including COMMENTED/DISMISSED._

### 3.2 — `lib/github/api.ts`

- [x] `gqlRequest<T>` — core transport; inspects `errors[]` and `data.rateLimit`.
- [x] `getViewer(pat)` → `{ login, avatarUrl, scopes, isFinegrained }`.
- [x] `fetchPrSnapshot(pat)` → `{ viewer, prs, unknownMergeableNodeIds }`.
- [x] `recheckMergeableWithMap` — targeted re-fetch for UNKNOWN mergeability.
- [x] `missingScopes(viewer)` — detects missing `repo`/`public_repo`; surfaces fine-grained-token hint.

### 3.3 — `lib/github/sync.ts`

- [x] `runSync({ manual })` — one GraphQL POST; merge + persist; UNKNOWN-mergeable re-fetch after 8 s.
- [x] `entrypoints/background.ts` extended: `GlimpseMessage` union + `gh:testPat` / `gh:sync` / `gh:disconnect` handlers.
- [x] `openOptionsPage` handler extended to accept optional `hash` parameter (for `#github` deep-link).
- [x] Alarm setup: `chrome.alarms.create('gh-sync', ...)` on SW startup + watcher for interval changes.
- [x] `wxt.config.ts`: `'alarms'` added to permissions.
- [x] **Commit:** _(user commits manually)_

**Exit:** Build green. ✅

---

## Step 4 — Options page: GitHub section

**Goal:** user can connect, test, disconnect, toggle repos, and configure refresh interval.

- [x] Create `entrypoints/options/sections/GitHubSection.tsx`:
  - `id="github"` anchor for deep-link.
  - Two modes: `connecting` (PAT input + Test + Save & sync + Cancel) / `connected` (viewer row + Change PAT + Disconnect).
  - PAT input unmounted in `connected` mode — never re-readable after save.
  - Refresh interval select (1 / 5 / 15 / 30 / 60 min).
  - Repo list with checkboxes; empty state copy.
  - Status row: last-sync ISO, last-error, Sync now button.
- [x] Mounted in `entrypoints/options/main.tsx` with `<hr/>` separator.
- [x] On mount: if `location.hash === '#github'`, `scrollIntoView`.
- [x] `openOptionsPage` SW handler accepts `hash?` and opens a targeted tab with `#github` anchor.
- [x] Token never logged, echoed, or in any URL.
- [x] _(extra beyond plan)_ `AppVisibilitySection.tsx` — user can show/hide any app icon in the bar. Settings is always-on. `hiddenAppsItem` added to storage.
- [x] **Commit:** _(user commits manually)_

**Exit:** PAT round-trip works. Repo toggle persists. Build green. ✅

---

## Step 5 — Compact panel: PrApp + viewer header + tabs + grouped list + card row

**Goal:** the minimum panel UX matching the screenshot.

- [x] `lib/apps/registry.ts` — `github` flipped to `enabled: true`, `Renderer: PrApp`.
- [x] `PrApp.tsx` — orchestrator: reads 5 storage items; "Connect GitHub" CTA when no PAT; composes viewer header + panel header + list.
- [x] `PrViewerHeader.tsx` — 24 px avatar + `@login` + Change PAT link (opens Options via SW message).
- [x] `PrHeader.tsx`:
  - `PR's` title + refresh (↻, spins, respects reduced motion) + `Nm ago` indicator.
  - `Mine | Review | All` segmented pill control with `framer-motion layoutId` animated thumb.
  - Error chip + rate-limit chip (`Rate-limited · resets in Nm`) with countdown.
  - Tabs visually muted (opacity 0.45) when `activeView === 'hidden'`.
  - Maximize / minimize button.
- [x] `PrListView.tsx` — empty / loading (Loader2, respects reduced motion) / error states + date-grouped `PrDayHeading` + `PrCardRow` list.
- [x] `PrDayHeading.tsx` — sticky heading with top divider + accent dot + uppercase label. `isFirst` skips top divider.
- [x] `PrCardRow.tsx`:
  - 3 px colored left border (deterministic repo color via `getRepoColor`).
  - Top line: `#NUMBER` + title.
  - Meta line: `owner/repo · head → base` (small, muted, truncated).
  - Bottom line: author + reviewer avatar chain (color-coded rings) + status pills (max 2 + overflow) + overall-state icon + comment count.
  - Quick-hide button (EyeOff / Eye, JS `hovered` state — avoids Tailwind group-hover specificity issue in shadow DOM).
  - Hover icons fully JS-controlled (`useState(hovered)`).
- [x] `AvatarChip.tsx` — `<img>` + initials fallback + colored `box-shadow` ring.
- [x] `PrStatusBadges.tsx` — priority-ordered pills, max 2 + "+N" overflow.
- [x] `PrOverallStateIcon.tsx` — 20 px filled circle.
- [x] Refresh → `gh:sync manual:true`; spinner stops when `lastSyncAt` advances.
- [x] `App.tsx` — reads `hiddenAppsItem`, computes `visibleApps`, auto-closes panel if active app is hidden; passes `apps` prop to `GlimpseBar`.
- [x] `GlimpseBar.tsx` — now accepts `apps: AppDefinition[]` prop instead of reading global `APPS`.
- [x] **Commit:** _(user commits manually)_

**Exit:** Real account — tabs, badges, click-to-open. Build green. ✅

---

## Step 6 — Context menu + Hide + Sidebar (expanded)

**Goal:** hide/unhide flow, expanded sidebar with views and per-repo filtering.

- [x] `PrContextMenu.tsx` — wraps existing `ContextMenu`; items: Open in GitHub, Copy PR link, Copy branch name, Hide PR / Unhide PR. Clipboard falls back to `execCommand` for http pages.
- [x] `PrSidebar.tsx` — 200 px sidebar; Mine / Review requests / All / Hidden system rows with counts; per-repo rows with 3 px color swatch (matching card bar color) + PR counts.
- [x] View rules wired in `PrApp`: mine/review/all → `selectByTab`; hidden → `selectHidden`; RepoKey → `selectByRepo` intersected with `activeTab`.
- [x] `activeView` persisted to `githubUiItem`.
- [x] Quick-hide button on each card: `EyeOff` (hide) or `Eye` (unhide, blue tint) based on `isHidden` prop; `handleDirectToggleHide` in PrApp checks `hiddenIds.includes(pr.id)` and calls the correct mutation.
- [x] Hidden-view bug fixed: was calling `hidePr` on already-hidden PRs (no-op); replaced with toggle.
- [x] **Commit:** _(user commits manually)_

**Exit:** Hide → disappears → visible in Hidden view → unhide returns it. Repo filter works. Build green. ✅

---

## Step 7 — Polish + verification

- [x] Empty / loading / error states polished. `prefers-reduced-motion` honored on tab switch, spinner, card hover transition.
- [x] Rate-limit chip: amber pill `Rate-limited · resets in Nm`, auto-clears when `rateLimitResetAt <= now` via 60s tick. Refresh button disabled + dimmed while rate-limited.
- [x] PAT scope check: missing-scope warning in Options (`TestResultRow`). Fine-grained PAT detected and soft-warned.
- [x] A11y: `role="tablist"` + `role="tab"` + `aria-selected`; `role="list"` + `role="listitem"`; rows as `<a href>`; day headings `role="heading" aria-level={3}`; avatar `title` attrs carry reviewer state.
- [x] Manual verification: user confirmed all features working via live screenshots across the session.
- [x] `docs/roadmap.md` Decision Log updated: `alarms` permission + GraphQL transport rationale.
- [x] No new non-obvious runtime bugs warranting CLAUDE.md addition (existing shadow-DOM gotchas already covered).
- [ ] **Commit:** _(user commits manually — code complete, build green)_

**Exit:** `pnpm compile && pnpm build` green. ✅ Manual smoke confirmed by user. ✅

---

## Tag the phase done

- [ ] Tag the commit `github/done`.
- [ ] Update `docs/phases/README.md` and `docs/roadmap.md` to mark phase Shipped (date).
