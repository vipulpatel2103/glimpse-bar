# DESIGN.md — Glimpse Bar

> A living design-system reference for AI coding agents (Claude Code, Cursor, etc.) building inside this repo. Follows the [Stitch DESIGN.md format](https://getdesign.md/what-is-design-md). When a UI change is requested, **read this file first**, then [docs/ui-design.md](docs/ui-design.md) for token-level depth.

**Project:** Glimpse Bar — a transparent vertical icon rail injected on every web page (a WXT browser extension), with a slide-in panel surface (Glimpse Panel) and a configuration page (Glimpse Option Page).

---

## 1. Visual Theme & Atmosphere

**Mood:** quiet, dense, technical. The bar should feel like part of the browser chrome, not part of the host page. Friction-free presence — visible enough to grab when needed, invisible enough to ignore otherwise.

**Density:** compact. 36px tiles, 4-6px gutters. No filler; every pixel earns its place.

**Philosophy:**
- *Quiet by default.* No drop shadows on the bar that scream for attention; subtle elevation only.
- *Sharp icons, soft container.* The container (rail) is semi-transparent; the icons sit on opaque tiles so they remain readable on any background.
- *One motion language.* All transitions decelerate (ease-out emphasized) over 200–340ms. No bouncy springs, no overshoots.
- *Theme follows OS.* System dark/light by default with explicit override deferred to a later phase.
- *Accessibility first.* Every interaction works with keyboard alone; contrast is WCAG-AA in both themes.

**Inspiration:** Linear's command palette restraint, Apple's iOS 17 sidebar/inspector chrome, Notion's minimal toolbar. Anti-inspiration: anything resembling a Windows 95 toolbar.

---

## 2. Color Palette & Roles

> All colors below are the runtime constants used in shipped code (see `entrypoints/glimpse.content/components/`). Tailwind tokens are configured in `tailwind.config.js` under `theme.extend.colors.gb`.

### 2.1 Rail (Glimpse Bar background)

The bar rail is **always dark** in both themes (matches the screenshot reference). Transparency is user-controlled via the `--gb-alpha` value (0.15–1.0, default 0.6).

| Theme | RGBA |
|---|---|
| Light | `rgba(23, 23, 23, var(--gb-alpha))` |
| Dark  | `rgba(15, 15, 15, var(--gb-alpha))` |

Transparency clamp: never below 0.15 (panels under it must remain readable).

### 2.2 App-Icon Tiles (live inside the rail)

| Token | Light | Dark |
|---|---|---|
| `gb-tile`        | `rgba(255, 255, 255, 0.95)` | `rgba(255, 255, 255, 0.10)` |
| `gb-tile-border` | `rgba(0, 0, 0, 0.08)`       | `rgba(255, 255, 255, 0.14)` |
| `gb-icon`        | `#171717` (`neutral-900`)   | `#fafafa` (`neutral-50`) |
| `gb-tile-active` ring | `#3b82f6` (`blue-500`) | `#3b82f6` |
| `gb-grip` (drag dots) | `rgba(255, 255, 255, 0.55)` | `rgba(255, 255, 255, 0.55)` |

### 2.3 Glimpse Panel (surface)

**Always opaque** — never accept transparency on the panel surface itself.

| Token | Light | Dark |
|---|---|---|
| `gb-panel-bg`     | `#ffffff`            | `#0a0a0a` (`neutral-950`) |
| `gb-panel-border` | `rgba(0, 0, 0, 0.10)` | `rgba(255, 255, 255, 0.10)` |
| `gb-text`         | `#171717`            | `#fafafa` |
| `gb-text-muted`   | `#737373` (`neutral-500`) | `#a3a3a3` (`neutral-400`) |
| Header divider    | `rgba(0, 0, 0, 0.06)` | `rgba(255, 255, 255, 0.06)` |
| Hover surface     | `rgba(0, 0, 0, 0.04)` | `rgba(255, 255, 255, 0.06)` |

### 2.4 Glimpse Option Page

| Token | Light | Dark |
|---|---|---|
| Page background | `#ffffff` | `#0a0a0a` |
| Body text       | `#171717` | `#fafafa` |
| Section heading | `#737373` | `#a3a3a3` (uppercase, 13px, 600) |
| Slider accent   | `#3b82f6` (`accent-blue-500`) |

### 2.5 Semantic intent colors (reserved for later phases)

| Role | Color |
|---|---|
| Focus ring | `#3b82f6` (`blue-500`) — 2px solid, 1px offset, only on `:focus-visible` |
| Success    | `#22c55e` (`green-500`) — for future "saved" toasts |
| Warning    | `#f59e0b` (`amber-500`) — for future quota / connection warnings |
| Error      | `#ef4444` (`red-500`)   — for future API failures |

---

## 3. Typography Rules

**Stack:** `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. **No web font imports.** Browser extensions should not pull external fonts (privacy, performance, CSP risk).

| Element | Family | Size | Weight | Line height | Color token |
|---|---|---|---|---|---|
| Panel header title       | system-ui | 14px | 600 | 1.0 | `gb-text` |
| Panel body text          | system-ui | 13px | 400 | 1.5 | `gb-text` |
| Panel meta / secondary   | system-ui | 11px | 400 | 1.4 | `gb-text-muted` |
| Empty-state placeholder  | system-ui | 13px | 400 | 1.5 | `gb-text-muted` |
| Options page H1          | system-ui | 20px | 600 | 1.2 | `gb-text` |
| Options section heading  | system-ui | 13px | 600 | 1.2 | `gb-text-muted` (uppercase, tracking-wide) |
| Options form label       | system-ui | 14px | 500 | 1.4 | `gb-text` |
| Options help text        | system-ui | 12px | 400 | 1.4 | `gb-text-muted` |
| Tabular numbers (slider %) | system-ui | 14px | 400 | 1 | `gb-text-muted` (`tabular-nums`) |

**Letter-spacing:** default for everything except section headings (`tracking-wide`, ~0.05em).

**Forbidden:** italic, decorative fonts, all-caps body text, font sizes outside the table above without a documented reason in the PR description.

---

## 4. Component Stylings

> File-of-record paths in parentheses are the canonical implementations.

### 4.1 Glimpse Bar (`entrypoints/glimpse.content/components/GlimpseBar.tsx`)

```
┌────┐  ← rail width 44px, padding 4px h, 8px v
│::::│  drag handle  18–20px tall (2 rows × 4 dots, 3px circles)
│    │  6px gap
│ ⌾  │  TODO        36×36 round opaque tile, 18px Lucide icon
│ ⌾  │  Jira        (placeholder icon: ExternalLink)
│ ⌾  │  GitHub PRs  (Github icon)
│────│  1px hairline rgba(255,255,255,0.10), 6px margin
│ ⌾  │  Settings    (Settings icon — opens Glimpse Option Page)
└────┘
```

| Property | Value |
|---|---|
| Width | **44px** (constant; never resize per viewport) |
| Padding | 4px horizontal, 8px vertical |
| Inter-tile gap | 6px |
| Border-radius (snapped right) | `rounded-l-2xl` only |
| Border-radius (snapped left) | `rounded-r-2xl` only |
| Border-radius (mid-drag) | `rounded-2xl` (all corners) |
| Backdrop filter | `blur(10px) saturate(1.4)` |
| Border | 1px `rgba(255, 255, 255, 0.08)` |
| Shadow (idle)     | `0 4px 16px rgba(0, 0, 0, 0.18)` |
| Shadow (dragging) | `0 8px 24px rgba(0, 0, 0, 0.25)` (lift) |
| z-index | `2147483647` (max int — pin host element after `ui.mount()`) |

### 4.2 App Icon Tile (`AppIconButton.tsx`)

| State | Visual |
|---|---|
| Default | 36×36 `rounded-full`, theme tile bg, theme border, drop-shadow `0 1px 3px rgba(0,0,0,0.2)` |
| Hover   | `brightness-110` (CSS filter) |
| Pressed | `scale-[0.94]` |
| Active (panel open for this app) | `box-shadow: 0 0 0 2px #3b82f6, 0 1px 3px rgba(0,0,0,0.2)` |
| Focus-visible | 2px `#3b82f6` ring, 1px offset (offset color = `neutral-900` for contrast) |

Icon: 18px Lucide, stroke width **2.25** (slightly thicker than default 2 for crispness at small size), aria-hidden.

### 4.3 Drag Handle (`DragHandle.tsx`)

A 2 rows × 4 columns grid of 3px-diameter circles (`bg-white/55`), 3px gap. Hit-box: full bar width × 20px tall.
Cursor: `grab` idle, `grabbing` while pointer is captured.
**Only** the grip initiates drag — clicks on tiles must NOT.

### 4.4 Glimpse Panel (`GlimpsePanel.tsx`)

```
┌─────────────────────────────────────────────┐
│  [icon]  TODO                       [✕]      │  ← header h=44px
├─────────────────────────────────────────────┤
│                                              │
│         "TODO — content lands in              │
│          a later phase"                       │
│                                              │
└─────────────────────────────────────────────┘
        width 360px (clamped), height 100vh − 32px
```

| Property | Value |
|---|---|
| Width | 360px on viewports ≥ 800px, else `min(360, clientWidth − 80)` |
| Height | `100vh − 32px` (16px gap top + bottom) |
| Position | Anchored beside the bar — right-snapped → `right: 52px`; left-snapped → `left: 52px` (BAR_WIDTH 44 + GAP 4 + breathing 4) |
| Surface | **Always opaque** — no `--gb-alpha` here |
| Border-radius | 16px (`rounded-2xl`) |
| Shadow (light) | `0 16px 40px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.14)` |
| Shadow (dark)  | `0 16px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)` |
| Header height | 44px |
| Header padding | 12px horizontal |
| Header divider | 1px `rgba(0,0,0,0.06)` light / `rgba(255,255,255,0.06)` dark |
| z-index | `2147483647` |

**Header buttons** (close, future refresh / pin): 28×28 hit-box, 16px Lucide icon, hover surface fill, `:focus-visible` ring.

### 4.5 Glimpse Option Page (`entrypoints/options/main.tsx`)

| Element | Style |
|---|---|
| Page bg | `bg-white dark:bg-neutral-950` |
| Container | `max-w-2xl mx-auto p-6` |
| H1 | 20px / 600 |
| H2 (section) | 13px / 600 / uppercase / `tracking-wide` / muted |
| Form label | flex row `justify-between`, 14px / 500 + tabular value 14px / muted |
| Slider | native `<input type="range">`, full width to `max-w-md`, `accent-blue-500` |
| Help text | 12px muted, `mt-1` |
| Section divider | `<hr className="my-4 border-black/[0.08] dark:border-white/[0.08]">` |

---

## 5. Layout Principles

**Spacing scale:** Tailwind defaults — `1` (4px), `1.5` (6px), `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px). Avoid custom values unless documented.

**Bar position math:**
- Use `document.documentElement.clientWidth/Height` (layout viewport) — **never `window.innerWidth/Height`** (includes scrollbar on Windows Chrome).
- Snapped state: CSS `right: 0` / `left: 0` (auto-respects scrollbar).
- Mid-drag: absolute pixels via `translate3d(x, y, 0)` for GPU-accelerated motion.

**Panel position math:**
- Anchored beside the bar with a 4px gap.
- Panel width clamps to viewport width − 80px on small screens.

**Whitespace:** generous around the panel body (24px horizontal, 32px vertical for empty states). Tight inside the bar.

**Stacking context:**
- Shadow-root host: `z-index: 2147483647; position: fixed; inset: 0; pointer-events: none;` (set after `ui.mount()`).
- Bar + Panel: `z-index: 2147483647; pointer-events: auto;` inline (belt + braces).

**Layout grid:** none. Glimpse is a stack of fixed-position primitives, not a page layout.

---

## 6. Depth & Elevation

A 3-level shadow system. Don't invent new values; reuse these.

| Level | Use | Light shadow | Dark shadow |
|---|---|---|---|
| **0** Tile  | App icon tile | `0 1px 3px rgba(0,0,0,0.2)` | same |
| **1** Bar   | Glimpse Bar (idle) | `0 4px 16px rgba(0,0,0,0.18)` | `0 4px 16px rgba(0,0,0,0.18)` |
| **1.5** Bar (lifted) | Glimpse Bar mid-drag | `0 8px 24px rgba(0,0,0,0.25)` | same |
| **2** Panel | Glimpse Panel | `0 16px 40px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.14)` | `0 16px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)` |

**Backdrop-filter:** only the bar uses `blur(10px) saturate(1.4)` for the frosted-glass feel. The panel does **not** use backdrop-blur (it's opaque).

**No** inset shadows, no neumorphism, no glassmorphism on the panel.

---

## 7. Do's and Don'ts

### Do
- Render the **rail dark in both themes** so it stays visible against any host page background.
- Set `z-index: 2147483647` on the shadow-root host **after** `ui.mount()` (WXT's `position: 'overlay'` doesn't set one).
- Use `document.documentElement.clientWidth` for any "viewport edge" math — not `window.innerWidth`.
- Use CSS `right: 0` / `left: 0` for snapped bar positioning; only use `transform` while dragging.
- Use Lucide icons at 18px with `strokeWidth={2.25}` inside bar tiles, 16px with `strokeWidth={2}` in panel headers.
- Anchor panel scale animation with `transformOrigin: 'right center'` (or `'left center'`) so it unfolds **from** the bar.
- Open option page from content scripts by sending `{type: "openOptionsPage"}` to the background SW — never call `chrome.runtime.openOptionsPage()` from a content script.
- Use `@wxt-dev/storage`'s `defineItem(...).fallback` for defaults; never hardcode in components.
- Respect `prefers-reduced-motion: reduce` — drop slide AND scale animations to zero duration.
- Keep the panel surface **fully opaque** at all times.
- Persist position writes only on `pointerup` (snapped value), never during `pointermove`.

### Don't
- Don't make the panel translucent or animate its opacity. The bar's `--gb-alpha` does not apply here.
- Don't use `window.innerWidth/Height` — scrollbar inclusion will hide the bar partially under the scrollbar on Windows Chrome.
- Don't use inline `transform: translate3d(...)` for the snapped bar; use CSS `right: 0` / `left: 0`.
- Don't seed React state from a prop in `useState(prop)` if the prop is async-loaded (storage). Use a ref and read on demand.
- Don't add shadow / spring overshoot to motion. Use deterministic cubic-bezier curves only.
- Don't pull web fonts. Use system stack.
- Don't add new top-level Tailwind colors without updating §2 here.
- Don't request new Chrome permissions without recording it in `docs/roadmap.md` decision log.
- Don't render anything outside the shadow root — host-page CSS bleed-in will break us.
- Don't put marketing copy or emoji in any production string. English only.
- Don't add a popup, badge, or toolbar action — the bar is always-on, those are redundant.

---

## 8. Responsive Behavior

The bar is **fixed-size** (44px wide) regardless of viewport. The panel is the only piece that adapts.

| Viewport width | Bar | Panel |
|---|---|---|
| ≥ 800px | as spec'd | 360px |
| 400–799px | unchanged | clamps to `clientWidth − 80px` |
| < 400px | unchanged | covers most of the viewport; documented as "Glimpse Bar is designed for desktop" in Options |

**Touch targets:** all interactive elements ≥ 24px in their smallest dimension. Bar tiles are 36×36 (well above). Panel header buttons are 28×28 hit-box around 16px icons. Drag handle hit-box is 44×20.

**Keyboard navigation:**
- `Tab` enters the bar at the first icon.
- `ArrowUp` / `ArrowDown` cycles among bar icons.
- `Enter` / `Space` activates the focused icon.
- `Esc` closes the panel (always, in this phase — pinning lands with the TODO phase).

**Reduced motion:** `@media (prefers-reduced-motion: reduce)` — slide and scale durations drop to 0; bar drag is unaffected (it's a deliberate user action).

**No mobile/tablet support.** Browser extensions on mobile have wildly different APIs; out of scope.

---

## 9. Agent Prompt Guide

> Drop these into prompts when asking an agent (Claude Code, Cursor, etc.) to add or modify Glimpse UI.

### Quick color reference (copy-paste-friendly)

```
RAIL          rgba(23,23,23, alpha)  light  /  rgba(15,15,15, alpha)  dark
TILE          rgba(255,255,255,0.95) light  /  rgba(255,255,255,0.10) dark
TILE BORDER   rgba(0,0,0,0.08)       light  /  rgba(255,255,255,0.14) dark
ICON STROKE   #171717                light  /  #fafafa                dark
PANEL BG      #ffffff                light  /  #0a0a0a                dark
PANEL BORDER  rgba(0,0,0,0.10)       light  /  rgba(255,255,255,0.10) dark
TEXT          #171717                light  /  #fafafa                dark
TEXT MUTED    #737373                light  /  #a3a3a3                dark
ACCENT        #3b82f6 (blue-500) — focus ring, slider, active app ring
```

### Quick token reference (Tailwind)

- Rail bg: inline `backgroundColor: theme === 'dark' ? 'rgba(15,15,15,${alpha})' : 'rgba(23,23,23,${alpha})'`
- Tile: `bg-white dark:bg-white/10` + 1px theme border
- Panel: `bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50`
- Focus: `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1`
- Hover surface (panel): `hover:bg-black/[0.04] dark:hover:bg-white/[0.06]`

### Ready-to-use prompts

**Add a new app icon to the bar:**
> Add a `<NEW_APP>` entry to `lib/apps/registry.ts` between `github` and `settings`. Use the Lucide `<ICON_NAME>` icon. Renderer should be `() => null` for now (panel placeholder lives in [GlimpsePanel.tsx](entrypoints/glimpse.content/components/GlimpsePanel.tsx)). Don't change tile sizing, don't add new colors — reuse existing tokens from `design.md` §2.2 and §4.2.

**Add a new control to the Glimpse Option Page:**
> In [entrypoints/options/main.tsx](entrypoints/options/main.tsx), add a `<NEW_CONTROL_NAME>` field under the existing "Appearance" section. Storage item must be declared in [lib/storage.ts](lib/storage.ts) with `storage.defineItem<...>('local:gb-<key>', { fallback: ... })`. Read via the same `useStorageItem` hook pattern used by `transparencyItem`. Match the typography rules in `design.md` §3 (label 14px/500, help text 12px muted) and the form layout in §4.5.

**Add a new app renderer (TODO/Jira/GitHub) into the Glimpse Panel:**
> Replace the placeholder body in [GlimpsePanel.tsx](entrypoints/glimpse.content/components/GlimpsePanel.tsx) for the `<APP_ID>` app with a real renderer at `lib/apps/<id>/index.tsx`. Surface MUST be opaque (no `--gb-alpha`); reuse panel tokens from `design.md` §2.3. Use `useStorageItem` for any persisted state. Body padding 12px horizontal / 8px vertical, scrollable on overflow.

**Add a new motion / animation:**
> Use Framer Motion. Open animations: 280–340ms with cubic-bezier `[0.32, 0.72, 0, 1]` (emphasized ease-out). Close animations: 180–220ms with `[0.4, 0, 1, 1]` (ease-in). No springs, no bounces. Always check `usePrefersReducedMotion()` from [hooks/useTheme.ts](entrypoints/glimpse.content/hooks/useTheme.ts) and zero the duration when true.

**Audit a UI change for design-system compliance:**
> Review the diff against `design.md`. Flag any: (a) new color values not in §2, (b) new font sizes not in §3, (c) new shadow values not in §6, (d) use of `window.innerWidth/Height` (must use `documentElement.clientWidth/Height`), (e) shadow-root host without explicit `z-index: 2147483647`, (f) panel transparency, (g) `useState(propValue)` patterns where `propValue` is async-loaded.

---

## Update protocol

When you make a UI change that touches design tokens, update **both**:
1. This file (`design.md`) — for AI agents and quick reference.
2. [`docs/ui-design.md`](docs/ui-design.md) — for human deep-dives + cross-cutting system spec.

The two should never disagree. If they do, the shipped code wins; reconcile both docs to match.
