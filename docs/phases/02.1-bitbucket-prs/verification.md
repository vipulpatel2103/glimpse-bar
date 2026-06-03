# Verification — Bitbucket PRs

> Acceptance criteria + manual QA scripts for the Bitbucket PRs phase. Run all of this before tagging the phase Done. Mirrors [`../02-github-prs/verification.md`](../02-github-prs/verification.md) — only Bitbucket-specific differences are spelled out below; cross-referenced AC items inherit unchanged.

---

## Pre-requisites

- A Bitbucket Cloud account with at least:
  - 3+ open PRs you authored across 2+ repositories (preferably across 2+ workspaces).
  - 2+ open PRs where you're a requested reviewer.
  - One PR each, somewhere in the above, with: `Draft`, `Approved`, `Changes requested`, CI failing.
- Credentials:
  - `Workspace` slug — primary workspace where most repos live (e.g. `acme-corp`).
  - `Username` — Bitbucket username (the path segment in `https://bitbucket.org/{username}/`).
  - `Email` — your Atlassian account email.
  - `API Token` — scoped Atlassian API token created at https://id.atlassian.com/manage-profile/security/api-tokens with these Bitbucket scopes: `read:user:bitbucket`, `read:workspace:bitbucket`, `read:repository:bitbucket`, `read:pullrequest:bitbucket`. **App Passwords are not supported** — Atlassian retired them on 2025-09-09.

---

## Acceptance Criteria

### AC — Connection (Options page)
- [ ] Options page renders a `Bitbucket` section after `GitHub`, with `id="bitbucket"` so deep-links work.
- [ ] On first visit (no creds): connection block is in `connecting` mode with three visible fields: `Workspace`, `Username`, `Token`.
- [ ] Token field is `<input type="password">`; Workspace + Username are plain `<input type="text">`.
- [ ] All three fields populated → click `Test connection` → within ~2 s shows `✓ Connected as @nickname` with avatar.
- [ ] Bad token → shows `✗ Bad credentials`. No credentials persisted.
- [ ] Token missing required scope (verified by a probing `listWorkspaces` returning 403) → shows `Missing scope: pullrequest` warning.
- [ ] Click `Save & sync` → connection block collapses to `connected` mode (avatar + `@nickname` + workspace chip); sync starts; `Last sync: …` text updates within ~10 s.
- [ ] In `connected` mode, the Token input is **not present in the DOM** (verify with DevTools → Elements search for `type="password"`).
- [ ] Click `Change credentials` → connection block expands to `connecting` mode. Workspace + Username are pre-filled from storage; Token field is **empty**. Type new credentials → `Test` → `Save & sync` → new credentials in effect; new sync runs.
- [ ] Click `Cancel` while in `connecting` mode (after a Change-credentials click) → returns to `connected` mode without changing stored credentials.
- [ ] Click `Disconnect` → confirm modal → cleared: workspace, username, token, login, avatar, PR cache, workspace list, repo list, hidden set. Panel reverts to "Connect Bitbucket" CTA.
- [ ] Token is **never** written to console, URL, or any element's `value` attribute after save (verify in DevTools → Elements + Console).

