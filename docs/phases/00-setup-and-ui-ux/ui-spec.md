# UI Spec — Setup and UI/UX

> Phase-scoped subset of the system [`../../ui-design.md`](../../ui-design.md). Read this for *what to build now*; read the system doc for the *complete vision*.

---

## What's in this phase visually

- Glimpse Bar (full visual spec — tokens, sizing, drag handle, theme).
- Glimpse Panel **shell only** (header + empty body).
- Glimpse Option Page with **only** a transparency slider.

All other UI (TODO list, Jira/GitHub content, theme picker, app toggles, refresh/pin buttons) is **not** built in this phase. Pulling those visuals in early creates dead code and complicates the pure-UX iteration.

---

## 1. Color Tokens (subset used now)

| Token | Light | Dark | Use in this phase |
|---|---|---|---|
| `gb-rail`        | `rgb(255 255 255 / var(--gb-alpha))` | `rgb(15 15 15 / var(--gb-alpha))` | Bar background |
| `gb-tile`        | `#ffffff` | `#171717` | App icon tile |
| `gb-tile-hover`  | `#f5f5f5` | `#262626` | Tile hover |
| `gb-tile-active` | `#e5e5e5` | `#404040` | Tile pressed/active |
| `gb-icon`        | `#171717` | `#fafafa` | Icon stroke |
| `gb-ring-active` | `#3b82f6` | `#60a5fa` | Active app ring + focus ring |
| `gb-grip`        | `rgba(0,0,0,0.35)` | `rgba(255,255,255,0.45)` | Drag handle dots |
| `gb-panel-bg`    | `#ffffff` | `#0a0a0a` | Glimpse Panel surface |
| `gb-panel-border`| `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | Panel hairline + bar separator |
| `gb-text`        | `#171717` | `#fafafa` | Body text |
| `gb-text-muted`  | `#737373` | `#a3a3a3` | Empty-panel placeholder text |

Tokens defer to Tailwind defaults wherever possible (`neutral-*`, `blue-*`). `--gb-alpha` is set inline on the bar root from the storage value.

---

## 2. Glimpse Bar — Visuals

```
┌────┐  ← rail width 44px, padding 4px h, 6px v
│ ⠿  │  drag handle  18px tall, GripVertical 16px icon
│    │  4px gap
│ ⌾  │  TODO        36×36 round tile, 18px icon
│ ⌾  │  Jira
│ ⌾  │  GitHub PRs
│────│  1px hairline gb-panel-border, 4px margin
│ ⌾  │  Settings
└────┘
```

| Property | Value |
|---|---|
| Rail width | **44px** |
| Rail border-radius | **right-snapped:** `rounded-l-2xl` only · **left-snapped:** `rounded-r-2xl` only · **mid-drag:** `rounded-2xl` (all corners) + `shadow-[0_4px_12px_rgba(0,0,0,.08)]` |
| Rail padding | 4px horizontal, 6px top/bottom |
| Inter-item gap | 4px |
| Backdrop filter | `backdrop-blur-md saturate-[1.4]` (Tailwind `backdrop-blur-md`) |
| App tile | 36×36, `rounded-full`, `bg-gb-tile`, drop-shadow `0 1px 2px rgba(0,0,0,.06)` |
| Icon | 18px Lucide, stroke 2, color `gb-icon` |
| Hover tile | `bg-gb-tile-hover`, transition `120ms` |
| Pressed tile | `bg-gb-tile-active`, `scale-[0.96]` (transform) |
| Active app tile | 2px ring `gb-ring-active`, offset 1px |
| Settings divider | 1px `gb-panel-border`, 4px margin top + bottom |

### Drag handle (the grip)

- 44×18 hit-box.
- Centered `<GripVertical size={16} />` from Lucide, color `gb-grip`.
- `cursor: grab` normally, `grabbing` while pointer is captured.
- Pointer events on this element only initiate drag; the rest of the bar does not.

### Default position
- `x = window.innerWidth − 44` (right edge).
- `y = window.innerHeight / 2 − barHeight / 2`.
- Snapped edge `right`.
- Stored on first render if `gb:position` is empty.

---

## 3. App Icons — Setup phase

| Order | App | Lucide icon | aria-label |
|---|---|---|---|
| 1 | TODO        | `CheckSquare`  | "Open TODO panel" |
| 2 | Jira        | `ExternalLink` | "Open Jira panel" |
| 3 | GitHub PRs  | `Github`       | "Open GitHub panel" |
| 4 | Settings    | `Settings`     | "Open Glimpse Bar options" |

> Lucide doesn't ship an authentic Jira icon at v0.x; `ExternalLink` is the placeholder until the Jira phase optionally bundles a custom SVG.

---

## 4. Glimpse Panel — Visuals (shell only)

