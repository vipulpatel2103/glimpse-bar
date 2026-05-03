# Roadmap

> **Doc owner:** glimpse-bar
> **Status:** Draft (2026-04-27)
> **Audience:** product + engineering. Order in which features land. Each phase has its own folder under `docs/phases/` once it's planned in detail.

---

## Phase Order (top-level)

| Order | Phase folder | Status | One-liner |
|---|---|---|---|
| 1 | [`phases/00-setup-and-ui-ux/`](phases/00-setup-and-ui-ux/) | Shipped (2026-04-28) | Bar + Panel + Option Page scaffolding. Drag, transparency, theme. No real app integrations; clicking an app icon opens an empty Glimpse Panel. |
| 2 | [`phases/01-todo/`](phases/01-todo/) | Shipped (2026-05-01) | Local TODO list as the first real app. Compact + expanded modes, views (Today / Upcoming / Inbox / Completed + custom lists), dates, subtasks, right-click capture, badge counter. Recurring/reminders/notifications/omnibox split into Phase 01b. |
| 3 | [`phases/02-github-prs/`](phases/02-github-prs/) | **Active — planned (2026-05-02)** | GitHub PR review queue. PAT auth, two tabs (Authored / Review), per-repo toggle, hide PR, background sync via `chrome.alarms`. OAuth and other providers (Bitbucket / GitLab / Azure) deferred. |
| 4 | [`phases/03-jira/`](phases/03-jira/) | Stub — not yet planned | Jira assigned-to-me issues. API token first, OAuth later. |
| later | (TBD) | — | Calendar, Gmail glance, Linear, command palette, AI summaries. |

> **Rule:** Don't plan phase N+1 in detail until phase N has shipped and we've learned from it. Each phase's folder gets fully spec'd just before it starts.

---

## What's Planned in Detail Today

The **Setup and UI/UX** phase has shipped. The **TODO** phase is fully planned — see [`phases/01-todo/`](phases/01-todo/) for:
- scope (in / out)
- step-by-step plan
- phase-specific UI spec
- verification / acceptance criteria

Cross-cutting reference docs that apply to every phase:
- [`requirements.md`](requirements.md) — full system requirements + glossary
- [`architecture.md`](architecture.md) — WXT entrypoints, shadow root UI, storage model, plugin registry
- [`ui-design.md`](ui-design.md) — visual tokens, sizes, animations, accessibility
- [`testing-plan.md`](testing-plan.md) — manual QA scripts, hard-case sites, release checklist

---

## Speculative / Long-tail (no folder yet)

These aren't on the schedule. They're parking-lot items to revisit after the first three real-app phases ship.

| Idea | Notes |
|---|---|
| Calendar app (Google Calendar read-only) | Today's events, "next meeting in N min" header. |
| Gmail glance | Unread / awaiting-reply counts. Not a full inbox. |
| Linear app | Mirror of Jira app shape. |
| Command palette | `Cmd/Ctrl+K` quick actions inside Glimpse Panel. |
| AI summaries | "Summarize this PR / ticket". User-supplied API key, off by default. |
| Cross-device sync | `chrome.storage.sync` for settings; external service for TODO data. |
| Multi-account per app | Two GitHub accounts, two Jira tenants. |
| Slack DMs glance | OAuth + WebSocket. Big lift. |
| Public store listings | Chrome Web Store, Edge Add-ons, Firefox AMO. Needs marketing site, privacy policy, support email. |

---

## Anti-Goals (we won't build)

- **A productivity OS.** Glimpse stays glanceable. No Kanban boards, no calendar grids, no "open in full view" modes that compete with the source apps.
- **Long-term content storage.** Source-of-truth lives in Jira / GitHub / Gmail. We cache, we don't store.
- **Tracking / analytics.** No telemetry without an explicit opt-in toggle that's off by default.
- **Mobile.** Browser extensions on mobile have wildly different APIs.
- **Chrome `chrome.sidePanel` API.** Cross-browser parity matters more; we render Glimpse Panel inside a WXT `createShadowRootUi` overlay.

---

## Decision Log (running)

