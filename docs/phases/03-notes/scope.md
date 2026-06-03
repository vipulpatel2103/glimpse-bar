# Scope — Notes

## In scope

### Notes
- Add via inline `+ Take a note…` composer (click expands; Enter on title commits and focuses body; Cmd/Ctrl+Enter on body commits; Esc cancels; empty input does nothing).
- Edit inline — clicking a card opens it for edit in place (compact) or in the right pane (expanded).
- Markdown body: stored as raw Markdown string, rendered via `marked` + sanitized via `DOMPurify` in view mode. Toggle button switches Edit ↔ View.
- Checklist mode — mutually exclusive with the Markdown body (Keep behavior). Toggling on converts the editor to a vertical list of `[ ] item` rows; toggling off preserves a Markdown serialization (`- [ ] …`) so no data is lost.
- Pin (header chevron / star toggle) — pinned notes float to the top of the All view under a `Pinned` group header.
- Archive (header box-arrow toggle) — archived notes vanish from All; visible only in the Archived view. Archive does not delete; counts against the 100-note cap.
- Delete (context menu / `⌫` with card focused) — permanent. Undo toast visible for ~5 s.
- Color — 8-swatch picker matching `ui-spec.md` §1. Stored as a token name (`default`, `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`) — never a raw hex — so theme switches re-tint without storage mutation.
- Labels — comma-or-Enter-separated chips in the editor. Inline create on Enter; autocomplete from existing labels. A note may carry up to 20 labels.
- Capture page selection (right-click → `Add selection as note`) and page URL (right-click → `Add page as note`). Both land in `All` with `pinned: false`, `archived: false`, `color: 'default'`, no labels. The page-title note carries the URL as its body (`pageTitle\n\n<url>`); selection lands as title-less body.

### Views
- **All** — `!archived`. Sorted `pinned` first (under `Pinned` group header), then by `updatedAt` desc (under `Others`).
- **Pinned** — `pinned && !archived`. Quick-access view via sidebar.
- **Archived** — `archived`. Sorted `updatedAt` desc. Restore from card context menu.
- **Custom label views** — one per `LabelMeta`. Sidebar lists labels; clicking filters cards to `labels.includes(labelId)`.

### Navigation
- **Compact (default, panel width 360 px):** header shows current view as a dropdown (`▤ All  ▾`). Click → popover with the three system views + labels + `+ New Label` + view counts.
- **Expanded (panel width `min(720, vw - 68)` px):** maximize button on header animates panel width. Sidebar (200 px fixed) renders Pinned / All / Archived / divider / labels list / `+ New Label`. Maximize icon flips to minimize.
- Falls back to compact if `vw < 720` (maximize button hidden).
- View counts shown next to each entry (sidebar **and** dropdown).
- Layout toggle in the header (grid ↔ list). Grid is the default in expanded; list is the default in compact (which has no real grid anyway — single column).
- Active view + expanded state + layout persisted across sessions.