```
┌─────────────────────────────────────────────┐
│  [icon]  TODO                       [✕]      │  ← header, h=44px
├─────────────────────────────────────────────┤
│                                              │
│                                              │
│         "TODO — content lands in              │
│          a later phase"                       │
│                                              │
│                                              │
└─────────────────────────────────────────────┘
        width 360px, height 100vh − 32px
```

| Property | Value |
|---|---|
| Width | 360px (clamp `min(360, vw − 80)`) |
| Height | `calc(100vh − 32px)` (16px gap top, 16px gap bottom) |
| Position | Right-snapped bar → panel right edge at `vw − 50` (4px gap from bar) · Left-snapped bar → panel left edge at `50` |
| Background | `gb-panel-bg` (opaque) |
| Border | 1px `gb-panel-border` |
| Border-radius | 16px |
| Shadow | `shadow-[0_12px_32px_rgba(0,0,0,.18)]` light · `shadow-[0_12px_32px_rgba(0,0,0,.5)]` dark |
| Header height | 44px |
| Header padding | 12px horizontal |
| Empty-body copy | `text-gb-text-muted text-[13px] text-center` — single line per the box above |

### Open animation

```ts
<motion.div
  initial={{ x: barEdge === "right" ? 24 : -24, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: barEdge === "right" ? 24 : -24, opacity: 0 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
/>
```

### Header

- App icon (left) — same Lucide icon as the bar tile, 16px, `gb-text`.
- App name (center-left) — 14px / 600, `gb-text`.
- Close button (right) — `<X size={16}>`, 28×28 hit-box, `gb-text-muted` → `gb-text` on hover.

> Pin and Refresh buttons are NOT included in this phase. They land alongside the apps that actually need them.

### Dismissal

- Close button.
- ESC keydown (window listener while panel is mounted).
- Outside click (mousedown target outside both panel and bar).
- No "pin" — that's a TODO-phase concern.

---

## 5. Glimpse Option Page — Visuals (this phase)

```
┌──────────────────────────────────────────────┐
│  Glimpse Bar — Options                       │  ← H1 20px / 600
│  ────────────────                             │
│                                              │
│  Appearance                                  │  ← H2 13px / 600 muted
│                                              │
│  Transparency                       [60%]    │
│  [▰▰▰▰▰▰▱▱▱▱]                                 │  ← 0–100 slider
│  How see-through the Glimpse Bar background  │
│  is.                                         │  ← help text 11px muted
│                                              │
└──────────────────────────────────────────────┘
   max-width 720px, 24px padding
```

- Single section ("Appearance") with single control (Transparency slider).
- Slider writes to `gb:transparency` on `change` (not `input`) — avoids storage spam during drag.
- Page background: `bg-white` light / `bg-neutral-950` dark, follows OS theme via `window.matchMedia` at mount.
- No theme picker, no app toggles, no Connections section, no Data section. Those land in later phases.

---

## 6. Iconography (this phase)

Library: **lucide-react** v0.x. All stroke-2.

| Icon | Where |
|---|---|
| `GripVertical` | Drag handle |
| `CheckSquare`  | TODO bar tile + panel header |
| `ExternalLink` | Jira bar tile + panel header (placeholder until real Jira icon) |
| `Github`       | GitHub bar tile + panel header |
| `Settings`     | Settings bar tile (no panel — opens Options) |
| `X`            | Panel close button |

---

## 7. Accessibility (this phase)

- All bar icons + panel close button have `aria-label`.
- Bar element gets `role="toolbar" aria-orientation="vertical"`.
- Keyboard:
  - Tab into bar → focuses first icon.
  - Arrow Up/Down cycles icons.
  - Enter / Space activates.
  - Esc closes the panel (always — there's no "pin" yet).
- Focus ring: 2px `gb-ring-active`, 1px offset, only on `:focus-visible`.
- Color contrast: `#171717 on #ffffff` = 19.6:1 light; `#fafafa on #171717` = 17.5:1 dark — both well above 4.5:1.
- `prefers-reduced-motion: reduce`: panel animation duration → 0; bar drag still functional (drag is a deliberate action by the user).

---

## 8. Reference

- User's screenshot — vertical icon column on the right edge.
- Welcome demo at `https://manganum.fra1.cdn.digitaloceanspaces.com/assets/Welcome.mp4` — slide-in panel feel.
- System UI design system: [`../../ui-design.md`](../../ui-design.md).

---

## 9. Acceptance (visual only)

- [ ] On a light page, bar matches the screenshot reference.
- [ ] On a dark page, bar tiles + icons remain ≥ 4.5:1 contrast and clearly visible.
- [ ] When dragged mid-page, bar shows full rounding + lift shadow; on release, only the appropriate side is rounded.
- [ ] Panel slides in/out with no jank; ends exactly aligned to the bar's edge with a 4px gap.
- [ ] Options page is clean, single-column, and obeys OS theme.
