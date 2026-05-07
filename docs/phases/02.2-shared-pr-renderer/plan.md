# Plan — Shared PR Renderer

> Step-by-step migration order. Each step ends with `pnpm compile` green; key checkpoints also run `pnpm build`. Read [`design.md`](design.md) first — this file is just the order of operations.

---

## Step 1 — Phase docs

- [x] `docs/phases/02.2-shared-pr-renderer/{README,design,plan,verification}.md`
- [x] Update `docs/phases/README.md` index — add Phase 02.2 row.
- [x] Update `docs/roadmap.md` Phase Order — insert Phase 02.2 after Phase 02.1; add a Decision Log entry.
- [ ] **Commit:** `docs(phase-02.2): plan shared PR renderer refactor`. _(user)_

**Exit:** docs render; relative links resolve.

---

## Step 2 — Shared `lib/pr/*` (new code, unused)

- [ ] `lib/pr/types.ts` — `NormalizedPr`, `ProviderId`, all unions, `PrUiState`, `View`, `PrCounts`, `NormalizedChangeEvent`, `NotifBaseline`.
- [ ] `lib/pr/format.ts` — formatters + status meta + `deriveOverallState` + `getRepoColor` + `initialsOf`. Operates on `NormalizedPr` / unions only.
- [ ] `lib/pr/selectors.ts` — `selectByTab`, `selectHidden`, `selectByRepo`, `groupByDay`, `groupByRepo`, `groupByParent`, `countByView`, `resolveView`. Generic over `NormalizedPr[]`.
- [ ] `lib/pr/mutations.ts` — `hidePr`, `unhidePr`, `mergePrs`, `patchCiState`, `patchMergeState`.
- [ ] `lib/pr/notif.ts` — `buildBaseline`, `diffPrState`, `appendChanges` over `NormalizedPr` + `NormalizedChangeEvent`.
- [ ] `lib/pr/adapter.ts` — `ProviderAdapter` interface + `EmptyStateConfig`, `SidebarProps`, `ViewerInfo`.
- [ ] **Defer** `lib/pr/adapters.ts` to Step 4 (needs provider adapters to exist).
- [ ] **Commit:** `feat(pr): shared types + selectors + format + adapter contract`. _(user)_

**Exit:** `pnpm compile` green. New code is unused.

---

## Step 3 — Shared visual components (new code, unused)

- [ ] `entrypoints/glimpse.content/components/pr/PrAvatarChip.tsx`
- [ ] `entrypoints/glimpse.content/components/pr/PrDayHeading.tsx`
- [ ] `entrypoints/glimpse.content/components/pr/PrOverallStateIcon.tsx`
- [ ] `entrypoints/glimpse.content/components/pr/PrStatusBadges.tsx` — takes `pills: StatusMeta[]` from adapter.
- [ ] `entrypoints/glimpse.content/components/pr/PrCardRow.tsx` — generic over `NormalizedPr` + adapter for pills.
- [ ] `entrypoints/glimpse.content/components/pr/PrViewerHeader.tsx` — viewer info + `changeCredsLabel` from adapter.
- [ ] `entrypoints/glimpse.content/components/pr/PrHeader.tsx` — `segmentedLayoutId` + sync message from adapter.
- [ ] `entrypoints/glimpse.content/components/pr/PrListView.tsx` — empty states from adapter.
- [ ] `entrypoints/glimpse.content/components/pr/PrContextMenu.tsx` — brand short name from adapter.
- [ ] `entrypoints/glimpse.content/components/pr/ChangesView.tsx` — generic over `NormalizedChangeEvent`.
- [ ] `entrypoints/glimpse.content/components/pr/sidebar/SidebarSystemRow.tsx`
- [ ] `entrypoints/glimpse.content/components/pr/sidebar/SidebarHierarchyRow.tsx`
- [ ] `entrypoints/glimpse.content/components/pr/sidebar/SidebarLeafRow.tsx`
- [ ] `entrypoints/glimpse.content/components/pr/sidebar/SidebarDivider.tsx`
- [ ] `entrypoints/glimpse.content/components/pr/PrApp.tsx` — orchestrator; takes `adapter` prop.
- [ ] **Commit:** `feat(pr): shared visual components`. _(user)_

**Exit:** `pnpm compile` green. New components compile but no consumer yet.

---

## Step 4 — Provider mappers + sync rewrite + adapters

