# Verification — GitHub PRs

> Acceptance criteria + manual QA scripts for the GitHub PRs phase. Run all of this before tagging the phase Done.

---

## Pre-requisites

- A GitHub account with at least:
  - 3+ open PRs you authored across 2+ repositories.
  - 2+ open PRs where you're a requested reviewer.
  - One PR each, somewhere in the above, with: `Draft`, `Approved`, `Changes requested`, `Conflicts`, CI failing.
- A Personal Access Token (classic) with `repo` scope (or `public_repo` if all PRs are public). Documented at https://github.com/settings/tokens.

---

## Acceptance Criteria

### AC — Connection (Options page)
- [ ] Options page renders a `GitHub` section after `Appearance`, with `id="github"` so deep-links work.
- [ ] On first visit (no PAT): connection block is in `connecting` mode with a visible PAT input.
- [ ] Paste PAT → click `Test connection` → within ~2 s shows `✓ Connected as @login (scopes: repo)` with avatar.
- [ ] Paste an invalid PAT → shows `✗ Bad credentials` (or similar). No PAT is persisted.
- [ ] Paste a PAT missing required scope → shows `Missing scope: repo` warning.
- [ ] Click `Save & sync` → connection block collapses to `connected` mode (avatar + `@login` + scopes); sync starts; `Last sync: …` text updates within ~10 s.
- [ ] In `connected` mode, the PAT input is **not present in the DOM** (verify with DevTools → Elements search for `type="password"`).
- [ ] Click `Change PAT` → connection block expands to `connecting` mode with an empty input. Old PAT is **not** pre-filled. Type a new PAT → `Test` → `Save & sync` → new PAT is in effect; new sync runs.
- [ ] Click `Cancel` while in `connecting` mode (after a Change-PAT click) → returns to `connected` mode without changing the stored PAT.
- [ ] Click `Disconnect` → confirm modal → cleared: PAT, login, avatar, PR cache, repo list, hidden set. Panel reverts to "Connect GitHub" CTA.
- [ ] PAT is **never** written to console, URL, or any element's `value` attribute after save (verify in DevTools → Elements + Console).

### AC — Repos (Options page)
- [ ] After first sync, repos discovered from authored + review-requested PRs appear in the Repos list, sorted by `owner/repo`.
- [ ] Each repo shows an open-PR count.
- [ ] Toggle a repo OFF → its PRs disappear from the panel within ~500 ms (storage watcher) without re-syncing.
- [ ] Toggle the same repo ON → PRs return.
- [ ] On next sync, newly-discovered repos appear and default to enabled.

### AC — Refresh interval
- [ ] Default interval = 5 min. Change to 1 min → next alarm fires within ~60 s (verify by watching `Last sync` advance, or via DevTools → Application → Service workers → `chrome.alarms.getAll()`).
- [ ] Change to 60 min → no spurious sync within the next 5 min.
- [ ] On SW restart (DevTools → Service workers → "Stop" then trigger), the alarm is re-created with the persisted interval.

### AC — Viewer header strip
- [ ] When connected, the panel's top strip shows the viewer's avatar (28 px) + `@login`.
- [ ] Strip's right side has a `Change PAT` link with `KeyRound` icon.
- [ ] Click `Change PAT` → opens the Options page scrolled to the GitHub section (anchored via `#github`).

### AC — Panel / tabs
- [ ] Click GitHub icon on the bar → panel opens to default tab `Review`.
- [ ] Three tabs visible (`Mine` · `Review` · `All`) inside a segmented pill control on the right of the panel header.
- [ ] Tab counts match the PR list lengths; `All` count = unique union of `Mine` + `Review`.
- [ ] Switch tabs → animated thumb slides between pills (~180 ms); list updates instantly (cached).
- [ ] Refresh button spins while syncing; `Nm ago` text updates.
- [ ] Header shows `Nm ago` (compact form: `1m`, `2h`, `3d`), ticking once a minute.

### AC — Date grouping
- [ ] PRs are grouped under sticky `Mon Apr 20 2026`-style headings keyed by `updatedAt` day.
- [ ] Within a group, rows are sorted by `updatedAt` desc.
- [ ] Headings remain visible while scrolling (sticky); they don't shift card layout when re-pinned.

