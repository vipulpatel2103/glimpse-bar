# UI Spec — Notes

> Phase-scoped subset of [`../../ui-design.md`](../../ui-design.md) and the agent-friendly summary at [`../../../design.md`](../../../design.md). Read this for *what to build now* — read those for the *complete vision*. Tokens not redefined here inherit from Phase 00 / 01 and `design.md` §2.

---

## What's in this phase visually

- Notes renderer inside the Glimpse Panel — compact (360 px) and expanded (≈720 px).
- Compact header: view dropdown + search toggle + maximize + ⋯.
- Expanded header: static view title + persistent search input + layout toggle + minimize + ⋯; left sidebar with system views + labels.
- Inline `+ Take a note…` composer at the top of the body.
- Cards with title, plaintext preview, label chips, color stripe / tint, and hover quick-actions.
- Markdown editor (Edit ↔ View toggle, color swatch row, label chip strip, checklist toggle, char counter).
- Card context menu (Edit / Color / Labels / Checklist / Duplicate / Pin / Archive / Delete).
- Color swatch popover (8 swatches).
- Label picker popover (multi-select + create).
- Floating bar quick-compose popover.
- Empty states per view.

---

## 1. Color Tokens (additions on top of Phases 00 / 01)

| Token | Light | Dark | Use |
|---|---|---|---|
| `gb-note-default-bg`  | `#ffffff`           | `#1f1f1f`           | Default card surface |
| `gb-note-red-bg`      | `#fef2f2`           | `#3f1f1f`           | Red card tint |
| `gb-note-orange-bg`   | `#fff7ed`           | `#3f2a1f`           | Orange card tint |
| `gb-note-yellow-bg`   | `#fefce8`           | `#3a361f`           | Yellow card tint |
| `gb-note-green-bg`    | `#f0fdf4`           | `#1f3a2a`           | Green card tint |
| `gb-note-teal-bg`     | `#f0fdfa`           | `#1f3a38`           | Teal card tint |
| `gb-note-blue-bg`     | `#eff6ff`           | `#1f2c3f`           | Blue card tint |
| `gb-note-purple-bg`   | `#faf5ff`           | `#2f1f3f`           | Purple card tint |
| `gb-note-pink-bg`     | `#fdf2f8`           | `#3a1f30`           | Pink card tint |
| `gb-note-stripe`      | `rgba(0,0,0,0.10)` | `rgba(255,255,255,0.12)` | Card left-edge accent stripe (color emphasized via card bg; stripe just sharpens hit edge) |
| `gb-note-border`      | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.10)` | Card border |
| `gb-link`             | `#2563eb`           | `#60a5fa`            | Anchor tags in `.gb-prose` |
| `gb-counter-warn`     | `#d97706`           | `#fbbf24`            | Char counter at `BODY_WARN` |
| `gb-counter-error`    | `#dc2626`           | `#ef4444`            | Char counter at `BODY_MAX` |

All other tokens (panel surface, text, focus ring, sidebar item background, etc.) inherit unchanged from Phase 01.

> AA contrast: every card tint pairs with `gb-text` (light) / `gb-text` (dark) at ≥ 4.5:1. Verify in DevTools Accessibility panel.

---

## 2. Typography (additions)

| Element | Family | Size | Weight | Line height | Color token |
|---|---|---|---|---|---|
| Card title           | system-ui | 14px | 600 | 1.3 | `gb-text` |
| Card body preview    | system-ui | 12px | 400 | 1.4 | `gb-text-muted` (line-clamp: 6) |
| Card label chip      | system-ui | 10px | 500 | 1   | `gb-text-muted` |
| Card timestamp       | system-ui | 11px | 400 | 1   | `gb-text-muted` (tabular-nums) |
| Editor title input   | system-ui | 16px | 600 | 1.3 | `gb-text` |
| Editor body textarea | system-ui | 13px | 400 | 1.5 | `gb-text` |
| Editor counter       | system-ui | 11px | 500 | 1   | `gb-text-muted` (`tabular-nums`; recolors at warn / error) |
| Checklist item text  | system-ui | 13px | 400 | 1.4 | `gb-text` |
| Sidebar item         | system-ui | 13px | 500 | 1.4 | `gb-text` (inherits TODO §2) |
| Empty-state copy     | system-ui | 12px | 400 | 1.5 | `gb-text-muted` |

