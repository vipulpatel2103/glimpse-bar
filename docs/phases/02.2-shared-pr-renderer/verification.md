# Verification — Shared PR Renderer

> Acceptance criteria for Phase 02.2. The refactor must preserve every Phase 02 + 02.1 acceptance criterion. This file lists only what's specific to the refactor.

---

## Pre-requisites

- Working GitHub PAT (Phase 02 setup).
- Working Bitbucket Workspace + Username + Token (Phase 02.1 setup).

---

## Acceptance Criteria

### AC — Type system + shared layer
- [ ] `lib/pr/types.ts` exports `NormalizedPr`, `ProviderId`, `Reviewer`, all unions, `PrUiState`, `View`, `PrCounts`, `NormalizedChangeEvent`, `NotifBaseline`.
- [ ] `lib/pr/format.ts`, `selectors.ts`, `mutations.ts`, `notif.ts` operate over `NormalizedPr` only — no GitHub/Bitbucket-specific imports.
- [ ] `lib/pr/adapter.ts` exports `ProviderAdapter` interface with all fields documented in [`design.md`](design.md) §2.
- [ ] `lib/pr/adapters.ts` exports `ADAPTERS` registry indexed by `ProviderId`.

### AC — Shared visual layer
- [ ] `entrypoints/glimpse.content/components/pr/` contains exactly one of each: `PrApp`, `PrViewerHeader`, `PrHeader`, `PrListView`, `PrCardRow`, `PrAvatarChip`, `PrStatusBadges`, `PrOverallStateIcon`, `PrDayHeading`, `PrContextMenu`, `ChangesView`.
- [ ] `components/pr/sidebar/` contains `SidebarSystemRow`, `SidebarHierarchyRow`, `SidebarLeafRow`, `SidebarDivider`.
- [ ] No `entrypoints/glimpse.content/components/github/Pr*.tsx` files exist (sidebar excepted).
- [ ] No `entrypoints/glimpse.content/components/bitbucket/Bb*.tsx` files exist (sidebar excepted).

### AC — Provider thin layer
- [ ] `lib/github/adapter.ts` exports `githubAdapter: ProviderAdapter`.
- [ ] `lib/bitbucket/adapter.ts` exports `bitbucketAdapter: ProviderAdapter`.
- [ ] `lib/{github,bitbucket}/{format,selectors,mutations,notif}.ts` no longer exist.
- [ ] `lib/github/sync.ts` writes `NormalizedPr[]` to storage.
- [ ] `lib/bitbucket/sync.ts` writes `NormalizedPr[]` to storage.

### AC — Apps registry
- [ ] `AppDefinition` has `providerId?: ProviderId` and `Renderer?: ComponentType` (now optional).
- [ ] `lib/apps/registry.ts` `github` and `bitbucket` entries set `providerId` and have **no** `Renderer` field.
- [ ] `GlimpsePanel.tsx` branches on `app.providerId` for PR-renderer apps.

### AC — Storage migration
- [ ] Storage keys bumped:
  - `local:gb-github-prs-v2`, `local:gb-bb-prs-v2`
  - `local:gb-github-ui-v2`, `local:gb-bb-ui-v2`
  - `local:gb-github-changes-v2`, `local:gb-bb-changes-v2`
  - `local:gb-github-notif-baseline-v2`, `local:gb-bb-notif-baseline-v2`
- [ ] First load after refactor shows empty PR cache for both providers (because keys are new).
- [ ] Auth + hierarchy keys (`gb-github-auth`, `gb-bb-auth`, `gb-github-repos`, `gb-bb-repos`, `gb-bb-workspaces`, `gb-github-hidden`, `gb-bb-hidden`) are **unchanged** — credentials and workspace selections persist across the refactor.

### AC — Phase 02 GitHub regression
> Run [`../02-github-prs/verification.md`](../02-github-prs/verification.md) Smoke (5 min). Every step must pass.

