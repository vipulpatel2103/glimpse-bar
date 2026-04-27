# Roadmap

> **Doc owner:** glimpse-bar
> **Status:** Draft (2026-04-27)
> **Audience:** product + engineering. Order in which features land. Each phase has its own folder under `docs/phases/` once it's planned in detail.

---

## Phase Order (top-level)

| Order | Phase folder | Status | One-liner |
|---|---|---|---|
| 1 | [`phases/00-setup-and-ui-ux/`](phases/00-setup-and-ui-ux/) | **Active — planned** | Bar + Panel + Option Page scaffolding. Drag, transparency, theme. No real app integrations; clicking an app icon opens an empty Glimpse Panel. |
| 2 | [`phases/01-todo/`](phases/01-todo/) | Stub — not yet planned | Local TODO list as the first real app. CRUD, persistence, cross-tab sync. |
| 3 | [`phases/02-github-prs/`](phases/02-github-prs/) | Stub — not yet planned | GitHub PR review queue. PAT first, OAuth later. |
| 4 | [`phases/03-jira/`](phases/03-jira/) | Stub — not yet planned | Jira assigned-to-me issues. API token first, OAuth later. |
| later | (TBD) | — | Calendar, Gmail glance, Linear, command palette, AI summaries. |

> **Rule:** Don't plan phase N+1 in detail until phase N has shipped and we've learned from it. Each phase's folder gets fully spec'd just before it starts.

---

## What's Planned in Detail Today

Only the **Setup and UI/UX** phase. See [`phases/00-setup-and-ui-ux/`](phases/00-setup-and-ui-ux/) for:
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
