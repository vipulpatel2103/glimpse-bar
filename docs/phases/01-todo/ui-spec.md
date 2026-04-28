# UI Spec — TODO

> Phase-scoped subset of [`../../ui-design.md`](../../ui-design.md) and the agent-friendly summary at [`../../../design.md`](../../../design.md). Read this for *what to build now* — read those for the *complete vision*. Tokens not redefined here inherit from Phase 00 and `design.md` §2.

---

## What's in this phase visually

- TODO renderer inside the Glimpse Panel — compact (360 px) and expanded (≈720 px).
- Compact header: view dropdown + maximize + list-config ⋯.
- Expanded header: static view title + minimize + ⋯; left sidebar with views + lists.
- Task rows with checkbox, text, day chip, and hover quick-actions.
- Date popover with quick chips + native picker.
- Row context menu (Edit / Date / Subtask / Duplicate / Delete).
- Per-list ⋯ menu (Sort / New-task position / Show completed / Pin).
- Empty states per view.
- Subtask child rows.

All other UI (recurring submenu, reminder time, notifications surface, omnibox) is **not** built in this phase.

---

## 1. Color Tokens (additions on top of Phase 00 / `design.md`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `gb-row-hover`        | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.06)` | Row hover surface |
| `gb-row-active`       | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.10)` | Row pressed / focused / sidebar selected |
| `gb-checkbox-border`  | `rgba(0,0,0,0.30)` | `rgba(255,255,255,0.35)` | Unchecked checkbox border |
| `gb-checkbox-fill`    | `#3b82f6`           | `#3b82f6`            | Checked checkbox fill (`accent-blue-500`) |
| `gb-day-chip-bg`      | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.08)` | Day chip pill |
| `gb-day-chip-overdue` | `#ef4444`           | `#f87171`           | Day chip dot when overdue |
| `gb-divider-soft`     | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.06)` | Day-group header underline / sidebar divider |
| `gb-badge-bg`         | `#2563eb`           | `#2563eb`            | Toolbar badge background |

All other tokens (panel surface, text, focus ring, etc.) inherit unchanged.

---

## 2. Typography (additions)

| Element | Family | Size | Weight | Line height | Color token |
|---|---|---|---|---|---|
| Sidebar item                | system-ui | 13px | 500 | 1.4 | `gb-text` |
| Sidebar item count          | system-ui | 12px | 400 | 1   | `gb-text-muted` (`tabular-nums`) |
| Day-group header (Upcoming) | system-ui | 11px | 600 | 1.2 | `gb-text-muted` (uppercase, `tracking-wide`) |
| Row text                    | system-ui | 13px | 400 | 1.4 | `gb-text` |
| Row text (done)             | system-ui | 13px | 400 | 1.4 | `gb-text-muted` + `line-through` + `opacity-50` |
| Subtask row text            | system-ui | 12px | 400 | 1.4 | `gb-text` |
| Day chip                    | system-ui | 10px | 500 | 1   | `gb-text-muted` |
| Empty-state copy            | system-ui | 12px | 400 | 1.5 | `gb-text-muted` |

---

## 3. Layout — Compact (360 px)