| Date | Decision | Why |
|---|---|---|
| 2026-04-27 | Glimpse Panel = shadow-root overlay (via WXT `createShadowRootUi`), not `chrome.sidePanel` API | Cross-browser (Firefox lacks `sidePanel`); tighter visual coupling to the bar; matches the welcome-video reference. |
| 2026-04-27 | **Switched from Plasmo to [WXT](https://wxt.dev/)** as the build framework. | (1) Plasmo's Parcel build tripped Smart App Control on Windows and required disabling SAC to build at all. (2) Chrome 137+ silently ignored `--load-extension` in our Plasmo + Playwright verification, blocking automated UI checks. (3) WXT ships a managed dev runner (`pnpm dev` opens Chrome with the extension preinstalled — no `--load-extension` flag), first-class shadow-root UI helper, typed `@wxt-dev/storage`, and Vite-based fast HMR. Same React + Tailwind code; only entrypoint conventions and storage helper change. |
| 2026-04-27 | First phase ships **no** real app integrations | De-risks UI/UX. Bar + Panel + Options is the foundation; apps plug in afterwards. |
| 2026-04-27 | Default bar position right-edge mid-viewport | Matches the user-supplied screenshot reference. |
| 2026-04-27 | No popup, no badge text | Bar is always-on; popup would be redundant. |
| 2026-04-27 | `storage` + `<all_urls>` only — no `tabs`, `cookies`, etc. | Minimum permissions = easier store reviews + user trust. |
| 2026-04-27 | Per-phase folder under `docs/phases/` | Lets each phase own its scope, plan, and verification without mutating cross-cutting docs. |
| 2026-04-28 | TODO Phase 01 splits into 01 (core) + 01b (chrome alarms / notifications / omnibox / recurring) | Keeps the first real-app install prompt small (only `contextMenus` added). Recurring + reminders need a recurrence engine + scheduling that warrant their own phase. |
| 2026-04-28 | Drop PLUS / Premium gating + glassmorphism panel surface from the source-app feature list | No business model yet — premium badges add noise. Glassmorphism violates `design.md` rule "Glimpse Panel surface is **always opaque**". |
| 2026-04-28 | Drop Focus Mode + Set as Daily Goal context-menu entries | Premium-flavoured noise in the source app; no clear utility for v1 of Glimpse TODO. |
| 2026-04-28 | Subtasks in TODO are **one level deep only** (no nesting) | Avoids the rabbit hole of nested-tree UX (collapse-all, drag-between-levels, breadcrumbs). |
| 2026-04-28 | TODO panel has **compact (360 px) + expanded (≈720 px) modes**; user toggles via maximize button | Compact preserves the always-on glance feel; expanded gives sidebar-driven navigation when the user explicitly asks for it. Falls back to compact if `vw < 720`. |
| 2026-04-28 | New permission to be added in TODO Step 9: `contextMenus` | Smallest possible Chrome integration that delivers a useful "Add selection as task" feature. Benign permission widely understood by users; confirmation entry will be added at Step 9 commit. |
| 2026-04-29 | `contextMenus` permission shipped + `action: {}` declared in manifest | Phase 01 Step 9 landed. Two context-menu items (`gb-add-selection`, `gb-add-page`) capture text/URL into Inbox via the background SW. `action: {}` is required so `chrome.action.setBadgeText` can show the today-incomplete count on the toolbar icon. Badge is recomputed on every `todosItem` change and on SW startup. Day-rollover at midnight may briefly show a stale count if no edits happen — accepted for v1 (proper rollover via `chrome.alarms` lands in Phase 01b). |
| 2026-05-02 | Phase 02 (GitHub PRs) planned: PAT auth only; **three tabs** (`Mine` / `Review` / `All`) in a segmented control; viewer header strip with `Change PAT`; date-grouped card list with author→reviewer avatar chains and color-coded review-state rings; auto-discovered repos with per-repo enable toggle in Options; permanent hide-until-unhidden; background-SW-owned fetch pipeline | PAT is the lowest-friction auth path that works without a backend; OAuth needs a redirect URL + secret rotation story we don't have. Three tabs (Mine / Review / All) match the user's reference screenshot and let the user see either workflow lane or the unified queue without leaving the panel; `All` is derived in selectors so it costs no extra API calls. Avatar chains with color-coded rings expose review state at a glance — denser than separate text chips. Auto-discovering repos avoids forcing the user to type `owner/repo` upfront. Permanent hide matches user mental model better than hide-until-update. Background-SW-owned fetch keeps the PAT off the host page and removes CORS as a worry. |
| 2026-05-02 | New permission to be added in Phase 02 Step 3: `alarms` | Required for `chrome.alarms.create('gh-sync', { periodInMinutes: N })` powering auto-refresh of the GitHub PR cache. Benign permission; documented at install. Confirmation entry will be added at Step 3 commit. |
| 2026-05-02 | Phase 02 transport switched from REST to **GraphQL v4** before any code lands | One snapshot query covers viewer + both queues + reviewers + CI rollup + mergeable state — replaces ~3N+1 REST round-trips with a single POST and exposes `reviewDecision` / `statusCheckRollup` / `mergeable` natively (no manual rollup). Same PAT/scopes work. Caveats baked into the plan: HTTP 200 on errors (inspect `errors[]`); `mergeable: UNKNOWN` requires a targeted re-fetch ~8 s later; `Authorization: bearer` not `token`; fine-grained PATs report no scopes. |
