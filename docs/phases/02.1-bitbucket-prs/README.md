# Bitbucket PRs

> **Phase folder:** `docs/phases/02.1-bitbucket-prs/`
> **Status:** Active — fully planned (2026-05-06)
> **Framework:** WXT + React 18 + Tailwind v3 + `@wxt-dev/storage` (no new runtime deps; native `fetch` against the Bitbucket Cloud **REST 2.0** API)
> **Goal:** add Bitbucket Cloud as a second PR provider. Same panel UX, viewer header, three tabs, date-grouped cards, hide/unhide, sidebar, and background sync as Phase 02 — but driven by the Bitbucket Cloud REST 2.0 API and `Workspace + Username + Token` auth.

---

## What you're building

1. **Viewer header strip.** Same shape as the GitHub viewer header — viewer's avatar (28 px) + `@username` + `Change credentials` link that deep-links into the Options page section.
2. **Three tabs (segmented control, top-right):** `Mine` (PRs the viewer authored), `Review` (PRs awaiting the viewer's review), `All` (union, deduped). Default tab is `Review`.
3. **Date-grouped PR list.** Same sticky `Mon Apr 20 2026` headings keyed by `updatedAt` day.
4. **PR card rows.** Same anatomy as GitHub:
   - `#ID` prefix + truncated title on the top line.
   - Author avatar `→` reviewer avatars chain. Each reviewer chip carries a colored ring per latest review state: **green** = approved, **amber** = changes requested / `needs_work`, **blue** = commented, **neutral** = pending. (Bitbucket has no `dismissed` review state — that ring color goes unused here.)
   - Right column: status pill (`Approved` / `Changes requested` / `Draft` / `Review required`) + 24 px round overall-state icon (✓ ready / ✕ failed / 🕒 pending / − neutral). **No `Conflicts` pill in v0** — Bitbucket's REST 2.0 PR list response doesn't expose mergeability cheaply.
   - Bottom-right: comment count + `MessageSquare` icon.
   - Card click → opens PR URL (`pr.links.html.href`) in new tab.
5. **Background sync.** Service worker owns all Bitbucket API calls. Single sync runs:
   - 1 × `GET /2.0/user` (viewer)
   - 1 × `GET /2.0/pullrequests/{accountId}?state=OPEN` (mine, cross-workspace)
   - N × `GET /2.0/repositories/{ws}/{repo}/pullrequests?q=state="OPEN" AND reviewers.account_id="{me}"` (review-requested, per enabled repo)
   - M × `GET /2.0/repositories/{ws}/{repo}/pullrequests/{id}/statuses` (CI rollup, only for PRs surfaced this sync), concurrency cap 5

   Content/options scripts never touch `api.bitbucket.org` directly.
6. **Auto-refresh** via `chrome.alarms` (`bb-sync` alarm). Configurable: 1 / 5 / 15 / 30 / 60 min, default 5. Manual refresh button (↻) in the header next to the `Nm ago` indicator.
7. **`Workspace + Email + API Token` auth.** Scoped Atlassian API token entered in the Glimpse Option Page → "Test connection" → "Save & sync" → "Change credentials" / "Disconnect". Sent as `Authorization: Basic base64(email:api_token)`. App Passwords retired by Atlassian 2025-09-09; OAuth + Bitbucket Server / Data Center deferred.
8. **Workspaces are explicit opt-in.** Sync discovers workspaces the user belongs to via `GET /2.0/user/permissions/workspaces`, but every workspace starts **disabled**. The user ticks workspaces (and per-workspace repos) in Options before any review-queue fetch happens. Mine query is also gated to enabled workspaces (filtered client-side).
9. **Per-repo enable/disable.** Repos auto-discovered from query results within enabled workspaces; user toggles each on/off in Options. Disabled repos skipped at fetch time and filtered client-side.
10. **Hide PR.** Permanent hide until unhidden. Hidden PRs surface in a `Hidden` view in the expanded sidebar.
11. **Open in Bitbucket.** Click a row → opens `pr.links.html.href` in a new tab. Context menu also exposes `Copy PR link` and `Copy branch name`.
12. **Compact (360 px)** = viewer header + tabs + grouped list. **Expanded (≈720 px)** = sidebar grouped by workspace, with `Mine` / `Review` / `All` / `Hidden` system rows on top.
13. **Rate-limit handling.** Respect `X-RateLimit-Remaining` / `X-RateLimit-Reset`; surface `Rate-limited · resets in Nm` in the header. Don't auto-retry storms.

That's it for Phase 02.1. **Out of scope:** writing actions (approve / request changes / comment / merge), Bitbucket Issues / Pipelines runs / branch restrictions, multi-account, OAuth, **Bitbucket Server / Data Center**, GitLab, Azure DevOps.

---

## Files in this folder

| File | Purpose |
|---|---|
| [`README.md`](README.md) | This page. |
| [`scope.md`](scope.md) | What's in / what's out / why. |
| [`plan.md`](plan.md) | Step-by-step build order with exit criteria per step. |
| [`ui-spec.md`](ui-spec.md) | Phase-scoped UI subset of [`../../ui-design.md`](../../ui-design.md) and [`../../../design.md`](../../../design.md). |
| [`verification.md`](verification.md) | Acceptance criteria + manual QA script for this phase. |

---

## Cross-cutting references

- [`../../requirements.md`](../../requirements.md) — system requirements (filter on `Phase: bitbucket`).
- [`../../architecture.md`](../../architecture.md) — WXT entrypoints, shadow root UI, storage model, app registry.
- [`../../ui-design.md`](../../ui-design.md) — full visual token system.
- [`../../../design.md`](../../../design.md) — agent-friendly design summary. **Read before any UI step.**
- [`../../testing-plan.md`](../../testing-plan.md) — full QA surface (subset listed in `verification.md`).
- [`../../roadmap.md`](../../roadmap.md) — phase order + decision log (Bitbucket Cloud-only + opt-in-workspaces rationale lands here).
- [`../02-github-prs/`](../02-github-prs/) — sister phase. Most components mirror it 1:1 — read `02-github-prs/plan.md` and `ui-spec.md` for any pattern not re-stated here.

---

## Carry-overs from earlier phases

Phase 02.1 **inherits** everything shipped in Phases 00 / 01 / 02:

- Shadow-root UI host (`<glimpse-ui>`) at `z-index: 2147483647`, re-applied on `wxt:locationchange`.
- `useStorageItem`, `useTheme`, `usePrefersReducedMotion` hooks.
- `App.tsx` panel orchestration, `GlimpsePanel.tsx` shell + dismissal (composedPath outside-click, transformed-ancestor offset compensation).
- Lucide icons, motion language (280–340 ms ease-out open / 180–220 ms ease-in close), opaque panel surface, layout-viewport math.
- `chrome.runtime.openOptionsPage` via background-SW message (with `hash` parameter; new value: `bitbucket`).
- `chrome.alarms` permission (already declared in Phase 02 — no new permission this phase).
- All visual tokens, status pill primitive, AvatarChip primitive, day-heading sticky pattern, segmented-control + framer-motion `layoutId` thumb. Mirror these — **don't fork** them.
- App registry pattern (`lib/apps/registry.ts`, `AppDefinition`); the bar / panel orchestration in `App.tsx`.

Do **not** modify these primitives unless Phase 02.1 genuinely requires it.
