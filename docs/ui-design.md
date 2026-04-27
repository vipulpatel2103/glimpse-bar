# UI Design

> **Doc owner:** glimpse-bar
> **Status:** Draft (2026-04-27)
> **Audience:** designers + frontend engineers. Token-level spec for Glimpse Bar, Glimpse Panel, Glimpse Option Page.
> **Scope:** describes the **complete target visual system**. Per-phase scope (which sections apply now) is captured in each phase folder's `ui-spec.md`.
> **Visual reference:** the user's screenshot of a vertical icon column with white-tile / dark-icon styling, and the welcome demo at `https://manganum.fra1.cdn.digitaloceanspaces.com/assets/Welcome.mp4`.

---

## 1. Design Principles

1. **Quiet by default.** The bar should melt into any host page. No drop shadows on the bar itself, no hard borders against the page.
2. **Sharp icons, soft container.** The container is transparent. The icons are NOT — they sit on opaque, high-contrast tiles so they remain readable on any background.
3. **One motion language.** All transitions = 220ms ease-out; opacity + slight transform. No bounce, no spring.
4. **Theme follows OS, but per-user override.** System default; explicit override available.
5. **Accessible first.** Every interaction must work with keyboard alone.

---

## 2. Color Tokens

We rely on Tailwind defaults + a tiny custom palette. Defined in `tailwind.config.js`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `gb-rail`        | `rgb(255 255 255 / var(--gb-alpha))` | `rgb(15 15 15 / var(--gb-alpha))` | Bar background |
| `gb-tile`        | `#ffffff` | `#171717` (`neutral-900`) | App icon tile (opaque) |
| `gb-tile-hover`  | `#f5f5f5` (`neutral-100`) | `#262626` (`neutral-800`) | Tile hover |
| `gb-tile-active` | `#e5e5e5` (`neutral-200`) | `#404040` (`neutral-700`) | Tile pressed/active app |
| `gb-icon`        | `#171717` (`neutral-900`) | `#fafafa` (`neutral-50`) | Icon stroke color |
| `gb-ring-active` | `#3b82f6` (`blue-500`) | `#60a5fa` (`blue-400`) | Active app indicator ring |
| `gb-grip`        | `rgba(0,0,0,0.35)` | `rgba(255,255,255,0.45)` | 6-dot drag handle |
| `gb-panel-bg`    | `#ffffff` | `#0a0a0a` (`neutral-950`) | Glimpse Panel surface |
| `gb-panel-border`| `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | Panel hairline |
| `gb-text`        | `#171717` | `#fafafa` | Body text in panel |
| `gb-text-muted`  | `#737373` (`neutral-500`) | `#a3a3a3` (`neutral-400`) | Secondary text |

**Transparency math.** `--gb-alpha` is set inline on `<GlimpseRoot>`:
```ts
<div style={{ "--gb-alpha": String(transparency) } as CSSProperties}>
```
With `transparency = 0.6` (default), bar background is `rgb(255 255 255 / 0.6)` light or `rgb(15 15 15 / 0.6)` dark.

---

## 3. Typography

| Element | Family | Size | Weight | Color |
|---|---|---|---|---|
| Panel header title | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | 14px | 600 | `gb-text` |
| Panel body         | same | 13px | 400 | `gb-text` |
| Panel meta / time  | same | 11px | 400 | `gb-text-muted` |
| Options page H1    | same | 20px | 600 | `gb-text` |
| Options page label | same | 13px | 500 | `gb-text` |

> No web-font import — extensions should not pull external fonts. System UI is fine.

---

## 4. Glimpse Bar — Visual Spec

```
        ┌────┐  ← rail width = 44px
        │ ⠿  │  drag handle  (height 18px, cursor: grab)
        │    │  4px gap
        │ ⌾  │  app icon tile #1  (36×36 round, 4px gap below)
        │ ⌾  │  app icon tile #2
        │ ⌾  │  app icon tile #3
        │ ⌾  │  settings (separator above — 1px hairline gb-panel-border)
        └────┘
```

| Property | Value |
|---|---|
| Rail width | **44px** |
| Rail border-radius | **16px** (left/right depending on snap edge: when snapped to right, only `rounded-l-2xl`; when snapped to left, only `rounded-r-2xl`; when free-floating between drags, full `rounded-2xl`) |
| Rail vertical padding | 6px top, 6px bottom |
| Rail horizontal padding | 4px |
| Rail backdrop-filter | `backdrop-blur(8px) saturate(140%)` (subtle frosted-glass effect; opacity sits on top) |
| Inner stack gap | 4px between items |
| App icon tile | 36×36px, fully rounded (`rounded-full`), `gb-tile` background, drop-shadow `0 1px 2px rgba(0,0,0,.06)` |
| Icon | 18px Lucide icon, stroke 2px, color `gb-icon` |
| Active state | tile gets a 2px ring `gb-ring-active`, offset 1px |
| Hover state | tile bg → `gb-tile-hover`, transition 120ms |
| Pressed state | tile bg → `gb-tile-active`, scale 0.96 (transform) |
| Settings tile separator | 1px horizontal hairline `gb-panel-border` above settings tile, 4px margin top/bottom |

