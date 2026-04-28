# TODO

> **Phase folder:** `docs/phases/01-todo/`
> **Status:** Active — fully planned (2026-04-28)
> **Framework:** WXT + React 18 + Tailwind v3 + `@wxt-dev/storage` (no new runtime deps)
> **Goal:** make the TODO icon do real work. Local-first task manager rendered inside the Glimpse Panel — quick, dense, keyboard-friendly, dual-mode (compact 360 px / expanded 720 px).

---

## What you're building

1. **Compact mode (default).** The Glimpse Panel keeps its 360 px width and renders a single-column TODO view with a header dropdown to switch between system views (Today / Upcoming / Inbox / Completed) plus any custom lists.
2. **Expanded mode.** A maximize button on the panel header animates the panel to ≈720 px, revealing a 200 px sidebar (Today / Upcoming / Inbox / Completed / + New List). Falls back to compact when `vw < 720`.
3. **System views.**
   - **Today** — tasks `dueAt ≤ end-of-today` and incomplete (display-time rollover for overdue).
   - **Upcoming** — next 7 days, grouped by day header.
   - **Inbox** — `dueAt == null`, default list.
   - **Completed** — done tasks, capped per list config.
4. **Custom lists.** Sidebar `+ New List`, rename, delete (drops items into Inbox; Inbox itself never deletable). Drop the source app's PLUS gating — no business model.
5. **Tasks.** Add (inline `+ New task` Enter to commit), edit inline, toggle done (strikethrough + dim), delete, duplicate, one level of subtasks, hover quick-actions, right-click context menu.
6. **Dates.** Quick chips (`Today` / `Tomorrow` / `This Weekend` / `Next Week` / `Pick date…`). Native date input under the hood (no date library). Day chip + tooltip on rows. Auto-rollover via display-time selector.
7. **Per-list config.** Sort (Manual / Date / Alpha), New-task position (Top / Bottom), Show completed (Never / Today / 30d / Always), Pin panel (disables outside-click close).
8. **Chrome integrations.** `chrome.contextMenus` — right-click selected text or page → Add as task. `chrome.action.setBadgeText` — count of incomplete tasks scheduled for today.
9. **Cross-tab sync** via `@wxt-dev/storage`'s `storage.watch` (already covered by our `useStorageItem` hook).

That's it for Phase 01. Recurring tasks, reminders, desktop notifications, and omnibox quick-add land in **Phase 01b** — they need new permissions (`alarms`, `notifications`, `commands`) that warrant their own phase.

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

- [`../../requirements.md`](../../requirements.md) — system requirements (filter on `Phase: todo`).
- [`../../architecture.md`](../../architecture.md) — WXT entrypoints, shadow root UI, storage model, app registry.
- [`../../ui-design.md`](../../ui-design.md) — full visual token system.
- [`../../../design.md`](../../../design.md) — agent-friendly design summary. **Read before any UI step.**
- [`../../testing-plan.md`](../../testing-plan.md) — full QA surface (subset listed in `verification.md`).
- [`../../roadmap.md`](../../roadmap.md) — phase order + decision log (new `contextMenus` permission rationale lands here).

---

## Carry-overs from Phase 00

The TODO phase **inherits** all conventions and primitives shipped in Phase 00:

- Shadow-root UI host (`<glimpse-ui>`) at `z-index: 2147483647`, re-applied on `wxt:locationchange`.
- `useStorageItem`, `useTheme`, `usePrefersReducedMotion` hooks.
- `App.tsx` panel orchestration, `GlimpsePanel.tsx` shell + dismissal.
- Lucide icons, motion language (280–340 ms ease-out open / 180–220 ms ease-in close), opaque panel surface.
- Layout-viewport math (`document.documentElement.clientWidth/Height`, never `window.innerWidth`).
- `chrome.runtime.openOptionsPage` via background-SW message.

Do **not** modify these primitives unless TODO genuinely requires it (e.g., outside-click handler must learn about the `pinned` flag).
