# GitHub PRs

> **Phase folder:** `docs/phases/02-github-prs/`
> **Status:** Active — fully planned (2026-05-02)
> **Framework:** WXT + React 18 + Tailwind v3 + `@wxt-dev/storage` (no new runtime deps; native `fetch` against the GitHub **GraphQL v4** API)
> **Goal:** make the GitHub icon do real work. Show the user's open PRs — both authored and review-requested — inside the Glimpse Panel, with rich status (CI, review decision, conflicts, comments, approvers, branch, age, failing checks).

---

## What you're building

1. **Viewer header strip.** Top of the panel shows the connected GitHub user's avatar + `@login`, plus a `Change PAT` affordance that deep-links into the Options page section.
2. **Three tabs (segmented control, top-right):** `Mine` (PRs the viewer opened), `Review` (PRs awaiting the viewer's review), `All` (union, deduped). Default tab is `Review`.
3. **Date-grouped PR list.** Rows grouped under sticky day headers (e.g. `Mon Apr 20 2026`) keyed by `updatedAt` — same pattern as TODO's Upcoming view.
4. **PR card rows** (per screenshot):
   - Prominent title (truncated). PR number prefixed (`#1234`) at small caption size.
   - Author avatar `→` reviewer avatars chain. Each avatar is a round chip with initials + colored ring per the reviewer's latest review state: **green** = approved, **amber** = changes requested, **red** = dismissed/rejected, **neutral** = pending / no review yet. Hover tooltip shows full `@login`.
   - Right column: a single status pill (`Approved` / `Changes requested` / `Conflicts` / `Draft` / `Review required`) + a round overall-state icon (✓ ready, 🕒 pending, ⊖ neutral, ✕ failure).
   - Bottom-right: comment count + `MessageSquare` icon.
   - Card click → opens PR URL in new tab.
5. **Background sync.** Service worker owns all GitHub API calls (GraphQL v4 — one POST per sync covers viewer + both queues + reviewers + CI rollup + mergeable state), and talks to content/options scripts via `chrome.runtime.sendMessage`. Centralises PAT handling, avoids host-page CORS, lets the panel render cached data while offline.
6. **Auto-refresh** via `chrome.alarms` (configurable: 1 / 5 / 15 / 30 / 60 min, default 5). Manual refresh button (↻) in the header next to the `Nm ago` indicator.
7. **PAT-based auth.** Personal Access Token entered in Glimpse Option Page → "Test connection" → "Save & sync" → "Change PAT" / "Disconnect". OAuth and other providers (Bitbucket, GitLab, Azure) deferred.
8. **Per-repo enable/disable.** Repos auto-discovered from query results; user toggles each on/off in Options. Disabled repos filtered client-side.
9. **Hide PR.** Permanent hide until unhidden. Hidden PRs surface in a `Hidden` view in the expanded sidebar.
10. **Open in GitHub.** Click a row → opens the PR URL in a new tab. Context menu also exposes `Copy PR link` and `Copy branch name`.
11. **Compact (360 px)** = viewer header + tabs + grouped list. **Expanded (≈720 px)** = sidebar (Mine / Review / All / Hidden / per-repo).
12. **Rate-limit handling.** Respect `X-RateLimit-Remaining`; surface `Rate-limited · resets in Nm` in the header. Don't auto-retry storms.

That's it for Phase 02. **Out of scope:** writing actions (approve / request changes / comment / merge), GitHub Issues / Discussions / Actions, multi-account, OAuth, Bitbucket / GitLab / Azure.

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

- [`../../requirements.md`](../../requirements.md) — system requirements (filter on `Phase: github`).
- [`../../architecture.md`](../../architecture.md) — WXT entrypoints, shadow root UI, storage model, app registry.
- [`../../ui-design.md`](../../ui-design.md) — full visual token system.
- [`../../../design.md`](../../../design.md) — agent-friendly design summary. **Read before any UI step.**
- [`../../testing-plan.md`](../../testing-plan.md) — full QA surface (subset listed in `verification.md`).
- [`../../roadmap.md`](../../roadmap.md) — phase order + decision log (`alarms` permission rationale lands here).

---

## Carry-overs from earlier phases

Phase 02 **inherits** everything shipped in Phases 00 and 01:

- Shadow-root UI host (`<glimpse-ui>`) at `z-index: 2147483647`, re-applied on `wxt:locationchange`.
- `useStorageItem`, `useTheme`, `usePrefersReducedMotion` hooks.
- `App.tsx` panel orchestration, `GlimpsePanel.tsx` shell + dismissal (composedPath outside-click, transformed-ancestor offset compensation).
- Lucide icons, motion language (280–340 ms ease-out open / 180–220 ms ease-in close), opaque panel surface.
- Layout-viewport math (`document.documentElement.clientWidth/Height`, never `window.innerWidth`).
- `chrome.runtime.openOptionsPage` via background-SW message.
- TodoApp's pattern for tabs / sidebar / context menu / list-row / popover portal — the GitHub PR app mirrors this shape.

Do **not** modify these primitives unless Phase 02 genuinely requires it.