The rendered Markdown (`.gb-prose`) uses the sizes from `plan.md` §4 CSS.

---

## 3. Layout — Compact (360 px)

```
┌──────────────────────────────────────────────┐  panel inherits from Phase 00
│ ▤ All  ▾                       🔍   ⋯   ⤡   │  ← NotesHeader (h=44px)
├──────────────────────────────────────────────┤
│  + Take a note…                              │  ← NotesComposer (collapsed)
│                                              │
│  ── Pinned ───────────────                   │
│  ┌──────────────────────────────────────┐    │
│  │ Shopping list                  📌  ⋯ │    │
│  │ Milk, eggs, bread, oranges,         │    │ ← NoteCard
│  │ butter, coffee beans…               │    │
│  │ #groceries                          │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ── Others ───────────────                   │
│  ┌──────────────────────────────────────┐    │
│  │ Slide deck outline                   │    │
│  │ - Intro …                            │    │
│  │ - Body …                             │    │
│  │ Apr 27                               │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Panel width | 360 px (Phase 00 default) |
| Panel height | `calc(100vh − 32px)` (Phase 00 default) |
| Header height | 44 px |
| Header padding | 12 px horizontal |
| Body padding | 8 px horizontal, 8 px top, 8 px bottom (scrollable region) |
| Composer collapsed | h = 36 px, full width, `gb-row-hover` placeholder text. |
| Composer expanded | h = auto, padding 12 px, title + body + Save / Cancel. |
| Card width | `100% - 16px` (8 px gutter each side) |
| Card padding | 12 px |
| Card border-radius | 10 px |
| Card border | 1 px `gb-note-border` |
| Card stripe | 3 px left-edge color stripe (`gb-note-stripe` mixed with the tint) |
| Card gap | 8 px between cards |
| Card title clamp | 1 line (`text-overflow: ellipsis`) |
| Card body clamp | 6 lines (`-webkit-line-clamp: 6`) |
| Card label chip | inline pill, 10 px text, 4 px horizontal padding, `rounded-full`, `gb-day-chip-bg` (TODO token reuse) |
| Hover-action row | 3 icons at 14 px Lucide stroke 2, 24 × 24 hit-box, `gap-1`, right-aligned in card header |
| Group header (`Pinned` / `Others`) | 11 px, `gb-text-muted`, uppercase, `tracking-wide`, h = 24 px |

### 3.1 Header dropdown (compact only)

- Trigger: clicking the title (`▤ All  ▾`).
- Popover: 240 px wide, surface tokens from TODO §3.1, anchored below the title with 4 px gap.
- Sections (in order):
  1. **System views.** Pinned / All / Archived. Each row: 12 px Lucide icon + label + count.
  2. **Labels.** All user-created labels. Each row: 12 px `Tag` Lucide + name + count.
  3. **Footer.** `+ New Label` row.
- Active view row: `gb-row-active`, 600 weight.
- Hover: `gb-row-hover`.
- Animation: 180 ms ease-out open / 140 ms ease-in close. Skipped on reduced-motion.

### 3.2 Search toggle (compact only)

- 28 × 28 hit-box, 16 px Lucide `Search`. Tooltip `Search notes`.
- Click → header title row replaced by `<input type="search">` with `<` back-arrow on the left and `X` clear on the right. Press Esc to restore the title view.
- Input width: full header width minus 56 px (back + clear). 13 px regular.

### 3.3 Maximize button

- 28 × 28 hit-box, 16 px Lucide `Maximize2`. Tooltip `Expand`.
- Hidden if `vw < 720`.
- Right-aligned in the header, after ⋯.

### 3.4 ⋯ button (compact only)

- 24 × 24 hit-box, 14 px Lucide `MoreHorizontal`. Tooltip `Notes options`.
- Opens an anchored popover (anchored below the icon) with two items: `Layout: List ▸` / `Layout: Grid ▸`. Selecting one persists `notesUiItem.layout`.

---

## 4. Layout — Expanded (`min(720, vw - 68)` px)

```
┌──────────────┬────────────────────────────────┐
│ ▤ Notes  ▾   │  ▤ All           🔍 [▥][≡]  ⤢ │   header h=44px
├──────────────┼────────────────────────────────┤
│ 📌 Pinned 1  │  + Take a note…                │
│ ▤ All     3  │                                │
│ 🗄 Archived 0│  ── Pinned ───                 │
│ ─────        │  ┌────────┐ ┌────────┐         │
│ 🏷 Groceries 1│ │ Card   │ │ Card   │         │
│ 🏷 Work     2│  └────────┘ └────────┘         │
│ + New Label  │  ── Others ───                 │
│              │  ┌────────┐ ┌────────┐         │
│              │  │ Card   │ │ Card   │         │
│              │  └────────┘ └────────┘         │
└──────────────┴────────────────────────────────┘
```

| Property | Value |
|---|---|
| Sidebar width | 200 px fixed |
| Sidebar padding | 8 px horizontal, 8 px top, 8 px bottom |
| Sidebar item height | 28 px |
| Sidebar item border-radius | 6 px |
| Sidebar active item | `gb-row-active`, 600 weight |
| Sidebar `+ New Label` | 13 px, `gb-text-muted`, hover `gb-text` |
| Sidebar divider before labels | 1 px `gb-divider-soft`, 8 px vertical margin |
| Main pane padding | matches compact |
| Card width (grid) | `calc(50% - 12px)` (8 px gutter, 2 columns) |
| Card width (list) | `100% - 16px` |
| Layout toggle | two-pill segmented control: `LayoutGrid` ↔ `List`, 24 px tall |

### 4.1 Header in expanded mode

- The compact dropdown collapses into a static title (icon + name) — switching happens via the sidebar.
- Search input is always visible (always-on `<input type="search">`, 200 px min, grows to fill).
- Layout toggle visible.
- `Minimize2` Lucide replaces `Maximize2`. Tooltip `Collapse`.

### 4.2 Width transition

Reuses TODO §4.2 — same code path on `GlimpsePanel.tsx`. Locks during bar drag.

### 4.3 Card editor expansion

- **Compact:** clicking a card expands it in place (the card grows to fill the body region; other cards push down). Cancel / Done collapses back.
- **Expanded:** clicking a card opens it in a right-pane overlay sized at `min(560, mainPaneWidth - 32)` px. Card grid stays visible behind, dimmed by `rgba(0,0,0,0.20)`. Esc / Done closes.

### 4.4 Empty state alignment

- Compact: empty state takes the full body (centered vertically, padded 32 px).
- Expanded: empty state takes the right pane (centered).

### 4.5 Card timestamp rules

`formatNoteDate(updatedAt, now)`:

- < 1 min ago → `Just now`.
- < 60 min ago → `Nm ago` (`5m ago`, `42m ago`).
- Same calendar day → `h:mm a` (`3:14 PM`).
- Previous calendar day → `Yesterday`.
- Within current calendar week → 3-letter day name (`Mon` … `Sun`).
- Beyond → `MMM D` (e.g., `Apr 30`); add `, YYYY` if not the current year.

---

## 5. Card hover quick-action row

Visible on `:hover` and `:focus-within` of a card. Right-aligned in the card header, 3 icons + the more (⋯):

| Icon | Lucide | Action |
|---|---|---|
| Pin / Unpin       | `Pin` / `PinOff`              | `togglePin` |
| Archive / Restore | `Archive` / `ArchiveRestore`  | `toggleArchive` (Archived view shows Restore + Delete) |
| More              | `MoreHorizontal`              | Opens card context menu |

- Each icon: 14 px stroke 2, 24 × 24 hit-box, `text-gb-text-muted` → `text-gb-text` on hover.
- Implementation: `opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-100`.
- Pinned cards show a persistent (non-hover) tilted-pin badge in the top-right corner of the card; the Pin hover-action remains.

---

## 6. Card context menu

```
┌────────────────────────────┐
│  ✎  Edit              ⌃E   │
│  🎨 Color           ▸      │
│  🏷 Labels          ▸      │
│  ☑  Toggle checklist       │
│  ⎘  Duplicate              │
│  📌 Pin / Unpin            │
│  🗄 Archive / Restore       │
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
| Anchoring | At cursor on right-click; below the trigger on ⋯ click; flips above when near the viewport bottom; flips horizontally when near the viewport right edge. |
| Animation | 140 ms ease-out fade + 4 px slide. Reduced-motion → instant. |