### AC — Workspaces (Options page)
- [ ] After first successful `Test connection` + `Save & sync`, a `Workspaces (auto-discovered)` section appears.
- [ ] Workspace list is populated via `GET /2.0/user/permissions/workspaces`. Every workspace is **disabled by default** (`enabled: false`).
- [ ] An empty-state message renders in the panel: `Enable a workspace in Options to start syncing.` with a link that opens Options scrolled to the Bitbucket section.
- [ ] Tick a workspace ON → repo enumeration runs in the background; repo list for that workspace appears within ~10 s with all repos enabled by default.
- [ ] Untick a workspace → its repo list collapses; PRs from that workspace disappear from the panel within ~500 ms (no full re-sync needed).
- [ ] Re-tick the workspace → previously-enabled repo states are preserved (we don't reset their `enabled` field).

### AC — Repos (Options page)
- [ ] Within an enabled workspace, repos are listed sorted by `repo` slug (workspace stripped).
- [ ] Each repo shows an open-PR count (across `Mine` + `Review`, deduped).
- [ ] Toggle a repo OFF → its PRs disappear from the panel within ~500 ms; storage `bitbucketReposItem` reflects the toggle.
- [ ] Toggle the same repo ON → PRs return on next sync (or immediately if cached).
- [ ] On next sync, newly-discovered repos in an enabled workspace appear and default to enabled.

### AC — Refresh interval
- [ ] Default interval = 5 min. Change to 1 min → next alarm fires within ~60 s (verify by watching `Last sync` advance, or via DevTools `chrome.alarms.getAll()` — alarm name `bb-sync` is independent of `gh-sync`).
- [ ] Change to 60 min → no spurious sync within the next 5 min.
- [ ] On SW restart (DevTools → Service workers → "Stop" then trigger), the alarm is re-created with the persisted interval.
- [ ] Heavy-budget warning row (`Heavy: ~Nrk req/hr · consider longer interval`) appears in Options when projected hourly request count > 800 (e.g. 1 min interval × 50 enabled repos).

### AC — Viewer header strip
- [ ] When connected, the panel's top strip shows the viewer's avatar (28 px) + `@nickname`.
- [ ] Strip's right side has a `Change credentials` link with `KeyRound` icon.
- [ ] Click `Change credentials` → opens the Options page scrolled to the Bitbucket section (anchored via `#bitbucket`).

### AC — Panel / tabs
- [ ] Click Bitbucket icon on the bar → panel opens to default tab `Review`.
- [ ] Bar icon is the `bb.png` raster image (verify in DevTools — element is `<img>`, not an SVG).
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
- [ ] `#ID` prefix + title on the top line; title truncates with `…` when long; full title visible via tooltip.
- [ ] Meta line shows `workspace/repo · head → base` (small, muted, truncated).
- [ ] Bottom line: author avatar → `ChevronRight` → reviewer avatars; status pill(s) (max 2 + overflow); 24 px round overall-state icon; comment count + `MessageSquare` icon.
- [ ] Each reviewer avatar has the right ring color: green=approved, amber=changes_requested, blue=commented, neutral=pending. **Red ring (`dismissed`) is never rendered** — Bitbucket has no equivalent state.
- [ ] Hover over an avatar → tooltip shows `@nickname` (and review state for reviewers).
- [ ] At most 3 reviewer avatars visible; overflow rendered as `+N` chip.
- [ ] Status pill correctly reflects `Approved` / `Changes requested` / `Review required` / `Draft`. **`Conflicts` pill never appears.** When more than two would apply, only the top two render and the rest collapse to `+N`.
- [ ] Overall-state icon uses the right glyph + color: ✓ ready / ✕ failed / 🕒 pending / − neutral. **No `blocked` / ⚠ state.**
- [ ] Click card → opens PR URL (`pr.links.html.href`) in a new tab (cmd/ctrl-click and middle-click also open).
- [ ] Hover card → kebab fades in within 100 ms; card layout does not shift.
- [ ] Avatar image fails to load → falls back to initials chip with the same ring color (initials from `nickname` first 2 chars).

### AC — Context menu
- [ ] Right-click or kebab opens the menu at the correct position; flips above when near viewport bottom.
- [ ] `Open in Bitbucket` → opens PR URL.
- [ ] `Copy PR link` → clipboard contains `pr.url` (the `links.html.href` value).
- [ ] `Copy branch name` → clipboard contains `pr.headRef`.
- [ ] `Hide PR` → row disappears immediately; PR persists in the cache (`bitbucketPrsItem`) and `bitbucketHiddenItem` includes its id.
- [ ] Menu closes on outside click (`composedPath` correctness — clicks on its own items do not close it).

### AC — Hide / Unhide
- [ ] Hide a PR → it disappears from `Mine`, `Review`, and `All` tabs; reload page → still hidden.
- [ ] In expanded mode → sidebar shows `Hidden` view with the PR.
- [ ] Right-click hidden row → `Unhide PR` → PR returns to its tab.

### AC — Expanded mode + sidebar
- [ ] Click maximize → panel width animates to ≈720 px in ~280 ms.
- [ ] Sidebar shows `Mine`, `Review`, `All`, `Hidden` system rows on top.
- [ ] Beneath a divider, sidebar shows per-workspace groups (only enabled workspaces). Each workspace heading is a button that toggles its expanded state.
- [ ] Per-repo rows are indented under their workspace heading and only render when expanded; counts match.
- [ ] Click a per-repo row → list filters to that repo's PRs (intersected with the active tab).
- [ ] Click `Hidden` → tab pills visually mute; list shows hidden PRs (still date-grouped); unhide returns it to its tab.
- [ ] Click minimize → panel returns to 360 px.
- [ ] Width tween does not run while the bar is being dragged.

### AC — Empty / loading / error states
- [ ] No credentials → "Connect Bitbucket to see your PRs" with `Open settings` link → opens Options page via SW message (`hash: 'bitbucket'`).
- [ ] Credentials connected but no workspace enabled → `Building2` icon + "Enable a workspace in Options to start syncing." with deep-link.
- [ ] First sync, no cache → spinner + "Syncing Bitbucket…".
- [ ] Sync fails (e.g. revoke token mid-flight) → error chip + `Couldn't sync — {error}` + `Retry` button. Cached PRs still render.
- [ ] Mine — no PRs → `GitPullRequest` icon + "You haven't opened any PRs."
- [ ] Review — no PRs → `Inbox` icon + "No PRs awaiting your review."
- [ ] All — no PRs → 32 px `bb.png` (50% opacity) + "No open PRs in your queue."
- [ ] Hidden — no PRs → `EyeOff` icon + "Nothing hidden."

### AC — Rate limiting
- [ ] Force a 429 response (DevTools → Network → block `api.bitbucket.org` and inject a fake response, or burn through the user's hourly budget by setting refresh to 1 min and enabling many repos) → header shows `Rate-limited · resets in Nm`. Counter ticks down. Auto-refresh suppressed until reset.
- [ ] Manual refresh while rate-limited shows the same chip; no infinite retry loop.

### AC — Cross-tab consistency
- [ ] Open `https://example.com` in two tabs. Hide a PR in tab A → it disappears in tab B within ~1 s.
- [ ] Sync in one tab → PR list updates in both.

### AC — Cross-browser smoke
- [ ] Chrome: full smoke (5 min) below.
- [ ] Edge: full smoke (5 min) below.
- [ ] Firefox: full smoke (5 min) — note any quirks in `testing-plan.md` §Known issues.

### AC — Theme + reduced motion
- [ ] Toggle OS dark mode → all Bitbucket PR surfaces re-skin within ~500 ms; chip colors remain WCAG-AA (≥ 4.5:1).
- [ ] Enable `prefers-reduced-motion: reduce` → tab switch is instant; popover opens instantly; refresh icon does not spin (or is static).

### AC — Coexistence with GitHub PRs
- [ ] With both Phase 02 and Phase 02.1 connected, opening Bitbucket panel does not affect the cached state of the GitHub panel and vice versa.
- [ ] Two separate alarms (`gh-sync`, `bb-sync`) appear in `chrome.alarms.getAll()`.
- [ ] Bar order is `TODO → GitHub → Bitbucket → Settings`. Hiding either app via the Settings page works independently.

### AC — Security / privacy
- [ ] DevTools Network tab during a sync: requests fire to `https://api.bitbucket.org/2.0/...` from the **service worker** (Initiator: background). No requests from the host page.
- [ ] Credentials never appear in any URL or query string. Only in the `Authorization` request header (Basic-encoded).
- [ ] Token is **not** stored anywhere readable by the panel — panel reads `bitbucketAuthItem` but only consumes `nickname` / `displayName` / `avatarUrl` / `accountId` / `workspace` / `username`. Token field of that item is referenced by the SW only.
- [ ] Disconnect → `chrome.storage.sync.get('gb-bb-auth')` returns `{}`.
- [ ] No new permissions in `wxt.config.ts` vs Phase 02 (`<all_urls>`, `contextMenus`, `alarms` only).

---

## Manual QA Scripts

### Smoke (5 min)
> Run before every commit-to-main / PR merge during this phase.

1. `pnpm dev` (or `pnpm build` then load `.output/chrome-mv3/`).
2. Visit `https://example.com` → bar visible → click Bitbucket icon → panel opens.
3. If first time: open Options, enter `Workspace` + `Username` + `Token`, Test, Save & sync. Wait for first sync.
4. Tick at least one workspace in the Workspaces section. Wait for repo enumeration (~10 s).
5. Switch back to the page; click Bitbucket icon → panel shows the viewer header strip + `PR's ↻ Nm ago` header + segmented tabs `Mine | Review | All` with `Review` active by default.
6. Switch to `Mine` tab → counts and rows update; switch to `All` → unified list (deduped).
7. Cards are date-grouped under sticky `Mon Apr 20 2026`-style headings.
8. Click any PR card → opens Bitbucket PR in new tab.
9. Right-click a card → `Hide PR` → card vanishes.
10. Maximize panel → sidebar appears (`Mine`, `Review`, `All`, `Hidden`, per-workspace → per-repo) → click `Hidden` → previously hidden PR shown → right-click → `Unhide PR` → returns.
11. Click viewer header `Change credentials` → Options page opens scrolled to Bitbucket section.
12. Click `Refresh` button → spinner runs, `Nm ago` updates.
13. No `console.error` from Glimpse code in DevTools.
14. Verify GitHub panel still works correctly (no regression in Phase 02).

### Full regression (20 min)
> Run before tagging the phase Done.

1. All AC items above on Chrome.
2. Smoke on Edge.
3. Smoke on Firefox.
4. Hard-case sites from `../../testing-plan.md`:
   - `https://example.com` (baseline)
   - `https://bitbucket.org` (the source app — verify our panel survives + doesn't conflict with their UI)
   - `https://github.com` (verify no cross-talk between GitHub and Bitbucket panels)
   - `https://www.notion.so` (high z-index sidebar)
   - `https://chatgpt.com` (SPA replaces body)
5. DevTools Performance: record 5 s scrolling a list of 20+ PR rows → no long tasks > 50 ms.
6. DevTools Memory: heap snapshot before / after 3 sync cycles → no growing detached DOM nodes.
7. Storage Inspector: shapes match `lib/bitbucket/types.ts`.
8. SW console: trigger `chrome.runtime.sendMessage({type:'bb:sync', manual:true})` while the panel is open → list updates without a reload.
9. Lighthouse on `example.com` with extension loaded → no regression vs. Phase 02 baseline.

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
- [ ] Cross-cutting docs ([`../../requirements.md`](../../requirements.md), [`../../architecture.md`](../../architecture.md), [`../../ui-design.md`](../../ui-design.md), [`../../../design.md`](../../../design.md), [`../../testing-plan.md`](../../testing-plan.md), [`../../roadmap.md`](../../roadmap.md)) reviewed for needed updates.
- [ ] `CLAUDE.md` Critical Conventions augmented with any non-obvious learning (Bitbucket-specific gotchas — `nickname` vs `username` vs `accountId`, `q` filter URL-encoding, `reviewers.account_id` vs `reviewers.uuid`, `Authorization: Basic` vs `Bearer` accepting both App Password and Access Token).
- [ ] Tag the commit `bitbucket/done`.
