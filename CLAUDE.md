# CLAUDE.md

> Project-specific instructions for Claude Code. Read this first every session before touching code.
>
> Companion files: **[design.md](design.md)** for any UI change, **[docs/](docs/)** for system-wide spec.

---

## What this project is

**Glimpse Bar** — a browser extension that injects a transparent vertical icon rail (the *Glimpse Bar*) on every web page. Clicking an icon opens a slide-in side panel (the *Glimpse Panel*). A configuration page (the *Glimpse Option Page*) controls bar transparency.

**Stack:** [WXT](https://wxt.dev/) + React 18 + Tailwind v3 + `@wxt-dev/storage`. Targets Chrome / Edge / Firefox, MV3 (MV2 for Firefox).

**Status:** Phase 0 (Setup and UI/UX) shipping. No real apps yet — TODO / Jira / GitHub PRs are stubs that open empty panels. Settings is the only icon doing real work.

## Glossary — use these terms exactly

| Term | Meaning |
|---|---|
| **Glimpse Bar** | The transparent vertical icon rail. |
| **Glimpse Panel** | The slide-in panel beside the bar. |
| **Glimpse Option Page** | The extension's options page (a WXT options entrypoint). |
| **Glimpse UI host** | The `<glimpse-ui>` custom element + shadow root, created by `createShadowRootUi`. |

If a doc, commit, or PR uses different naming ("sidebar", "popout", "settings page"), it's wrong — fix it.

---

## Active phase

[`docs/phases/00-setup-and-ui-ux/`](docs/phases/00-setup-and-ui-ux/) — fully planned. Read [`plan.md`](docs/phases/00-setup-and-ui-ux/plan.md) and [`scope.md`](docs/phases/00-setup-and-ui-ux/scope.md) before starting work.

Future phases are stubs only — **do not** plan or implement them ahead:
- [`phases/01-todo/`](docs/phases/01-todo/) — local TODO list
- [`phases/02-github-prs/`](docs/phases/02-github-prs/) — GitHub PR queue
- [`phases/03-jira/`](docs/phases/03-jira/) — Jira issues

---

## Commands

```bash
pnpm install      # also runs `wxt prepare` via postinstall — generates .wxt/
pnpm dev          # WXT runner: opens managed Chrome with extension preinstalled + HMR
pnpm dev:firefox  # Firefox runner
pnpm compile      # tsc --noEmit (typecheck only)
pnpm build        # → .output/chrome-mv3/
pnpm build:edge   # → .output/edge-mv3/
pnpm build:firefox # → .output/firefox-mv2/
pnpm zip          # store-ready zips in .output/
```

After any non-trivial change: **`pnpm compile && pnpm build`**. Both must pass before claiming done.

To load the prod build manually: `chrome://extensions` → Developer mode ON → Load unpacked → `.output/chrome-mv3/`.

---

## Project structure (WXT conventions)

```
entrypoints/
├── background.ts                       defineBackground() — service worker
├── glimpse.content/                    content script (folder = entrypoint)
│   ├── index.tsx                       defineContentScript + createShadowRootUi
│   ├── App.tsx                         <GlimpseBar/> + <GlimpsePanel/>
│   ├── style.css                       @tailwind directives (scoped to shadow root)
│   ├── components/                     GlimpseBar, GlimpsePanel, AppIconButton, DragHandle
│   └── hooks/                          useDrag, useTheme, useStorageItem
└── options/                            Glimpse Option Page (HTML entrypoint)
    ├── index.html
    ├── main.tsx
    └── style.css

lib/
├── storage.ts                          typed storage.defineItem(...) declarations
└── apps/                               app registry (todo, jira, github, settings)

assets/icon.png                         512×512 source — @wxt-dev/auto-icons emits 16/32/48/128
wxt.config.ts                           modules + manifest
```

WXT is **convention-driven** — filenames decide the manifest. Don't fight it; rename files instead of writing config overrides.

---

## Documentation map

| Doc | When to read |
|---|---|
| **[design.md](design.md)** | **Before any UI change.** Stitch-format design-system spec — color tokens, typography, components, motion rules, do's and don'ts, prompt cheatsheet. |
| [docs/requirements.md](docs/requirements.md) | When clarifying scope or AC. FRs are tagged by phase. |
| [docs/architecture.md](docs/architecture.md) | When changing storage, entrypoints, manifest, or build targets. |
| [docs/ui-design.md](docs/ui-design.md) | Human-deep-dive on visual tokens (design.md is the agent-friendly summary). |
| [docs/testing-plan.md](docs/testing-plan.md) | Before tagging a release. Hard-case sites are listed there. |
| [docs/roadmap.md](docs/roadmap.md) | Decision log + phase order + anti-goals. |
| [docs/phases/00-setup-and-ui-ux/](docs/phases/00-setup-and-ui-ux/) | Active phase: scope, plan, ui-spec, verification. |
| [docs/wxt_dev_guide.md](docs/wxt_dev_guide.md) + [wxt_dev_llms.md](docs/wxt_dev_llms.md) + [wxt_dev_llms2.md](docs/wxt_dev_llms2.md) | Cached WXT framework docs. **Search these before web-fetching.** |

**Update protocol when you change tokens:** keep `design.md` and `docs/ui-design.md` in sync; the shipped code wins on conflict.

---

## Critical conventions (we learned these the hard way)

### Viewport math — never use `window.innerWidth/Height`

`window.innerWidth` **includes** the page scrollbar on Windows Chrome. Using it for bar position puts the bar's right edge under the scrollbar.

```ts
// ✅ correct — layout viewport, excludes scrollbar
const vw = document.documentElement.clientWidth
const vh = document.documentElement.clientHeight

// ❌ wrong — bar partially hidden behind scrollbar
const vw = window.innerWidth
```

### Bar position — CSS edges for snapped, transform for drag

```ts
// ✅ snapped: let CSS handle it (auto-respects scrollbar)
edge === 'right' ? { right: 0, top: y } : { left: 0, top: y }

// ✅ dragging: GPU-accelerated transform
{ left: 0, top: 0, transform: `translate3d(${x}px, ${y}px, 0)` }
```

### Shadow-root z-index — pin to max int after mount

WXT's `createShadowRootUi({ position: 'overlay' })` doesn't set z-index. Without this, page UIs (Notion, ChatGPT, dashboards) paint over the bar.

```ts
ui.mount()
const host = document.querySelector('glimpse-ui') as HTMLElement
host.style.zIndex = '2147483647'
host.style.position = 'fixed'
host.style.inset = '0'
host.style.pointerEvents = 'none'
```

Re-apply after `wxt:locationchange` for SPA-resilient sites (ChatGPT replaces `document.body`).

### Open the options page from a content script

`chrome.runtime.openOptionsPage()` is **not reliable from a content script**. Send a message to the background SW; it calls `openOptionsPage()`.

```ts
// content script
chrome.runtime.sendMessage({ type: 'openOptionsPage' })

// entrypoints/background.ts
chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  if (msg?.type === 'openOptionsPage') {
    chrome.runtime.openOptionsPage(() => sendResponse({ ok: true }))
    return true
  }
  return false
})
```

### Don't seed React state from an async-loaded prop

`@wxt-dev/storage`'s `useStorageItem` returns the `fallback` synchronously, then re-renders with the real value a tick later. `useState(prop)` ignores that update.

```ts
// ❌ broken — seed locks in fallback, ignores later prop change
const [pos, setPos] = useState(initial)

// ✅ correct — read canonical prop on demand via ref; useState only for live drag
const positionRef = useRef(position)
positionRef.current = position
const start = positionRef.current  // always fresh
```

### Glimpse Panel surface is **always opaque**

The bar's `--gb-alpha` does not propagate to the panel. Panel uses solid `#ffffff` (light) or `#0a0a0a` (dark). Don't animate the panel's `opacity`. Slide + scale only.

### Motion language — deterministic curves only

| Direction | Duration | Cubic-bezier |
|---|---|---|
| Open / enter | 280–340ms | `[0.32, 0.72, 0, 1]` (emphasized ease-out) |
| Close / exit | 180–220ms | `[0.4, 0, 1, 1]` (ease-in) |

No springs, no overshoots, no bounces. Always honor `prefers-reduced-motion: reduce` (durations → 0).

### Icons — Lucide React

- Bar tile: `size={18} strokeWidth={2.25}`
- Panel header / Option Page: `size={16} strokeWidth={2}`
- Drag grip: 2 rows × 4 cols of 3px circles (NOT a Lucide icon — looks like `::::`)

---

## Don't do this

- ❌ Add a popup, badge, or toolbar action — bar is always-on; those are redundant.
- ❌ Use `chrome.sidePanel` API — we use a CSUI overlay for cross-browser parity.
- ❌ Pull web fonts. System stack only (privacy, perf, CSP).
- ❌ Add new permissions without recording the rationale in [docs/roadmap.md](docs/roadmap.md) decision log.
- ❌ Use `--no-verify`, `--force`, or skip pre-commit hooks unless the user explicitly asks.
- ❌ Write component CSS outside Tailwind utilities + the few inline `style={...}` cases for runtime values (transparency, position).
- ❌ Animate the panel's opacity. Slide + scale only.
- ❌ Add features for future phases. Stay strictly within the active phase scope.
- ❌ Add Vitest / Playwright / any test framework yet — testing arrives in a later phase.
- ❌ Add i18n, analytics, or telemetry. Not planned.
- ❌ Bypass `design.md` — every UI change MUST be auditable against it.

---

## Working agreement

1. **Read [design.md](design.md) first** for any UI change. It's the contract.
2. **Read the active phase folder** for any scope question — [docs/phases/00-setup-and-ui-ux/](docs/phases/00-setup-and-ui-ux/).
3. **Verify before claiming done:** `pnpm compile && pnpm build` must both succeed. Smoke-test the change manually in the loaded extension on at least one site.
4. **Don't expand scope.** If you spot something out of scope, mention it in your reply, don't fix it.
5. **Cross-cutting docs are the truth.** When code drifts, fix the code; when docs drift, fix the docs. Don't let the gap widen silently.
6. **Hard-won lessons live in this file.** If you fix a bug whose root cause was non-obvious, add it to "Critical conventions" above so future-you doesn't re-step on it.

---

## Environment notes

- **Windows 11 + McAfee + Smart App Control:** The user disabled SAC to allow unsigned native modules to load (sharp, fs-search). Don't suggest re-enabling SAC — it's a one-way change requiring Windows reinstall.
- **Pinned pnpm overrides:** `package.json` has a `pnpm.onlyBuiltDependencies` allowlist for the WXT/Vite native binaries. Don't remove it.
- **Default branch:** `main`.
- **Today's date:** 2026-04-28. Convert any relative dates to absolute when documenting decisions.