- [ ] `lib/github/api.ts` — add `mapToNormalized(raw): NormalizedPr`. Existing `PullRequest` types may stay as internal raw shapes inside `api.ts` only.
- [ ] `lib/github/sync.ts` — rewrite to write `NormalizedPr[]`. Use shared `mergePrs` / `diffPrState` / `buildBaseline` / `patchMergeState` from `lib/pr`.
- [ ] `lib/github/adapter.ts` — export `githubAdapter: ProviderAdapter`.
- [ ] `lib/bitbucket/api.ts` — add `mapToNormalized`. Existing `BbPullRequest` may stay raw-only.
- [ ] `lib/bitbucket/sync.ts` — rewrite to write `NormalizedPr[]`. Use shared utilities.
- [ ] `lib/bitbucket/adapter.ts` — export `bitbucketAdapter: ProviderAdapter`.
- [ ] `lib/pr/adapters.ts` — `ADAPTERS` registry.
- [ ] **Storage retype + key bump** in `lib/storage.ts`:
  - `githubPrsItem` / `bitbucketPrsItem` → `NormalizedPr[]`, keys `-v2`
  - `githubUiItem` / `bitbucketUiItem` → `PrUiState`, keys `-v2`
  - `githubChangesItem` / `bitbucketChangesItem` → `NormalizedChangeEvent[]`, keys `-v2`
  - `githubNotifBaselineItem` / `bitbucketNotifBaselineItem` → `NotifBaseline` from `lib/pr`, keys `-v2`
- [ ] **Commit:** `feat(pr): provider adapters + sync rewrite + storage retype`. _(user)_

**Exit:** `pnpm compile` green. Old provider visual components still consume old shapes — they'll fail to compile until Step 5.

> Note: this commit will *not* compile mid-way. The user commits only after Step 5 lands so the working tree is consistent. We do Step 4 + Step 5 atomically and the user picks one or two commits.

---

## Step 5 — Wire-up + delete olds

- [ ] `lib/apps/types.ts` — add `providerId?: ProviderId`; make `Renderer` optional.
- [ ] `lib/apps/registry.ts` — switch `github` and `bitbucket` entries to `providerId`-only (drop direct `Renderer`).
- [ ] `entrypoints/glimpse.content/components/GlimpsePanel.tsx` — branch on `app.providerId`.
- [ ] `entrypoints/glimpse.content/App.tsx` — `pinned` / `expanded` / badges driven by `ADAPTERS[providerId].storage.ui` + `.changes`. (Or kept inline; minimal touch.)
- [ ] **Rewrite** per-provider sidebars using shared primitives:
  - `entrypoints/glimpse.content/components/github/PrSidebar.tsx` (compose `SidebarSystemRow` + `SidebarLeafRow` for flat repo list)
  - `entrypoints/glimpse.content/components/bitbucket/BbSidebar.tsx` (compose with `SidebarHierarchyRow` for workspace groups)
- [ ] **Delete** old provider visual components:
  - `components/github/{PrApp,PrViewerHeader,PrHeader,PrListView,PrCardRow,AvatarChip,PrStatusBadges,PrOverallStateIcon,PrDayHeading,PrContextMenu,ChangesView}.tsx`
  - `components/bitbucket/{BbApp,BbViewerHeader,BbHeader,BbListView,BbCardRow,BbAvatarChip,BbStatusBadges,BbOverallStateIcon,BbDayHeading,BbContextMenu}.tsx`
- [ ] **Delete** old shared lib duplicates:
  - `lib/github/{format,selectors,mutations,notif}.ts`
  - `lib/bitbucket/{format,selectors,mutations,notif}.ts`
- [ ] Trim `lib/github/types.ts` and `lib/bitbucket/types.ts` to the auth + hierarchy types only.
- [ ] **Commit:** `feat(pr): wire shared renderer + delete duplicated provider components`. _(user)_

**Exit:** `pnpm compile && pnpm build` green. Bar order unchanged. Storage caches reset to empty (key bump).

---

## Step 6 — Verification

- [ ] Phase 02 [`verification.md`](../02-github-prs/verification.md) smoke (5 min) passes against shared renderer driven by `githubAdapter`.
- [ ] Phase 02.1 [`verification.md`](../02.1-bitbucket-prs/verification.md) smoke (5 min) passes against `bitbucketAdapter`.
- [ ] Bundle size: content-script ≤ 410 kB (Phase 02.1 baseline). Target: shrink by 20+ kB.
- [ ] No `console.error` from PR rendering in DevTools.
- [ ] Both providers' alarms (`gh-sync`, `bb-sync`) still fire at their respective intervals.
- [ ] Adding GitLab adapter (paper exercise) takes ≤ 200 lines + zero touches to `components/pr/`.
- [ ] **Commit:** `chore(pr): verification`. _(user — code complete)_

**Exit:** `pnpm compile && pnpm build` green. Manual smoke confirmed.

---

## Tag the phase done

- [ ] Tag the commit `pr-renderer/done`.
- [ ] Update `docs/phases/README.md` and `docs/roadmap.md` to mark phase Shipped.