### AC — PR card contents
For at least one PR card, verify:
- [ ] `#NUMBER` prefix + title on the top line; title truncates with `…` when long; full title visible via tooltip.
- [ ] Bottom line: author avatar → `ChevronRight` → reviewer avatars; status pill(s) (max 2 + overflow); 24 px round overall-state icon; comment count + `MessageSquare` icon.
- [ ] Each reviewer avatar has the right ring color: green=approved, amber=changes_requested, red=dismissed, blue=commented, neutral=pending.
- [ ] Hover over an avatar → tooltip shows `@login` (and review state for reviewers).
- [ ] At most 3 reviewer avatars visible; overflow rendered as `+N` chip.
- [ ] Status pill correctly reflects `Approved` / `Changes requested` / `Review required` / `Conflicts` / `Draft`. When more than two would apply, only the top two render and the rest collapse to `+N`.
- [ ] Overall-state icon uses the right glyph + color: ✓ ready / ✕ failed / ⚠ blocked / 🕒 pending / − neutral.
- [ ] Click card → opens PR URL in a new tab (cmd/ctrl-click and middle-click also open).
- [ ] Hover card → kebab fades in within 100 ms; card layout does not shift.
- [ ] Avatar image fails to load → falls back to initials chip with the same ring color.

### AC — Context menu
- [ ] Right-click or kebab opens the menu at the correct position; flips above when near viewport bottom.
- [ ] `Open in GitHub` → opens PR URL.
- [ ] `Copy PR link` → clipboard contains `pr.url`.
- [ ] `Copy branch name` → clipboard contains `pr.headRef`.
- [ ] `Hide PR` → row disappears immediately; PR persists in the cache (`githubPrsItem`) and `githubHiddenItem` includes its id.
- [ ] Menu closes on outside click (`composedPath` correctness — clicks on its own items do not close it).

### AC — Hide / Unhide
- [ ] Hide a PR → it disappears from `Mine`, `Review`, and `All` tabs; reload page → still hidden.
- [ ] In expanded mode → sidebar shows `Hidden` view with the PR.
- [ ] Right-click hidden row → `Unhide PR` → PR returns to its tab.

### AC — Expanded mode + sidebar
- [ ] Click maximize → panel width animates to ≈720 px in ~280 ms.
- [ ] Sidebar shows `Mine`, `Review`, `All`, `Hidden` system rows + per-repo rows; counts match.
- [ ] Click a per-repo row → list filters to that repo's PRs (intersected with the active tab).
- [ ] Click `Hidden` → tab pills visually mute; list shows hidden PRs (still date-grouped); unhide returns it to its tab.
- [ ] Click minimize → panel returns to 360 px.
- [ ] Width tween does not run while the bar is being dragged.

### AC — Empty / loading / error states
- [ ] No PAT → "Connect GitHub to see your PRs" with `Open settings` link → opens Options page via SW message.
- [ ] First sync, no cache → spinner + "Syncing GitHub…".
- [ ] Sync fails (e.g. revoke PAT mid-flight) → error chip + `Couldn't sync — {error}` + `Retry` button. Cached PRs still render.
- [ ] Mine — no PRs → `GitPullRequest` icon + "You haven't opened any PRs."
- [ ] Review — no PRs → `Inbox` icon + "No PRs awaiting your review."
- [ ] All — no PRs → `Github` icon + "No open PRs in your queue."
- [ ] Hidden — no PRs → `EyeOff` icon + "Nothing hidden."

### AC — Rate limiting
- [ ] Force a 429/`X-RateLimit-Remaining: 0` response (DevTools → Network → block `api.github.com` and inject a fake response, or burn through an unauthenticated quota by removing the PAT temporarily) → header shows `Rate-limited · resets in Nm`. Counter ticks down. Auto-refresh suppressed until reset.
- [ ] Manual refresh while rate-limited shows the same chip; no infinite retry loop.

### AC — Cross-tab consistency
- [ ] Open `https://example.com` in two tabs. Hide a PR in tab A → it disappears in tab B within ~1 s.
- [ ] Sync in one tab → PR list updates in both.

### AC — Cross-browser smoke
- [ ] Chrome: full smoke (5 min) below.
- [ ] Edge: full smoke (5 min) below.
- [ ] Firefox: full smoke (5 min) — note any quirks in `testing-plan.md` §Known issues.

### AC — Theme + reduced motion
- [ ] Toggle OS dark mode → all GitHub PR surfaces re-skin within ~500 ms; chip colors remain WCAG-AA (≥ 4.5:1).
- [ ] Enable `prefers-reduced-motion: reduce` → tab switch is instant; popover opens instantly; refresh icon does not spin (or is static).