---

## 7. Color swatch popover

```
┌──────────────────────────────────┐
│  ●  ●  ●  ●  ●  ●  ●  ●  ●       │
│  default red orange yellow green …│
└──────────────────────────────────┘
```

| Property | Value |
|---|---|
| Width | 240 px |
| Swatch | 22 × 22 circle, 2 px border (selected = `gb-checkbox-fill`, others = transparent) |
| Tooltip per swatch | color name |
| Behavior | clicking applies + closes |
| Anchoring | below the trigger; flips above when near viewport bottom |

---

## 8. Label picker popover

```
┌──────────────────────────────────┐
│  Search or create…               │
│  ────────────────────────         │
│  ☑ Groceries                     │
│  ☐ Work                          │
│  ☐ Personal                      │
│  + Create "Reading"              │
└──────────────────────────────────┘
```

| Property | Value |
|---|---|
| Width | 240 px |
| Search input height | 28 px, 12 px text |
| Item height | 28 px |
| Checkbox | 14 × 14 |
| Create row | shown only when query is non-empty AND no exact match exists |
| Behavior | clicking a label toggles it on / off; clicking `+ Create` creates and assigns; clicking outside closes |

---

## 9. Empty states

| View | Icon (32 px, `text-gb-text-muted/50`) | Copy |
|---|---|---|
| All           | `StickyNote`     | No notes yet. Take a note above or right-click on any page. |
| Pinned        | `Pin`            | No pinned notes. Pin one to keep it on top. |
| Archived      | `Archive`        | Archive is empty. |
| Custom label  | `Tag`            | No notes in “<label>” yet. |
| Search        | `SearchX`        | No notes match “<query>”. |