```
┌──────────────────────────────────────────────┐  panel inherits from Phase 00
│ ◐ Today  ▾                            ⋯   ⤡  │  ← TodoHeader (h=44px)
├──────────────────────────────────────────────┤
│                                              │
│  ☐  Buy milk                       ☀   ⋯    │  ← TodoRow, h=32px
│  ☐  Finish slide deck             Thu  ⋯    │
│  ☑  Reply to Anya              ─done─        │
│                                              │
│  + New task                              ⋯  │  ← TodoNewRow + ListConfig ⋯
└──────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Panel width | 360 px (Phase 00 default) |
| Panel height | `calc(100vh − 32px)` (Phase 00 default) |
| Header height | 44 px |
| Header padding | 12 px horizontal |
| Body padding | 4 px horizontal, 4 px top, 0 bottom (footer is sticky) |
| Row height | 32 px (compact) |
| Row padding | 8 px horizontal |
| Row gap | 0 (rows abut; hover state segregates) |
| Row checkbox | 16 × 16, `rounded`, 1 px border |
| Row chevron (subtask expand) | 12 px Lucide `ChevronDown` / `ChevronRight`, 16 px hit-box |
| Day chip | inline pill, 10 px text, 4 px horizontal padding, `rounded-full`, `gb-day-chip-bg` |
| Hover-action row | 4 icons at 14 px Lucide stroke 2, 24 × 24 hit-box each, `gap-1` |
| Footer | sticky bottom; same height as a row (32 px); `+ New task` left, list-config ⋯ right |

### 3.1 Header dropdown (compact only)

- Trigger: clicking the title (`◐ Today  ▾`).
- Popover: 240 px wide, `gb-panel-bg`, 1 px `gb-panel-border`, `rounded-lg`, `shadow-[0_8px_24px_rgba(0,0,0,0.18)]`, anchored below the title with 4 px gap.
- Sections (in order):
  1. **System views.** Today / Upcoming / Inbox / Completed. Each row: 12 px Lucide icon + label + count.
  2. **Lists.** All custom lists. Each row: 12 px `List` Lucide + label + count.
  3. **Footer.** `+ New List` row.
- Active view row: `gb-row-active`, 600 weight.
- Hover: `gb-row-hover`.
- Animation: 180 ms ease-out (scale 0.96 → 1, opacity 0 → 1). 140 ms ease-in close. Skipped on reduced-motion.

### 3.2 Maximize button

- 28 × 28 hit-box, 16 px Lucide `Maximize2`. Tooltip `Expand`.
- Hidden if `vw < 720`.
- Right-aligned in the header, before the ⋯.

### 3.3 List-config ⋯ (footer right)

- 24 × 24 hit-box, 14 px Lucide `MoreHorizontal`.
- Opens a popover (anchored above the footer) with the four sections from `scope.md` §"Per-list settings menu".

---

## 4. Layout — Expanded (`min(720, vw - 68)` px)

```
┌──────────────┬────────────────────────────────┐
│ ☑ Tasks   ▾  │  ◐ Today                ⋯  ⤢  │   header h=44px
├──────────────┼────────────────────────────────┤
│ ◐ Today     2│                                │
│ ▦ Upcoming  3│  ☐ Buy milk            ☀   ⋯ │
│ ✉ Inbox     2│  ☐ Finish slide deck  Thu  ⋯ │
│ ✓ Completed29│                                │
│ ─────        │  ─── Tomorrow ─────────────     │
│ ▤ Reading   4│  ☐ Read paper                  │
│ ▤ Errands   1│                                │
│ + New List   │  + New task                ⋯ │
└──────────────┴────────────────────────────────┘
```

| Property | Value |
|---|---|
| Sidebar width | 200 px fixed |
| Sidebar padding | 8 px horizontal, 8 px top, 8 px bottom |
| Sidebar item height | 28 px |
| Sidebar item border-radius | 6 px |
| Sidebar active item | `gb-row-active`, 600 weight |
| Sidebar `+ New List` | 13 px, `gb-text-muted`, hover `gb-text` |
| Sidebar divider before custom lists | 1 px `gb-divider-soft`, 8 px vertical margin |
| Main pane padding | matches compact |
| Row height | 36 px (expanded — slightly taller) |
| Day-group header (Upcoming) | sticky-top while scrolling, h=24 px, 8 px horizontal, `gb-text-muted` uppercase |

### 4.1 Header in expanded mode

- The compact dropdown collapses into a static title (icon + name) — switching happens via the sidebar.
- `Minimize2` Lucide replaces `Maximize2`. Tooltip `Collapse`.

### 4.2 Width transition

```ts
<motion.div
  animate={{ width: expanded ? expandedW : compactW }}
  transition={{
    duration: prefersReducedMotion ? 0 : (expanded ? 0.28 : 0.20),
    ease: expanded ? [0.32, 0.72, 0, 1] : [0.4, 0, 1, 1],
  }}
