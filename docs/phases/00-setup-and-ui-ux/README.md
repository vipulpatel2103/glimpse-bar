# Setup and UI/UX

> **Phase folder:** `docs/phases/00-setup-and-ui-ux/`
> **Status:** Shipped (2026-04-28)
> **Framework:** [WXT](https://wxt.dev/) + React 18 + Tailwind v3 + `@wxt-dev/storage`
> **Goal:** ship the bar + panel + option page foundation. No real app integrations. Clicking an app icon opens a Glimpse Panel with an empty body. This phase exists to nail the UI/UX before any feature work.

---

## What you're building

1. A working WXT + React + Tailwind extension that loads in Chrome (Edge + Firefox builds expected to follow easily).
2. A transparent vertical **Glimpse Bar** rendered on every web page via a WXT content script using `createShadowRootUi`.
3. The bar shows **4 clickable icons**: TODO, Jira, GitHub PRs, Settings (in that order, with Settings visually separated).
4. Drag-and-drop along X and Y, with a 6-dot grip indicator at the top, snapping to nearest edge on release. Position persists.
5. A **Glimpse Panel** that slides in/out smoothly when a non-Settings icon is clicked. Body is empty (placeholder). Closes via ESC, outside click, or close button.
6. The Settings icon opens the **Glimpse Option Page** (a WXT options entrypoint).
7. Glimpse Option Page exposes one control: a **transparency slider**. Changing it updates the bar live.
8. Light + dark theme follow OS. (Theme picker in options is deferred until the next phase, as is per-app enable/disable.)

That's it. No TODO list, no Jira, no GitHub fetch. The point is: a beautiful, smooth, drag-anywhere bar with a working panel shell.

---

## Files in this folder

| File | Purpose |
|---|---|
| [`README.md`](README.md) | This page. |
| [`scope.md`](scope.md) | What's in / what's out / why. |
| [`plan.md`](plan.md) | Step-by-step build order with exit criteria per step. |
| [`ui-spec.md`](ui-spec.md) | Phase-scoped subset of the system [`ui-design.md`](../../ui-design.md). |
| [`verification.md`](verification.md) | Acceptance criteria + manual QA script for this phase. |

---

## Cross-cutting references

- [`../../requirements.md`](../../requirements.md) — system requirements (filter on `Phase: setup`).
- [`../../architecture.md`](../../architecture.md) — WXT entrypoints, shadow root UI, storage model.
- [`../../ui-design.md`](../../ui-design.md) — full visual token system.
- [`../../testing-plan.md`](../../testing-plan.md) — full QA surface (subset listed in `verification.md`).
- [`../../roadmap.md`](../../roadmap.md) — phase order + decision log.

---

## WXT-specific resources

The `docs/` folder ships these reference snapshots (do not edit; refresh from upstream when WXT majors change):
- [`../../wxt_dev_guide.md`](../../wxt_dev_guide.md) — official guide subset (installation, content scripts, options).
- [`../../wxt_dev_llms.md`](../../wxt_dev_llms.md) — context7-fetched LLM-friendly docs, set 1.
- [`../../wxt_dev_llms2.md`](../../wxt_dev_llms2.md) — context7-fetched LLM-friendly docs, set 2.

When in doubt about a WXT API, search those three files first before web-fetching.