---

## 10. Bar inline quick-compose popover

```
┌──────────────────────────────────┐
│  Quick note                      │
│  ┌────────────────────────────┐  │
│  │ Type a note…              │   │
│  └────────────────────────────┘  │
│                      Cancel  Save │
└──────────────────────────────────┘
```

| Property | Value |
|---|---|
| Width | 240 px |
| Min height | 120 px (autosizes up to 240 px) |
| Anchor | Adjacent to the bar's Notes icon, on the side opposite the bar edge (so it never overlaps the bar) |
| Surface | `gb-panel-bg`, 1 px `gb-panel-border`, `rounded-lg`, panel shadow |
| Save | Primary button (`gb-checkbox-fill` bg, white text), 12 px text, 24 px tall |
| Cancel | Ghost button, 12 px text, 24 px tall |
| Behavior | Enter saves; Shift+Enter newline; Esc cancels; outside click cancels |

---

## 11. Animations (additions)

| What | Duration | Easing |
|---|---|---|
| Card hover-action reveal     | 100 ms | ease-out |
| Card focus ring              | 80 ms  | linear |
| Popover open (any)           | 180 ms | `[0.32, 0.72, 0, 1]` |
| Popover close (any)          | 140 ms | `[0.4, 0, 1, 1]` |
| Panel width tween            | 280 / 200 ms | inherits TODO §4.2 |
| Editor mode swap (Edit ↔ View) | 140 ms | cross-fade, no slide |
| Composer expand / collapse   | 180 ms | height + opacity ease-out |
| Counter color transition     | 200 ms | linear |
| Quick-compose popover        | 160 ms / 120 ms | ease-out / ease-in |

