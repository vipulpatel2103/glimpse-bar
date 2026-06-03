# Notes

> **Phase folder:** `docs/phases/03-notes/`
> **Status:** Active — fully planned (2026-06-03)
> **Framework:** WXT + React 18 + Tailwind v3 + `@wxt-dev/storage` + `marked` + `dompurify` (new runtime deps for Markdown rendering, lazy-loaded inside the editor)
> **Goal:** ship a Google-Keep-flavored notes app inside the Glimpse Panel. Markdown-based body, optional checklist mode, colored cards, labels, full-text search, and a quick-capture surface that doesn't require opening the full app.

---

## What you're building

1. **Compact mode (default, 360 px panel).** Single-column card list. Header: view dropdown + maximize + ⋯. Inline `+ Take a note…` composer at the top that expands on focus.
2. **Expanded mode (≈720 px panel).** Two-column card grid + 200 px sidebar (Pinned / All / Archived / + custom labels + `+ New Label`). Falls back to compact when `vw < 720`.
3. **Notes.** Title + Markdown body, optional checklist mode (mutually exclusive with body — Keep behavior), color, label chips, pin, archive. One-level deep — no nested notes / no notebooks.
4. **Markdown.** Body stored as raw Markdown. Editor has Edit ↔ View toggle. View mode renders sanitized HTML (`marked` → `DOMPurify` allowlist). Card grid previews via a cheap strip-markdown helper — `marked` does not load until the editor opens.
5. **Limits.** 100 notes total, 10 000 chars per body, 200 chars per title, 200 checklist items, 20 labels per note. Counter visible in editor; soft warn at 90 % body, banner in Options at 90 notes; hard cap rejects with toast.
6. **Quick capture.**
   - Right-click → `Add selection as note` / `Add page as note` — lands on the Notes app's `All` view (silent truncation to limits + toast on overflow).
   - Bar Shift-click on the Notes icon — opens a floating composer popover anchored next to the bar icon. Save on Enter, Cancel on Esc. Does not open the full panel.
7. **Search.** Header search input. Client-side substring match over title + body + checklist + label names. No fuzzy / no regex v1.
8. **Cross-tab sync** via `@wxt-dev/storage`'s `storage.watch` (already covered by `useStorageItem`).

That's it for Phase 03. Cross-device sync, images / attachments, WYSIWYG rich text, reminders, sharing, and code-block syntax highlighting are explicitly out of scope (see `scope.md`).

---

## Why this slice

- Notes is the second pure-local app, like TODO — no network, no auth, no third-party schema. Validates the same `app-renderer-inside-panel` pattern but pushes on a different shape (cards + free-form body vs. dense rows + dates).
- Markdown beats plain text without dragging in a WYSIWYG editor. `marked` + `DOMPurify` (~85 KB) ride along in the content-script bundle — WXT inlines content-script dynamic imports, so they can't be split out (see CLAUDE.md). The dynamic `import()` still defers their *init* to first editor render; the extra ~5–15 ms parse stays well under the 200 ms mount budget.
- Quick capture (right-click + bar Shift-click) is the smallest Chrome integration that delivers a "wow" beyond the panel itself. No new permissions — `contextMenus` shipped in Phase 01.
- Caps at 100 notes × 10 KB = 1 MB worst case keeps storage well under the 5 MB `chrome.storage.local` budget. No need for an IndexedDB migration or a storage gauge.

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

- [`../../requirements.md`](../../requirements.md) — system requirements (filter on `Phase: notes`).
- [`../../architecture.md`](../../architecture.md) — WXT entrypoints, shadow root UI, storage model, app registry.
- [`../../ui-design.md`](../../ui-design.md) — full visual token system.
- [`../../../design.md`](../../../design.md) — agent-friendly design summary. **Read before any UI step.**
- [`../../testing-plan.md`](../../testing-plan.md) — full QA surface (subset listed in `verification.md`).
- [`../../roadmap.md`](../../roadmap.md) — phase order + decision log (Jira → Notes pivot lands here).
- [`../03-jira/`](../03-jira/) — original Jira stub, deferred to roadmap parking lot.

---

## Carry-overs from earlier phases

The Notes phase **inherits** all conventions and primitives shipped in Phases 00–02.2:

- Shadow-root UI host (`<glimpse-ui>`) at `z-index: 2147483647`, re-applied on `wxt:locationchange`.
- `useStorageItem`, `useTheme`, `usePrefersReducedMotion` hooks.
- `App.tsx` panel orchestration, `GlimpsePanel.tsx` shell + dismissal (with `pinned` honored from TODO).
- Lucide icons, motion language (280–340 ms ease-out open / 180–220 ms ease-in close), opaque panel surface.
- Layout-viewport math (`document.documentElement.clientWidth/Height`, never `window.innerWidth`).
- `chrome.runtime.openOptionsPage` via background-SW message.
- Secure-context UUID fallback (`uid()` pattern) — content scripts on `http://` pages would otherwise throw on `crypto.randomUUID()`.
- `e.composedPath()` for outside-click handlers across the shadow boundary.
- `position: fixed` transform-compensation inside the panel (popovers anchored to row elements).
- `contextMenus` permission (already shipped in Phase 01 for TODO capture) — no new manifest entry.

Do **not** modify these primitives unless Notes genuinely requires it.
