# Roadmap

> **Doc owner:** glimpse-bar
> **Status:** Draft (2026-04-27)
> **Audience:** product + engineering. Order in which features land. Each phase has its own folder under `docs/phases/` once it's planned in detail.

---

## Phase Order (top-level)

| Order | Phase folder | Status | One-liner |
|---|---|---|---|
| 1 | [`phases/00-setup-and-ui-ux/`](phases/00-setup-and-ui-ux/) | Shipped (2026-04-28) | Bar + Panel + Option Page scaffolding. Drag, transparency, theme. No real app integrations; clicking an app icon opens an empty Glimpse Panel. |
| 2 | [`phases/01-todo/`](phases/01-todo/) | **Active — planned (2026-04-28)** | Local TODO list as the first real app. Compact + expanded modes, views (Today / Upcoming / Inbox / Completed + custom lists), dates, subtasks, right-click capture, badge counter. Recurring/reminders/notifications/omnibox split into Phase 01b. |
| 3 | [`phases/02-github-prs/`](phases/02-github-prs/) | Stub — not yet planned | GitHub PR review queue. PAT first, OAuth later. |
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