- [ ] Connect / Test / Save & sync flow still works in Options.
- [ ] Three tabs render with correct counts.
- [ ] Date-grouped cards show `#NUMBER + title`, `repo · head→base`, author→reviewer chain, status pill, overall-state icon, comment count.
- [ ] Reviewer ring colors correct (green / amber / red / blue / neutral).
- [ ] Click PR → opens GitHub URL.
- [ ] Hide / unhide flow works.
- [ ] Expanded sidebar shows system rows + per-repo rows; click filters list.
- [ ] Refresh button spins; rate-limit chip renders amber when triggered.

### AC — Phase 02.1 Bitbucket regression
> Run [`../02.1-bitbucket-prs/verification.md`](../02.1-bitbucket-prs/verification.md) Smoke (5 min). Every step must pass.

- [ ] Connect / Test / Save & sync flow still works in Options.
- [ ] Workspace opt-in still gates sync; "Enable a workspace" empty state renders correctly when no workspaces enabled.
- [ ] Three tabs render with correct counts.
- [ ] Cards match the same anatomy (no `Conflicts` pill, no `dismissed` reviewer ring).
- [ ] Hide / unhide flow works.
- [ ] Expanded sidebar shows workspace groups → per-repo rows (collapsible per workspace).

### AC — Animations + a11y
- [ ] Tab switch in **GitHub panel** uses `layoutId="gh-tab-thumb"`. Tab switch in **Bitbucket panel** uses `layoutId="bb-tab-thumb"`. Switching providers in the same session does not animate one provider's thumb to the other's.
- [ ] `prefers-reduced-motion` honored in shared layer (no spin, no thumb tween).
- [ ] `role="tablist"` / `role="tab"` / `aria-selected` on segmented control.
- [ ] `role="list"` / `role="listitem"` on PR cards.
- [ ] Day headings `role="heading" aria-level={3}`.

### AC — Bundle size
- [ ] `pnpm build` content-script bundle ≤ 410 kB (Phase 02.1 baseline). Target shrink: 20+ kB after duplicates removed.
- [ ] `pnpm build` total `.output/chrome-mv3/` size ≤ 873 kB.

### AC — Future-proofing (paper exercise)
- [ ] Adding `lib/gitlab/adapter.ts` + `lib/gitlab/sync.ts` + a registry entry would require **zero changes** to `components/pr/`. Verify by reading the adapter contract and sketching what gitlab's adapter would look like (no implementation needed in this phase).

---

## Smoke (10 min)

> Run before tagging the phase Done.

1. `pnpm dev`. Visit `https://example.com`.
2. Click GitHub icon → panel opens. Tabs work, cards render, hide works, sidebar works (expanded mode).
3. Click Bitbucket icon → panel opens. Same checks. Verify "Enable a workspace" empty state if you toggle all workspaces off in Options.
4. Toggle expanded mode in both panels. Sidebar primitives behave identically across providers (rows, dividers, hierarchy chevrons).
5. Trigger manual refresh on each panel. Both spinners run independently.
6. Open DevTools console — no `console.error` from PR rendering across either panel.
7. DevTools Network — verify each panel only hits its own provider's API host.
8. DevTools Storage — confirm new `*-v2` keys exist; old keys may still exist but are unused.

---

## Phase Done Checklist

- [ ] All AC sections checked off.
- [ ] Phase 02 + 02.1 smoke pass.
- [ ] No `console.error` from PR rendering on the 5 hard-case sites in [`../../testing-plan.md`](../../testing-plan.md).
- [ ] All Steps in [`plan.md`](plan.md) committed.
- [ ] [`design.md`](design.md), [`README.md`](README.md) reflect what was actually shipped.
- [ ] [`../../roadmap.md`](../../roadmap.md) Decision Log updated with phase summary.
- [ ] `CLAUDE.md` augmented if any non-obvious refactor lesson surfaced.
- [ ] Tag the commit `pr-renderer/done`.