All durations → 0 when `prefers-reduced-motion: reduce`.

---

## 12. Iconography (additions; library: lucide-react)

| Icon | Where |
|---|---|
| `StickyNote`           | Bar tile (Notes app), empty state for All |
| `Pin` / `PinOff`       | Pin toggle hover action + context menu |
| `Archive` / `ArchiveRestore` | Archive toggle |
| `Tag`                  | Label sidebar item, picker popover |
| `Palette`              | Card context menu Color row |
| `LayoutGrid` / `List`  | Layout toggle |
| `Search` / `SearchX`   | Search affordance + search-empty state |
| `Pencil` / `Eye`       | Editor mode toggle |
| `Plus`                 | Composer placeholder, `+ New Label`, `+ Create "<name>"` |
| `MoreHorizontal`       | Card hover ⋯ + header ⋯ |
| `Maximize2` / `Minimize2` | Compact ↔ expanded |
| `Copy`                 | Context-menu Duplicate |
| `Trash2`               | Context-menu Delete |
| `ChevronDown`          | Dropdown indicators |
| `X`                    | Close popovers (where applicable) |

All stroke 2. Header / panel / popover icons 16 px. Card hover icons 14 px. Empty-state illustration 32 px.

---

## 13. Accessibility

- Every interactive element: `aria-label` (or visible label).
- Card group: `role="list"`. Each card: `role="listitem"`, `tabindex="0"`.
- Card open: `aria-expanded`; pin / archive use `aria-pressed`.
- Sidebar: `role="navigation" aria-label="Note views"`.
- Search input: `role="searchbox" aria-label="Search notes"`.
- Color swatch row: `role="radiogroup"`, each swatch `role="radio" aria-checked` + `aria-label` (color name).
- Label picker: `role="listbox"`, items `role="option"` with `aria-selected`.
- Editor View mode: `role="article"`, body labelled by the title.
- Markdown rendered HTML inherits semantic tags (h1-6, ul/ol/li, blockquote) — no manual ARIA needed inside `.gb-prose`.
- Color contrast in both themes ≥ 4.5:1 for all text against all 9 card tints (verify with DevTools Accessibility panel for each tint).
- Focus ring: 2 px `gb-ring-active`, 1 px offset, only on `:focus-visible`.
- `prefers-reduced-motion: reduce`: all timed transitions go to 0.

---

## 14. Reference

- Phase 01 [`ui-spec.md`](../01-todo/ui-spec.md) for panel / sidebar / popover primitives reused here.
- Project [`design.md`](../../../design.md) for tokens, motion language, "panel surface always opaque" rule.

---

## 15. Acceptance (visual only)

- [ ] Compact panel matches the layout box in §3 on a light page.
- [ ] Expanded panel matches the layout box in §4 on a viewport ≥ 720 px wide.
- [ ] Sidebar active item visibly distinct in both themes (≥ 4.5:1).
- [ ] Hover-action icons fade in / out in 100 ms; do not shift card layout.
- [ ] Card stripe + tint render correctly for all 9 colors in both themes.
- [ ] Char counter changes color at exactly `BODY_WARN` and `BODY_MAX`.
- [ ] Pinned cards group above non-pinned in `All` with a `Pinned` / `Others` header pair.
- [ ] Quick-compose popover anchors on the side away from the bar edge.
- [ ] Reduced-motion mode: opening any popover, expanding the panel, and switching editor modes is instant.