/>
```

- Lock during drag: pass `expanded={isDragging ? lastValue : userValue}` so width never tweens while the bar is being dragged.

---

## 4.4 Date display rules

`formatDayLabel(ts, now)`:

- Same calendar day as `now` → `Today`.
- Next calendar day → `Tomorrow`.
- Within next 6 days → 3-letter day name (`Mon` … `Sun`).
- Beyond 7 days or in the past → `MMM D` (e.g., `Apr 30`).
- The day chip on a row uses `Today` → sun ☀ glyph (no text); other labels rendered as text.
- Tooltip on the day chip uses the verbose form: `Due Thu` / `Due Apr 30` / `Overdue — was due Apr 25`.

---

## 5. Hover quick-action row

Visible on `:hover` and `:focus-within` of a row. Renders right-aligned, 4 icons + the more (⋯), separated by 2 px:

| Icon | Lucide | Action |
|---|---|---|
| Schedule today | `Sun`           | `setDueAt(startOfDay(now))` |
| Remove date    | `CalendarOff`   | `setDueAt(undefined)` |
| Open picker    | `Calendar`      | Opens DatePopover |
| Add subtask    | `GitBranch`     | Inserts a subtask, focuses input |
| More           | `MoreHorizontal`| Opens row context menu |

- Each icon: 14 px stroke 2, 24 × 24 hit-box, `text-gb-text-muted` → `text-gb-text` on hover.
- Implementation: `opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-100`.

---

## 6. Row context menu

```
┌────────────────────────────┐
│  ✎  Edit              ⌃E   │
│  📅 Date          ▸        │
│  ⎘  Add subtask            │
│  ⎘  Duplicate              │
│  🗑  Delete            ⌫   │
└────────────────────────────┘
```

| Property | Value |
|---|---|
| Width | 200 px |
| Item height | 28 px |
| Item padding | 8 px horizontal |
| Surface | `gb-panel-bg`, 1 px `gb-panel-border`, `rounded-lg`, panel shadow |
| Shortcut hint | 11 px `gb-text-muted`, right-aligned |
| Anchoring | At cursor on right-click; below the trigger on ⋯ click; flips above when `viewport.bottom - cursor.y < menuHeight + 8`. |
| Animation | 140 ms ease-out fade + 4 px slide. Reduced-motion → instant. |

Date submenu content: same as `DatePopover` from §7.

---

## 7. Date popover

```
┌──────────────────────────────────┐
│  ☀  Today                        │
│  ➡  Tomorrow                     │
│  🌳 This Weekend                 │
│  →  Next Week                    │
│  📅 Pick date…   [native input]  │
│  ────────────────────────────    │
│  ✕  Remove date                  │
└──────────────────────────────────┘
```

| Property | Value |
|---|---|
| Width | 220 px |
| Item height | 28 px |
| Surface | same as context menu |
| Native picker | rendered inline below the chip when `Pick date…` clicked |
| Behavior | clicking a chip writes `dueAt` and closes |

---

## 8. Per-list config menu

```
┌──────────────────────────────┐
│  Sort                        │
│   ◉ Manual                   │
│   ◯ By date                  │
│   ◯ Alphabetical             │
│  ────────────────────────    │
│  Add new tasks at            │
│   ◉ Bottom                   │
│   ◯ Top                      │
│  ────────────────────────    │
│  Show completed              │
│   ◯ Never                    │
│   ◯ Today                    │
│   ◉ 30 days                  │
│   ◯ Always                   │
│  ────────────────────────    │
│  ⌘  Pin panel        ⬤◯    │
└──────────────────────────────┘
```

| Property | Value |
|---|---|
| Width | 240 px |
| Section spacing | 8 px |
| Section header | 11 px `gb-text-muted` `tracking-wide` |
| Radio | 12 px circle, `gb-checkbox-border` → `gb-checkbox-fill` when selected |
| Toggle | 28 × 16 pill, `gb-checkbox-fill` when on |

---

## 9. Empty states

| View | Icon (32 px, `text-gb-text-muted/50`) | Copy |
|---|---|---|
| Today     | `Sunrise`            | Nothing scheduled. Pick a task from Inbox. |
| Upcoming  | `CalendarRange`      | Calendar's clear for the next week. |
| Inbox     | `Inbox`              | Inbox is empty. Capture something with right-click → Add selection as task. |
| Completed | `CheckCheck`         | No tasks completed yet. |
| Custom list | `List`             | No tasks here yet. |

---

## 10. Animations (additions)

| What | Duration | Easing |
|---|---|---|
| Row strikethrough on done | 200 ms | linear (`text-decoration` doesn't ease — animate `opacity` instead) |
| Hover-action reveal | 100 ms | ease-out |
| Popover open | 180 ms | `[0.32, 0.72, 0, 1]` |
| Popover close | 140 ms | `[0.4, 0, 1, 1]` |
| Panel width tween (expand/collapse) | 280 ms / 200 ms | open ease-out / close ease-in (same curves as panel slide) |

All durations → 0 when `prefers-reduced-motion: reduce`.

---

## 11. Iconography (additions; library: lucide-react)

| Icon | Where |
|---|---|
| `Sunrise` / `Sun`       | Today view, schedule-today action |
| `CalendarRange`         | Upcoming view |
| `Inbox`                 | Inbox view |
| `CheckCheck`            | Completed view |
| `List`                  | Custom lists |
| `Plus`                  | `+ New task`, `+ New List`, `+ New subtask` |
| `Calendar`              | Date picker action |
| `CalendarOff`           | Remove date action |
| `GitBranch`             | Add subtask action |
| `MoreHorizontal`        | Row ⋯ + footer ⋯ |
| `ChevronDown` / `ChevronRight` | Subtask expand/collapse, dropdown indicator |
| `Maximize2` / `Minimize2` | Compact ↔ expanded toggle |
| `X`                     | Close popovers (where applicable) |
| `Pencil`                | Context-menu Edit |
| `Copy`                  | Context-menu Duplicate |
| `Trash2`                | Context-menu Delete |
| `Pin`                   | Pin panel toggle |

All stroke 2. Header / panel / popover icons 16 px. Row hover icons 14 px. Empty-state illustration 32 px.

---

## 12. Accessibility

- Every interactive element: `aria-label` (or visible label).
- Row group: `role="listitem"`. Container: `role="list"`.
- Context menu: `role="menu"`; items `role="menuitem"`. Arrow keys cycle; Enter activates; Esc closes; tab moves focus out.
- Sidebar: `role="navigation" aria-label="Task views"`.
- Date popover chips: `role="listbox"` with single-select semantics; selected chip exposes `aria-selected="true"`.
- Strikethrough alone is not used as the only signal of completion — opacity + `aria-checked="true"` on the checkbox supplement it.
- Color contrast in both themes ≥ 4.5:1 for all text (verify with DevTools Accessibility panel).
- Focus ring: 2 px `gb-ring-active`, 1 px offset, only on `:focus-visible`.
- `prefers-reduced-motion: reduce`: all timed transitions go to 0 (popovers, width tween, strikethrough fade).

---

## 13. Reference

- User-supplied screenshots (compact, ⋯ menu, expanded with sidebar, Upcoming groups, Inbox tooltip).
- Phase 00 [`ui-spec.md`](../00-setup-and-ui-ux/ui-spec.md) for panel/bar primitives.
- Project [`design.md`](../../../design.md) for tokens, motion language, "panel surface always opaque" rule.

---

## 14. Acceptance (visual only)

- [ ] Compact panel matches the layout box in §3 on a light page.
- [ ] Expanded panel matches the layout box in §4 on a viewport ≥ 720 px wide.
- [ ] Sidebar active item visibly distinct in both themes (≥ 4.5:1).
- [ ] Hover-action icons fade in/out in 100 ms; do not shift row layout.
- [ ] Day chip overdue dot is the only red affordance in TODO UI (used sparingly).
- [ ] Strikethrough animation is on row text only — panel surface unaffected.
- [ ] Reduced-motion mode: opening any popover is instant.
