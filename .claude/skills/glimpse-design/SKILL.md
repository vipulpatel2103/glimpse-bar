---
name: glimpse-design
description: >
  Glimpse Bar design system — color tokens, typography, motion, component dimensions,
  and critical layout conventions. Invoke this skill before making ANY UI change in
  this project: colors, spacing, fonts, animations, shadows, icons, or component structure.
  Also use it when the user asks "what color should X be?", "how should this animate?",
  "what font size?", or "does this look right?". This is the single source of truth for
  all visual decisions.
---

# Glimpse Bar Design System

> Read `design.md` for the full spec. This skill is the agent-optimized summary.
> When in doubt, `design.md` wins.

---

## Color Tokens

### Rail (bar background) — always dark in both themes
```
light:  rgba(23, 23, 23, <alpha>)    // alpha from user transparency setting
dark:   rgba(15, 15, 15, <alpha>)
```

### Tiles (app icon buttons)
```
light:  bg rgba(255,255,255,0.95)   border rgba(0,0,0,0.08)
dark:   bg rgba(255,255,255,0.10)   border rgba(255,255,255,0.12)
```

### Icon stroke
```
light:  #171717
dark:   #fafafa
```

### Active ring / accent
```
#3b82f6   (blue-500)  — used for active tile ring, focus rings, accent-blue-500
```

### Panel background — always opaque
```
light:  #ffffff
dark:   #0a0a0a
```

### Text
```
light primary:  #171717    (neutral-900)
light muted:    #737373    (neutral-500)
dark primary:   #fafafa    (neutral-50)
dark muted:     #a3a3a3    (neutral-400)
```

### Borders (panel, header dividers, form controls)
```
light:  rgba(0,0,0,0.06)    or  rgba(0,0,0,0.08)  or  rgba(0,0,0,0.10)
dark:   rgba(255,255,255,0.06)  or rgba(255,255,255,0.08) or rgba(255,255,255,0.10)
```

### Hover states (tiles, buttons)
```
light:  rgba(0,0,0,0.06)
dark:   rgba(255,255,255,0.08)
```

---

## Typography

| Context | Size | Weight | Notes |
|---------|------|--------|-------|
| Panel header title | 14px | 600 | `text-[14px] font-semibold` |
| Panel body text | 13px | 400 | `text-[13px]` |
| Panel meta / timestamps | 11px | 400 | `text-[11px]` |
| Options page H1 | 20px | 600 | `text-[20px] font-semibold` |
| Options section heading | 13px | 600 | `text-[13px] font-semibold uppercase tracking-wide` |
| Options form label | 14px | 500 | `text-sm font-medium` |
| Options help text | 12px | 400 | `text-xs text-neutral-500 dark:text-neutral-400` |

**Font stack:** `system-ui` only. No web fonts — privacy + CSP.

---

## Icons — Lucide React

| Location | Size | strokeWidth |
|----------|------|-------------|
| Bar tile | 18 | 2.25 |
| Panel header / Options | 16 | 2 |
| Drag grip | — | — (2×4 grid of 3px circles, NOT a Lucide icon) |

---

## Component Dimensions

| Component | Value |
|-----------|-------|
| Bar width | 44px |
| Tile size | 36×36px |
| Tile border-radius | `rounded-full` |
| Panel width | 360px (compact), 720px (expanded) |
| Panel height | `100vh − 32px` (16px top + 16px bottom margin) |
| Panel gap from bar | 4px |
| Panel header height | 44px (`h-11`) |
| Bar padding | 4px horizontal, 8px vertical |

---

## Shadows

```
tile:        0 1px 3px rgba(0,0,0,0.2)
bar (resting):   0 4px 6px rgba(0,0,0,0.3)
bar (dragging):  0 8px 24px rgba(0,0,0,0.4)
panel:       -4px 0 24px rgba(0,0,0,0.15)  (right edge bar)
             4px 0 24px rgba(0,0,0,0.15)   (left edge bar)
```

---

## Motion

| Action | Duration | Cubic-bezier |
|--------|----------|--------------|
| Open / enter | 280–340ms | `[0.32, 0.72, 0, 1]` (emphasized ease-out) |
| Close / exit | 180–220ms | `[0.4, 0, 1, 1]` (ease-in) |

- **No springs, no bounces, no overshoots.**
- Always honor `prefers-reduced-motion: reduce` → durations → 0.
- Panel: slide + scale only. Never animate `opacity`.

---

## Bar Shape

```
snapped right:  rounded-l-2xl (left corners rounded)
snapped left:   rounded-r-2xl (right corners rounded)
mid-drag:       rounded-2xl   (all corners)
```

---

## Theme-Aware Inline Style Pattern

```tsx
// In a Renderer component:
const bg    = theme === "dark" ? "#0a0a0a" : "#ffffff"
const text  = theme === "dark" ? "#fafafa" : "#171717"
const muted = theme === "dark" ? "#a3a3a3" : "#737373"
const border = theme === "dark"
  ? "1px solid rgba(255,255,255,0.06)"
  : "1px solid rgba(0,0,0,0.06)"
```

---

## Critical Layout Conventions

### Never use `window.innerWidth/Height`
`window.innerWidth` includes the scrollbar on Windows Chrome → bar hides under scrollbar.

```ts
// correct
const vw = document.documentElement.clientWidth
const vh = document.documentElement.clientHeight
```

### Bar position — CSS edges for snapped, transform for drag

```ts
// snapped
edge === "right" ? { right: 0, top: y } : { left: 0, top: y }

// dragging (GPU-accelerated)
{ left: 0, top: 0, transform: `translate3d(${x}px, ${y}px, 0)` }
```

### `position: fixed` inside panel breaks with `transform`

The panel's framer-motion residual `transform` makes `position: fixed` children position relative to the panel, not the viewport. Use `position: absolute` with a `relative` parent, or compensate via `getBoundingClientRect()` offset walking.

### Outside-click handlers — use `composedPath()`

```ts
// wrong — e.target is retargeted to shadow host
if (panel.contains(e.target as Node)) return

// correct — preserves path through shadow boundary
if (e.composedPath().includes(panel)) return
```

### Panel surface is always opaque

`--gb-alpha` (bar transparency) does NOT propagate to the panel. Panel uses solid bg.

---

## Options Page Layout

```tsx
<main className="min-h-screen bg-white p-6 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
  <div className="mx-auto max-w-2xl">
    {/* sections */}
  </div>
</main>
```

Section divider:
```tsx
<hr className="my-6 border-black/[0.08] dark:border-white/[0.08]" />
```

---

## Do's and Don'ts

| Do | Don't |
|----|-------|
| Use Lucide React for all icons | Roll custom SVGs |
| Use `document.documentElement.clientWidth` | `window.innerWidth` |
| Use `e.composedPath()` for outside-click | `e.target` |
| Keep panel bg opaque | Animate panel opacity |
| Use system-ui font stack | Import web fonts |
| Tailwind utilities + inline style for runtime values | Component-level CSS files |
| Deterministic easing curves | Springs, bounces |
| `rounded-full` tiles | Squared or slightly-rounded tiles |