### Markdown
- Library: [`marked`](https://marked.js.org/) ≥ 12 + [`dompurify`](https://github.com/cure53/DOMPurify) ≥ 3, both lazy-imported from `NoteEditor.tsx`.
- Allowlist (DOMPurify config): `h1, h2, h3, h4, h5, h6, p, ul, ol, li, strong, em, code, pre, blockquote, a, hr, br`. Explicit deny: `img, iframe, video, audio, script, style, on*` attrs, `javascript:` / `data:` URLs.
- Post-sanitize pass on the rendered fragment sets `target="_blank" rel="noreferrer noopener"` on every `<a>`.
- Card preview strips Markdown via a regex helper (`stripMd(body)` in `lib/notes/markdown.ts`) so the grid render path never *calls* `marked` (cheaper per-card render). Note: `marked` + `DOMPurify` are still inlined into the content-script bundle regardless — WXT can't code-split content-script dynamic imports (see CLAUDE.md). Preview is clamped to 6 lines via CSS `-webkit-line-clamp`.
- A small `.gb-prose` ruleset in `entrypoints/glimpse.content/style.css` styles the rendered HTML inside the shadow root (Tailwind `prose` plugin is not used).
- Default editor mode on open: `view` when body is non-empty, `edit` when empty.

### Limits
Defined in `lib/notes/limits.ts`:

```ts
export const NOTE_LIMITS = {
  TITLE_MAX: 200,
  BODY_MAX: 10_000,
  BODY_WARN: 9_000,
  CHECKLIST_ITEM_MAX: 280,
  CHECKLIST_PER_NOTE: 200,
  LABELS_PER_NOTE: 20,
  TOTAL_NOTES_MAX: 100,
  TOTAL_NOTES_WARN: 90,
} as const
```

- Editor counter shows `value.length / BODY_MAX`. Amber at `BODY_WARN`, red at `BODY_MAX`. `<textarea maxLength={BODY_MAX}>` hard-stops typing.
- `addNote` rejects when `notes.length >= TOTAL_NOTES_MAX`; toast `Note limit reached (100). Archive or delete old notes.`
- Quick-capture paths (right-click, bar Shift-click) enforce the same limits silently — they toast but do not reject the user's clipboard contents in the middle of typing.
- Archived notes count against the cap.

### Search
- Header search input (always visible in expanded; toggled via `Search` icon button in compact).
- `searchNotes(items, query)` (pure): case-insensitive substring match over `title`, `body`, every `checklist[].text`, and the names of every label assigned to the note. Returns the filtered set sorted by `updatedAt` desc.
- Empty-result state: muted copy `No notes match "<query>".`.
- No regex, no fuzzy ranking, no per-field weights v1.

### Hover quick actions (card header right-aligned, revealed on hover)
- Pin / Unpin (`Pin` / `PinOff` Lucide).
- Archive / Restore (`Archive` / `ArchiveRestore` Lucide).
- More (`MoreHorizontal`) — opens the card context menu.

### Card context menu
- Edit (`E`)
- Color ▸ (color swatch submenu — same 8 swatches as the editor picker)
- Labels ▸ (inline label picker — multi-select from existing + `+ New label`)
- Toggle checklist mode
- Duplicate
- Delete (`⌫`)
- Pin / Unpin
- Archive / Restore

### Quick-capture surfaces

**Right-click capture (Background SW).**

- On `runtime.onInstalled`, register two new `contextMenus.create` items in addition to the existing TODO entries:
  - `gb-add-note-selection` — contexts `['selection']`, title `Add selection as note`.
  - `gb-add-note-page` — contexts `['page']`, title `Add page as note`.
- `contextMenus.onClicked` handler reads `info.selectionText` / `info.pageUrl` (truncate to `BODY_MAX`), constructs a `Note`, validates against limits, and calls `notesItem.setValue(next)`.
- For `gb-add-note-page`, the title is `tab.title ?? '(untitled page)'` and the body is the URL.
- For `gb-add-note-selection`, the title is left empty and the selection becomes the body.
- No new permissions — `contextMenus` already declared in Phase 01.

**Bar inline composer.**

- Default click on the Notes icon opens the panel (existing behavior).
- Shift+click on the Notes icon opens a floating composer popover anchored next to the bar icon (same side as the panel). 240 × ~160 px. Single autosizing textarea + Save / Cancel buttons.
- Enter saves; Shift+Enter inserts a newline; Esc cancels and closes. Click outside closes (via `composedPath`).
- Saves to the `All` view with `color: 'default'`, no labels. Does not open the full panel.
- Implementation reuses the panel-popover transform-compensation pattern from `CLAUDE.md` to position correctly inside the shadow root.

### Storage items (this phase, declared in `lib/storage.ts`)
| Item | Type | Storage key | Fallback |
|---|---|---|---|
| `notesItem` | `Note[]` | `local:gb-notes` | `[]` |
| `labelsItem` | `LabelMeta[]` | `local:gb-note-labels` | `[]` |
| `notesUiItem` | `NotesUiState` | `local:gb-notes-ui` | `{ activeView:'all', expanded:false, pinned:false, sidebarCollapsed:false, layout:'list' }` |

Existing items (`positionItem`, `edgeItem`, `transparencyItem`, `activeAppItem`, TODO + PR-provider items) stay untouched.

### App registry change
- `lib/apps/registry.ts`: replace the `jira` entry with a `notes` entry (`id: 'notes'`, `name: 'Notes'`, `Icon: StickyNote`, `Renderer: NotesApp`, `enabled: true`).
- `AppId` union (`lib/apps/types.ts`): drop `'jira'`, add `'notes'`. Codemod usages across the repo (no real runtime carriers — Jira has always been `enabled: false`).
- Migration on read of `activeAppItem`: if the persisted value is `'jira'` (impossible in practice — the icon never shipped — but harmless to handle), map to `null`.
- TODO + GitHub + Bitbucket apps stay enabled and unchanged.

### Options page change
- New `Notes` section in [`entrypoints/options/sections/`](../../../entrypoints/options/sections/):
  - **Export notes as JSON** / **Import JSON** (same pattern as TODO export when it lands in 01b — for v1, just `Export` + `Import` buttons with a file picker).
  - **Storage count** row: `Notes: <n> / 100`. Amber when `n ≥ 90`.
  - **Default color**: dropdown of the 8 swatches. Applied to new notes (right-click + bar composer + inline composer) when set. Default `default`.

### Cross-browser
- Chrome + Edge prod builds verified by full smoke (15 min QA in `verification.md`).
- Firefox build is a stretch goal — verify the build and that the smoke (5 min) passes; document any quirks in `testing-plan.md` §Known issues.

---

## Out of scope (deferred or rejected)

| Item | Where it lands | Why deferred |
|---|---|---|
| Live Markdown preview (split edit/preview, or render-as-you-type) | Future improvement | v1 = explicit Edit ↔ View toggle (Eye icon); `#`/`-`/`>` stay raw in Edit until toggled. Users may expect live render. Add a split-pane or live-render mode later. |
| WYSIWYG rich text (TipTap / Lexical / contentEditable raw) | Parking lot (`03b-notes-rich`) | +150 KB bundle, ProseMirror selection / paste hell across the shadow boundary, JSON-doc storage migration. Ship Markdown v1 first; revisit if usage justifies. |
| Images / file attachments | Parking lot | Blows the `chrome.storage.local` 5 MB cap. Needs IndexedDB and a paste / drop handler. |
| Drawing / ink / handwriting | Rejected | OneNote feature; outside Glimpse anti-goals (a glanceable bar, not a productivity OS). |
| Reminders / due dates on notes | Parking lot | TODO already owns time. If a note needs a due date, it should become a TODO via a future cross-app convert action. |
| Sharing / collaboration / multi-user | Out of project | Local-first, single user. |
| Cross-device sync | Out of project | Same. `chrome.storage.sync` (100 KB cap) cannot hold the note body. |
| Encryption at rest | Out of project | `chrome.storage.local` is per-profile and same-origin. Encrypting a JSON blob with a user-supplied passphrase fights the synchronous read path and adds a forgotten-passphrase footgun. |
| Markdown tables | Phase 03b candidate | Sanitizer allowlist excludes `<table>`; trivial to add later. |
| Code-block syntax highlighting | Rejected v1 | Prism / Shiki adds 50+ KB. Code blocks render in mono via `.gb-prose pre` only. |
| Math / KaTeX | Rejected v1 | Library size + sanitizer config drift. |
| Notebooks / sections (OneNote-style hierarchy) | Rejected v1 | Labels (Keep-style) deliver the same organizing power without nested-tree UX (collapse-all, drag-between-levels, breadcrumbs). |
| Omnibox quick-add (`gn <text>`) | Phase 01b family | Needs the `commands` keyword + manifest entry; lives with the rest of the omnibox work. |
| Floating "quick-capture" button on every page | Rejected | UX clash with the bar (same surface). |
| Drag-to-reorder cards | Parking lot | Manual sort lives in user mental order (most-recently-updated). Drag-to-reorder lands if + when manual-sort label views surface. |
| Pin order within `Pinned` section | Parking lot | Pinned cards sort by `updatedAt` desc v1. Custom pin order needs drag-reorder first. |
| Vitest / Playwright tests | Out of project (this phase) | Per CLAUDE.md "no test framework yet". Pure modules in `lib/notes/` are written test-ready. |

---

## Why this slice

- Notes is the second pure-local app (after TODO). No network, no auth, no third-party schema. Validates the renderer-inside-panel pattern with a different layout shape (cards vs. rows).
- Markdown delivers most of the rich-text wins (headings, lists, code, links, emphasis) at a fraction of the WYSIWYG cost. Bundle is lazy-loaded inside the editor so cold-start is unaffected.
- Quick capture (right-click + bar Shift-click) is the smallest possible Chrome integration that delivers a "wow" beyond the panel itself. No new permissions — `contextMenus` already shipped.
- 100-note × 10 KB cap keeps the storage footprint comfortably under 5 MB. Lets the phase ship without an IndexedDB migration path.
- Cards-first (vs. a TODO-style row list) teaches the panel a second visual layout pattern that later apps (calendar, AI summaries) may want.