### AC — Security / privacy
- [ ] DevTools Network tab during a sync: a **single** POST to `https://api.github.com/graphql` is initiated by the **service worker** (Initiator: background). No REST endpoints under `/search`, `/repos`, `/pulls`, `/reviews`, `/check-runs` are hit. No requests from the host page.
- [ ] Inspect the GraphQL response body: `data.rateLimit.cost` ≤ 5 for the snapshot query.
- [ ] Force a `mergeable: UNKNOWN` (push to a PR head branch right before sync) → after the initial sync resolves, a second targeted GraphQL POST fires within ~8 s carrying `query Reread`. The card's `Conflicts` chip appears or clears without a full re-sync.
- [ ] No PAT in any URL, query string, error message, or storage item that the panel reads (panel only reads `githubAuthItem` for `login` + scopes; never `pat`).
- [ ] Disconnect → `chrome.storage.sync.get()` for `gb-github-auth` returns `{}`.

---

## Manual QA Scripts

### Smoke (5 min)
> Run before every commit-to-main / PR merge during this phase.

1. `pnpm dev` (or `pnpm build` then load `.output/chrome-mv3/`).
2. Visit `https://example.com` → bar visible → click GitHub icon → panel opens.
3. If first time: open Options, paste PAT, Test, Save & sync. Wait for first sync.
4. Switch back to the page; click GitHub icon → panel shows the viewer header strip + `PR's ↻ Nm ago` header + segmented tabs `Mine | Review | All` with `Review` active by default.
5. Switch to `Mine` tab → counts and rows update; switch to `All` → unified list (with `Mine` and `Review` PRs deduped).
6. Cards are date-grouped under sticky `Mon Apr 20 2026`-style headings.
7. Click any PR card → opens GitHub PR in new tab.
8. Right-click a card → `Hide PR` → card vanishes.
9. Maximize panel → sidebar appears (`Mine`, `Review`, `All`, `Hidden`, per-repo) → click `Hidden` → previously hidden PR shown → right-click → `Unhide PR` → returns.
10. Click viewer header `Change PAT` → Options page opens scrolled to GitHub section.
11. Click `Refresh` button → spinner runs, `Nm ago` updates.
12. No `console.error` from Glimpse code in DevTools.

### Full regression (20 min)
> Run before tagging the phase Done.

1. All AC items above on Chrome.
2. Smoke on Edge.
3. Smoke on Firefox.
4. Hard-case sites from `../../testing-plan.md`:
   - `https://example.com` (baseline)
   - `https://github.com` (dark UI, SPA navigation — verify our panel survives `wxt:locationchange`)
   - `https://www.notion.so` (high z-index sidebar)
   - `https://www.youtube.com` (fullscreen video)
   - `https://chatgpt.com` (SPA replaces body)
5. DevTools Performance: record 5 s scrolling a list of 20+ PR rows → no long tasks > 50 ms.
6. DevTools Memory: heap snapshot before / after 3 sync cycles → no growing detached DOM nodes.
7. Storage Inspector: shapes match `lib/github/types.ts`.
8. SW console: trigger `chrome.runtime.sendMessage({type:'gh:sync', manual:true})` while the panel is open → list updates without a reload.
9. Lighthouse on `example.com` with extension loaded → no regression vs. Phase 01 baseline.

---

## Known Issues Log (this phase)

> Populate during QA. Each entry: site, browser, severity, description, mitigation. If empty at end of phase, delete the table.

| # | Site | Browser | Severity | Description | Mitigation |
|---|---|---|---|---|---|
| _ | _ | _ | _ | _ | _ |

---

## Phase Done Checklist

- [ ] All AC sections above checked off on Chrome.
- [ ] Smoke (5 min) passes on Edge + Firefox.
- [ ] No `console.error` from Glimpse code on the 5 hard-case sites.
- [ ] All 7 steps in [`plan.md`](plan.md) committed.
- [ ] [`scope.md`](scope.md), [`ui-spec.md`](ui-spec.md), [`README.md`](README.md) reflect what was actually shipped (any drift reconciled before tagging).
- [ ] Cross-cutting docs ([`../../requirements.md`](../../requirements.md), [`../../architecture.md`](../../architecture.md), [`../../ui-design.md`](../../ui-design.md), [`../../../design.md`](../../../design.md), [`../../testing-plan.md`](../../testing-plan.md), [`../../roadmap.md`](../../roadmap.md)) reviewed for needed updates. New `alarms` permission documented in roadmap decision log.
- [ ] `CLAUDE.md` Critical Conventions augmented with any non-obvious learning (e.g., GitHub-API specific gotchas — token format, scope mapping, mergeable_state polling delay).
- [ ] Tag the commit `github/done`.