### 4.1 Drag handle (the grip)

A 6-dot pattern (2 columns × 3 rows of 3px circles) rendered with CSS `radial-gradient`s OR a Lucide `GripVertical` icon (size 16). `cursor: grab` normally, `grabbing` while active. Only this region triggers the drag.

```
  ⠿       ← visual
  ●  ●
  ●  ●
  ●  ●
```

> If using Lucide: `<GripVertical size={16} className="text-[color:var(--gb-grip)]" />` inside a 44×18 hit-box.

### 4.2 Bar dimensions while snapped

When snapped to **right edge**: bar's right edge sits at `viewportW`, left edge at `viewportW - 44`. `rounded-l-2xl` only.
When snapped to **left edge**: bar's left edge sits at `0`. `rounded-r-2xl` only.
When mid-drag: `rounded-2xl` (all corners), with a faint shadow `0 4px 12px rgba(0,0,0,.08)` to suggest "lifted".

---

## 5. Glimpse Panel — Visual Spec

```
┌─────────────────────────────────────────────┐
│  [icon]  TODO            [↻] [📌] [✕]        │  ← header, h=44px
├─────────────────────────────────────────────┤
│                                             │
│  + Add a new task...                        │  ← input row
│                                             │
│  ☐  Pick up groceries           [⋯]          │  ← list item
│  ☑  Send invoice                [⋯]          │  ← checked = strikethrough + muted
│  ☐  Review PR #428              [⋯]          │
│                                             │
│  ─────────────────────────────────────       │
│                                             │
│  3 tasks, 1 done                            │  ← footer summary
└─────────────────────────────────────────────┘
        width 360px, height 100vh − 32px
```

| Property | Value |
|---|---|
| Width | 360px (clamped `min(360, vw − 80)` on small screens) |
| Height | `calc(100vh − 32px)`; 16px gap top + 16px gap bottom |
| Position | Anchored beside the bar — if bar on right, panel right-edge sits at `viewportW − 50` (4px gap from bar); if bar on left, panel left-edge sits at `50`. |
| Background | `gb-panel-bg`, opacity 1.0 (NOT transparent — content needs readability) |
| Border | 1px `gb-panel-border` |
| Border-radius | 16px |
| Shadow | `0 12px 32px rgba(0,0,0,.18)` light; `0 12px 32px rgba(0,0,0,.5)` dark |
| Header height | 44px |
| Header padding | 12px horizontal |
| Body padding | 12px horizontal, 8px vertical, scrollable if overflows |
| Footer | optional, 32px tall, `gb-text-muted` 11px |

### 5.1 Open animation

```ts
<motion.div
  initial={{ x: barEdge === "right" ? 24 : -24, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: barEdge === "right" ? 24 : -24, opacity: 0 }}
  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
>
```

Reduced motion: `transition={{ duration: 0 }}`.

### 5.2 Header buttons

| Button | Icon | Action |
|---|---|---|
| Refresh | `RefreshCw` | App-defined: TODO has no-op; future apps re-fetch |
| Pin | `Pin` (filled when pinned) | Toggles persistent open. When pinned, outside-click and ESC don't close. |
| Close | `X` | Closes panel. |

All header buttons: 28×28px hit-box, 16px icon, `gb-text-muted` → `gb-text` on hover.

---

## 6. TODO App — Detailed Spec

| Element | Style |
|---|---|
| Add input | full-width, 32px tall, `bg-transparent border-b border-gb-panel-border focus:border-gb-ring-active`, placeholder "Add a task and press Enter" |
| List item | row flex `gap-2 py-1.5 px-1`, hover `bg-neutral-50 dark:bg-neutral-900` |
| Checkbox | 16×16 native styling overridden, accent-color `gb-ring-active` |
| Done text | `line-through text-gb-text-muted` |
| Item more menu | `MoreHorizontal` icon, opens dropdown with "Edit" / "Delete" |
| Empty state | centered 48×48 illustration (Lucide `ClipboardList` at 48, muted color) + "No tasks yet" 13px muted |
| Footer | "{open} open · {done} done" text, 11px muted |

---

## 7. Stub Apps (Jira, GitHub) — v1

```
┌─────────────────────────────────────────────┐
│  [icon]  Jira                       [✕]      │
├─────────────────────────────────────────────┤
│                                             │
│             ╭────────────╮                  │
│             │   ✨        │                  │
│             ╰────────────╯                  │
│      Jira integration coming soon.          │
│  Configure host + token in Glimpse Options  │
│  to enable.                                 │
│                                             │
│  [ Open Glimpse Options Page → ]            │
│                                             │
└─────────────────────────────────────────────┘
```

The "Open Glimpse Options Page" button calls `chrome.runtime.openOptionsPage()`.

---

## 8. Glimpse Option Page — Layout

Standard chrome-options tab. Single-column, max-width 720px, 24px padding.

```
┌──────────────────────────────────────────────┐
│  Glimpse Bar — Options                       │  ← H1
│  ───────────────────────────────             │
│                                              │
│  Appearance                                  │  ← H2 13px 600 muted
│                                              │
│  Transparency                       [60%]    │
│  [▰▰▰▰▰▰▱▱▱▱]                                │  ← slider 0–100
│  How see-through the bar background is.      │  ← help text 11px muted
│                                              │
│  Theme                                       │
│  ( ) System  ( ) Light  ( ) Dark             │  ← radio group
│                                              │
│  Apps                                        │
│                                              │
│  ☑ TODO        Local-only task list          │
│  ☑ Jira        Coming soon                   │
│  ☑ GitHub PRs  Coming soon                   │
│                                              │
│  Data                                        │
│  [ Export TODOs as JSON ]  [ Import JSON ]   │
│                                              │
└──────────────────────────────────────────────┘
```

- Slider live-updates `gb:transparency` on `change` (not `input`) to avoid storage spam.
- Toggling an app updates `gb:enabledApps` and re-renders the bar across all tabs.
- Import/Export operate on `gb:todos`.

---

## 9. Iconography

Library: **lucide-react**. Stroke width 2 by default.

| Action | Icon |
|---|---|
| TODO app | `CheckSquare` |
| Jira app (stub) | `ExternalLink` (placeholder until v2 brings real Jira icon SVG) |
| GitHub PRs (stub) | `Github` |
| Settings | `Settings` |
| Drag handle | `GripVertical` |
| Refresh | `RefreshCw` |
| Pin | `Pin` (filled variant when active — Lucide doesn't ship filled, so we'll rotate the unfilled at 45° when pinned) |
| Close | `X` |
| Add | `Plus` |
| More menu | `MoreHorizontal` |
| Empty TODO | `ClipboardList` |

Storybook-equivalent: each icon rendered at 18px on `gb-tile` for the bar, at 16px in panel headers.

---

## 10. Accessibility

- `aria-label` on every icon button: e.g. `aria-label="Open TODO panel"`, `aria-label="Pin Glimpse Panel open"`.
- Bar is a `role="toolbar"` with `aria-orientation="vertical"`.
- App icons inside are `role="button"` (already implicit on `<button>`).
- Keyboard:
  - `Tab` moves focus into the bar, then to first icon.
  - `ArrowUp` / `ArrowDown` cycles through icons.
  - `Enter` / `Space` activates the focused icon.
  - `Esc` closes the panel (when not pinned).
- Focus ring: 2px `gb-ring-active`, 1px offset, visible on `:focus-visible` only.
- Color contrast: every icon-on-tile combo is 4.5:1 minimum. Light theme: `#171717` on `#ffffff` = 19.6:1 ✓. Dark theme: `#fafafa` on `#171717` = 17.5:1 ✓.
- `prefers-reduced-motion: reduce` → drop the panel slide transition (set duration 0).

---

## 11. Responsive Behavior

The bar is fixed-size (44px wide) regardless of viewport.

| Viewport width | Bar | Panel |
|---|---|---|
| ≥ 800px | as spec'd, 360px panel | full spec |
| 400–799px | bar unchanged | panel = `viewportW − 80` (panel still leaves the bar visible) |
| < 400px | bar still rendered, but Panel covers most of viewport. Recommend Options copy: "Glimpse Bar is designed for desktop." |

---

## 12. Reference Mockups

We'll capture screenshots into `docs/assets/` at v1 launch:
- `docs/assets/bar-light.png` — bar on a light page
- `docs/assets/bar-dark.png` — bar on a dark page
- `docs/assets/panel-todo.png` — TODO panel open
- `docs/assets/options.png` — Glimpse Option Page
- `docs/assets/drag.gif` — short drag-and-snap gif (matches the welcome video aesthetic)

These do not exist yet — produce them during Phase 9 of the implementation plan.
