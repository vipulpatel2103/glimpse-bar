# Plan — Notes (WXT)

> Step-by-step build order. Each step ends with a working, demoable build (`pnpm compile && pnpm build` both green) and a single commit. Don't move to step N+1 until the exit criteria of step N pass.

---

## Step 1 — Phase docs (this commit)

**Goal:** Phase 03 fully planned on paper before any code touches.

- [x] Write `docs/phases/03-notes/README.md`.
- [x] Write `docs/phases/03-notes/scope.md`.
- [x] Write `docs/phases/03-notes/plan.md` (this file).
- [x] Write `docs/phases/03-notes/ui-spec.md`.
- [x] Write `docs/phases/03-notes/verification.md`.
- [x] Mark `docs/phases/03-jira/README.md` as **Deferred** with a pointer to the roadmap parking lot.
- [x] Update `docs/phases/README.md` index — replace the `03-jira/` row with a `03-notes/` row (`Active — fully planned (2026-06-03)`).
- [x] Update `docs/roadmap.md` Phase Order table — same flip; add a `Jira` row to the parking-lot section.
- [x] Update `docs/roadmap.md` Decision Log: `2026-06-03 | Pivot Phase 03 from Jira to Notes (Keep-style + Markdown, no images, 100 × 10 KB caps) | Pure-local notes app reuses the renderer-inside-panel pattern, ships without auth, and exercises the panel's card-layout shape. Jira deferred — needs OAuth story we don't have. |`.
- [ ] **Commit:** `docs(phase-03): plan Notes app, defer Jira`.

**Exit criteria:** docs render cleanly in the rendered tree; relative links resolve; the phases index reflects the new status.

---

## Step 2 — Data layer

**Goal:** state model + pure selectors + storage in place. No new UI.

- [ ] Create `lib/notes/types.ts`:
  ```ts
  export type NoteId = string
  export type LabelId = string
  export type ColorToken =
    | 'default' | 'red' | 'orange' | 'yellow'
    | 'green'   | 'teal' | 'blue'   | 'purple' | 'pink'
  export type SystemView = 'all' | 'pinned' | 'archived'

  export interface ChecklistItem {
    id: string
    text: string
    done: boolean
    order: number
  }

  export interface Note {
    id: NoteId
    title: string
    body: string                 // Markdown source
    bodyFormat?: 'md'            // reserved
    color: ColorToken
    labels: LabelId[]
    pinned: boolean
    archived: boolean
    checklist?: ChecklistItem[]  // mutually exclusive with non-empty body
    createdAt: number
    updatedAt: number
  }

  export interface LabelMeta {
    id: LabelId
    name: string
    createdAt: number
  }

  export interface NotesUiState {
    activeView: SystemView | LabelId
    expanded: boolean
    pinned: boolean              // panel-pinned (mirrors TODO pattern)
    sidebarCollapsed: boolean
    layout: 'grid' | 'list'
    defaultColor: ColorToken
  }
  ```
- [ ] Create `lib/notes/limits.ts` exporting `NOTE_LIMITS` (see `scope.md`).
- [ ] Create `lib/notes/dates.ts` — `formatNoteDate(updatedAt, now)` returning `Just now` / `Nm ago` / `Today h:mm a` / `MMM D` per the rules in `ui-spec.md` §4.5.
- [ ] Create `lib/notes/markdown.ts`:
  - `stripMd(body: string): string` — pure regex-based plaintext extractor for card previews; never imports `marked`.
  - `renderMarkdown(body: string): Promise<string>` — lazy-imports `marked` + `dompurify`, returns sanitized HTML with link `target="_blank" rel="noreferrer noopener"`.
- [ ] Create `lib/notes/selectors.ts` — pure functions over `Note[]` + `LabelMeta[]`:
  - `selectAll(items)` — `!archived`, pinned-first, then `updatedAt` desc.
  - `selectPinned(items)` — `pinned && !archived`, `updatedAt` desc.
  - `selectArchived(items)` — `archived`, `updatedAt` desc.
  - `selectByLabel(items, labelId)` — `!archived && labels.includes(labelId)`, `updatedAt` desc.
  - `searchNotes(items, query, labels)` — substring on `title + body + checklist.text + label.name`, returns `updatedAt` desc.
  - `countByView(items, labels)` — `Record<view, number>`.
- [ ] Create `lib/notes/mutations.ts` — pure CRUD returning a new `Note[]`:
  - `addNote(items, partial)` → `{ items, note } | { error: 'limit' }`. Enforces `TOTAL_NOTES_MAX`.
  - `updateNote(items, id, patch)` → `items`. Truncates fields to limits; returns `{ items, truncated: boolean }` when a paste path truncates.
  - `removeNote(items, id)` → `items`.
  - `togglePin(items, id)` / `toggleArchive(items, id)`.
  - `setColor(items, id, color)`.
  - `setLabels(items, id, labels)` — caps at `LABELS_PER_NOTE`.
  - `setChecklistMode(items, id, on)` — converts body ⇄ checklist.
  - `addChecklistItem(items, id, text)` / `toggleChecklistItem(items, id, ciId)` / `removeChecklistItem(items, id, ciId)` / `reorderChecklistItem(items, id, ciId, delta)`.
  - `duplicateNote(items, id)` — clones text + checklist + labels + color; fresh `id` + timestamps; `pinned: false`, `archived: false`.
  - `addLabel(labels, name)` → `{ labels, label }`; rejects duplicate names case-insensitively.
  - `renameLabel(labels, id, name)`.
  - `removeLabel(labels, id, items)` → `{ labels, items }` — removes the label from every note's `labels[]` too.
- [ ] Append to `lib/storage.ts`:
  ```ts
  export const notesItem = storage.defineItem<Note[]>(
    'local:gb-notes', { fallback: [] }
  )
  export const labelsItem = storage.defineItem<LabelMeta[]>(
    'local:gb-note-labels', { fallback: [] }
  )
  export const notesUiItem = storage.defineItem<NotesUiState>(
    'local:gb-notes-ui',
    {
      fallback: {
        activeView: 'all',
        expanded: false,
        pinned: false,
        sidebarCollapsed: false,
        layout: 'list',
        defaultColor: 'default'
      }
    }
  )
  ```
- [ ] Reuse the `uid()` secure-context fallback (CLAUDE.md) for new `NoteId` / `LabelId` / `ChecklistItem.id`. If a shared `lib/uid.ts` does not yet exist, create one now and refactor existing callers in a follow-up step (out of phase scope).
- [ ] **Commit:** `feat(notes): types, storage, selectors, mutations`.

**Exit criteria:** `pnpm compile` green; `pnpm build` green; storage items appear in `chrome://extensions` → service worker → Storage tab on first dev load.

---

## Step 3 — App registry + compact panel skeleton

**Goal:** `<NotesApp />` renders inside the Glimpse Panel for the Notes app. Add / open / delete CRUD works against the All view.

- [ ] Modify `lib/apps/types.ts`:
  - `AppId` union: remove `'jira'`, add `'notes'`.
- [ ] Modify `lib/apps/registry.ts`:
  - Delete the Jira `ALL_APPS` entry; add a `notes` entry above `github`:
    ```ts
    {
      id: 'notes',
      name: 'Notes',
      Icon: StickyNote,
      Renderer: NotesApp,
      enabled: true
    }
    ```
  - Import `StickyNote` from `lucide-react` and `NotesApp` from `~/entrypoints/glimpse.content/components/notes/NotesApp`.
- [ ] Codemod `'jira'` literals across the repo. Expected hits: registry only (the union is exhaustive and TypeScript will flag the rest). Confirm `pnpm compile` is silent.
- [ ] Migration for `activeAppItem`: in `App.tsx`, after the storage value resolves, if `activeApp === 'jira'`, set it to `null`. Single-line guard — the value never shipped real, so this is belt-and-braces.
- [ ] In `entrypoints/glimpse.content/components/`, create `notes/`:
  - `NotesApp.tsx` — top-level. Reads `notesItem`, `labelsItem`, `notesUiItem`. Computes the active view from `notesUiItem.activeView`. Renders `<NotesHeader/>`, `<NotesComposer/>`, `<NotesGrid/>`, `<NoteEditor/>` (mounted lazily when a note is opened).
  - `NotesHeader.tsx` — compact-only for now. Title `▤ All  ▾` + search-toggle stub (disabled in Step 3) + maximize stub (disabled in Step 3) + ⋯ stub.
  - `NotesGrid.tsx` — renders `NoteCard[]` for the active view. Empty state when none.
  - `NoteCard.tsx` — title + plaintext preview (via `stripMd`) + label chips + color stripe + hover-action row (pin / archive / ⋯). Clicking the card opens the editor.
  - `NotesComposer.tsx` — `+ Take a note…` row that expands on focus into a title `<input>` + body `<textarea>` + Save / Cancel. Enter on title focuses body; Cmd/Ctrl+Enter saves; Esc cancels.
- [ ] Modify `entrypoints/glimpse.content/components/GlimpsePanel.tsx`:
  - When `app.id === 'notes'`, render `<NotesApp />` in the body slot and hide the panel's title row (NotesApp owns its own header).
- [ ] Wire CRUD: composer Save → `addNote` → `notesItem.setValue(next)`. Card hover-actions: pin → `togglePin`, archive → `toggleArchive`, ⋯ → context menu (Step 4 expands it).
- [ ] Verify on `https://example.com`:
  - Open Notes panel → empty-state visible.
  - Type `Buy milk` (no body) + Cmd+Enter → card appears.
  - Reload → card persists.
  - Open same site in second tab → card mirrors within ~1 s.
  - Hover card → pin / archive / ⋯ visible. Click pin → pin glyph fills. Click archive → card disappears from All.
- [ ] **Commit:** `feat(notes): compact panel with All view and inline composer`.

**Exit criteria:** all five sub-bullets pass on Chrome.

---

## Step 4 — Markdown editor

**Goal:** click a card to open the rich-ish editor. Markdown body + checklist mode + color + labels.

- [ ] Add deps: `pnpm add marked dompurify` and `pnpm add -D @types/dompurify`. (`marked` ships its own types.) Note the additions in `docs/roadmap.md` Decision Log alongside the Step 1 pivot entry.
- [ ] Build `NoteEditor.tsx` — opens in place when a card is clicked. Layout:
  - Title `<input>` (large, autosize via `field-sizing: content`).
  - Mode toggle (Edit / View) with `Pencil` ↔ `Eye` icons.
  - **Edit mode:** `<textarea maxLength={NOTE_LIMITS.BODY_MAX}>` with `useDeferredValue` to debounce character-count recompute.
  - **View mode:** `<div className="gb-prose" dangerouslySetInnerHTML={{ __html: rendered }} />`. The render call lives behind `renderMarkdown` (lazy import; suspended via a `useEffect` + state).
  - Default mode on open: `view` when `body` non-empty, `edit` when empty.
  - Counter chip bottom-right: `1,234 / 10,000`. Color: `text-gb-text-muted` until `BODY_WARN`, `text-amber-500` until `BODY_MAX`, `text-red-500` at cap. Reuses the `NOTE_LIMITS` import.
  - Color swatch row (8 swatches) above the editor — clicking applies `setColor` immediately + persists.
  - Label chips inline at the bottom: existing labels render as `Chip` components; `+` button opens a small popover with autocomplete + create.
  - Checklist toggle button: switches between Markdown body and checklist editor (mutually exclusive in v1). When switching on, parse `- [ ] line` patterns out of the existing body into checklist items; when switching off, serialize the checklist back to `- [ ] line` Markdown.
  - Persist all mutations through `updateNote` on blur + debounced 400 ms.
- [ ] Add `entrypoints/glimpse.content/style.css` ruleset (~30 lines, shadow-scoped):
  ```css
  .gb-prose h1 { font-size: 18px; font-weight: 600; margin-block: 8px 4px; }
  .gb-prose h2 { font-size: 15px; font-weight: 600; margin-block: 8px 4px; }
  .gb-prose h3 { font-size: 14px; font-weight: 600; margin-block: 6px 4px; }
  .gb-prose p { margin-block: 4px; line-height: 1.5; }
  .gb-prose ul, .gb-prose ol { padding-inline-start: 20px; margin-block: 4px; }
  .gb-prose li { margin-block: 2px; }
  .gb-prose code {
    background: rgba(0,0,0,0.06); padding: 1px 4px; border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px;
  }
  .gb-prose pre {
    background: rgba(0,0,0,0.06); padding: 8px; border-radius: 6px;
    overflow-x: auto; font-size: 12px;
  }
  .gb-prose blockquote {
    border-inline-start: 3px solid var(--gb-divider-soft);
    padding-inline-start: 8px; color: var(--gb-text-muted);
  }
  .gb-prose a { color: var(--gb-link); text-decoration: underline; }
  .gb-prose hr { border: 0; border-top: 1px solid var(--gb-divider-soft); margin-block: 8px; }
  /* dark-mode adjustments via :host([data-theme="dark"]) … */
  ```
- [ ] DOMPurify config:
  ```ts
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','ul','ol','li','strong','em','code','pre','blockquote','a','hr','br'],
    ALLOWED_ATTR: ['href'],
    FORBID_TAGS: ['img','iframe','video','audio','script','style'],
    FORBID_ATTR: ['style','on*'],
    ALLOWED_URI_REGEXP: /^(https?:|mailto:|tel:)/i,
  })
  ```
- [ ] Post-sanitize pass: walk the fragment, set `target="_blank" rel="noreferrer noopener"` on every `<a>`.
- [ ] Verify:
  - Click a card → editor opens in View mode for non-empty notes.
  - Toggle to Edit → counter visible. Type past 9 000 chars → counter goes amber. Hit 10 000 → input refuses further keystrokes.
  - Paste 50 KB doc → editor truncates to 10 000 chars + shows toast `Note clipped to 10,000 chars`.
  - Open a card with body `<script>alert(1)</script><a href="javascript:alert(1)">x</a>` → renders the link as inert text (or stripped link), no alert.
  - Click a label chip → opens picker; pick an existing → applied. Type a new name → Enter creates + applies.
  - Switch color swatch → card border / accent updates immediately + persists.
  - Toggle checklist mode → body converts; toggle off → body restores Markdown serialization.
- [ ] **Commit:** `feat(notes): markdown editor with color, checklist, labels`.

**Exit criteria:** XSS attempt above renders safely; editor opens in < 200 ms after card click. Note: `marked` + `DOMPurify` (~85 KB) are **inlined** into `content-scripts/glimpse.js` — WXT can't code-split content-script dynamic imports (documented in CLAUDE.md). The earlier "cold-bundle delta ~0" assumption was wrong; the dynamic `import()` only defers module init, not parse.

---

## Step 5 — Views: All / Pinned / Archived / Label

**Goal:** four-way navigation. Sidebar in expanded; dropdown in compact.

- [ ] Build `NotesHeader.tsx`'s view dropdown (compact). Click title → popover anchored below with sections: System views (Pinned / All / Archived) + Labels + `+ New Label`. Each row: 12 px Lucide icon + label + count.
- [ ] Wire counts via `countByView(items, labels)` memoized on `(items, labels)`.
- [ ] Implement `All` rendering: `Pinned` group header above pinned cards, `Others` group header above the rest.
- [ ] Implement `Pinned` rendering: same as All but only the Pinned group; no group header.
- [ ] Implement `Archived` rendering: card row has `Restore` (`ArchiveRestore` Lucide) + `Delete forever` (`Trash2`) hover actions only.
- [ ] Implement label-view rendering: cards filtered by label; group headers omitted.
- [ ] Build the `+ New Label` row → opens a prompt-driven inline input → `addLabel` mutation.
- [ ] Build label rename / delete via right-click on the label item: `Rename` (inline rename) + `Delete` (removes label from all notes; tasks reappear in the parent view).
- [ ] Empty state per view (`ui-spec.md` §9). Copy:
  - All: `No notes yet. Take a note above or right-click on any page.`
  - Pinned: `No pinned notes. Pin one to keep it on top.`
  - Archived: `Archive is empty.`
  - Custom label: `No notes in “<label>” yet.`
- [ ] Persist `activeView` on switch.
- [ ] Verify: switch views, counts update live as you pin / archive / change labels.
- [ ] **Commit:** `feat(notes): views, pin section, labels nav`.

**Exit criteria:** all four view types switchable; counts correct; reload preserves last-active view; label CRUD works.

---

## Step 6 — Search

**Goal:** find a note by content.

- [ ] Add a search-toggle button to `NotesHeader.tsx` (`Search` Lucide). Toggling reveals an inline `<input>` that replaces the title row.
- [ ] In expanded mode, the search input is always visible in the header (no toggle).
- [ ] Wire `searchNotes` over the active view's items (so search respects the active filter — e.g., searching while in the Archived view searches only archived notes).
- [ ] Empty result state: `No notes match "<query>".`. Show under the active view's empty-state slot.
- [ ] Debounce the input to 120 ms via `useDeferredValue`.
- [ ] Esc clears the query and closes the search bar in compact.
- [ ] Verify:
  - Type `milk` → only matching cards remain.
  - Clear input → full view restored.
  - Search inside Archived → archived-only matches.
  - Search hits a label name → cards carrying that label appear.
- [ ] **Commit:** `feat(notes): full-text search`.

**Exit criteria:** search is instant (< 16 ms per keystroke) for the 100-note worst case; no scroll jank.

---

## Step 7 — Right-click capture

**Goal:** capture from the host page without opening the panel.

- [ ] Extend `entrypoints/background.ts`:
  - On `runtime.onInstalled`, register two additional `contextMenus.create` items alongside the TODO entries:
    ```ts
    chrome.contextMenus.create({
      id: 'gb-add-note-selection',
      title: 'Add selection as note',
      contexts: ['selection'],
    })
    chrome.contextMenus.create({
      id: 'gb-add-note-page',
      title: 'Add page as note',
      contexts: ['page'],
    })
    ```
  - `contextMenus.onClicked` handler:
    - Read `info.selectionText` / `info.pageUrl` (truncate to `NOTE_LIMITS.BODY_MAX`).
    - For `gb-add-note-page`: `title = tab.title ?? '(untitled page)'`, `body = pageUrl`.
    - For `gb-add-note-selection`: `title = ''`, `body = info.selectionText`.
    - Read current `notesItem.getValue()`; run `addNote` mutation; respect `defaultColor` from `notesUiItem`.
    - If `addNote` returns `{ error: 'limit' }`, show a toast via `chrome.notifications` is **out of scope** — instead, broadcast a `runtime.sendMessage({ type: 'notesLimitReached' })` and let the content script render an in-shadow toast. Background SW silently no-ops if no listener.
- [ ] No new manifest permissions — `contextMenus` already declared in Phase 01. Confirm in `wxt.config.ts`.
- [ ] Verify:
  - Highlight text on `https://news.ycombinator.com` → right-click → `Add selection as note` appears → click → open Notes panel → card appears in `All` with the selected text as body.
  - Right-click anywhere → `Add page as note` → card with page title + URL appears.
  - Fill notes to 100 → next capture toasts `Note limit reached (100)` and does not add.
- [ ] **Commit:** `feat(notes): right-click capture to new note`.

**Exit criteria:** both context-menu items work on at least 3 hard-case sites (`example.com`, `github.com`, `chatgpt.com`); limit-reached toast surfaces correctly.

---

## Step 8 — Bar inline quick-note composer

**Goal:** Shift+click on the bar's Notes icon opens a tiny composer popover. Save without opening the full panel.

- [ ] Extend `AppIconButton.tsx` (bar tile): on `pointerdown` with `e.shiftKey === true` for the Notes app, dispatch a `quickComposeRequested` event instead of toggling the panel.
- [ ] Build `NotesQuickCompose.tsx` (mounted by the bar root, not by NotesApp — must survive panel-close state):
  - 240 px wide, ~160 px tall. Anchored next to the bar icon, opening away from the edge.
  - Single autosizing `<textarea>` + Save / Cancel buttons.
  - Enter saves; Shift+Enter newline; Esc cancels; click outside closes (via `composedPath`).
  - Save → `addNote({ body: text, title: '', color: defaultColor })` → flashes a tiny check + closes.
  - Limit reached → renders an inline error `Note limit reached (100)`.
- [ ] Use the transform-compensation pattern from `CLAUDE.md` (panel's residual transform) so the popover anchors correctly even when the bar lives inside a transformed parent. The bar root is **not** transformed in steady state, but use the safety pattern anyway — future motion changes shouldn't silently break this.
- [ ] Verify:
  - Shift+click on Notes icon → composer appears → type → Enter → composer closes → open the panel → card is in `All`.
  - Click outside → composer closes without saving.
  - Esc → same.
  - Toggle drag on the bar while composer is open → composer closes (don't fight the drag).
- [ ] **Commit:** `feat(notes): bar inline quick-note composer`.

**Exit criteria:** composer renders inside the shadow root with correct positioning on both edges (left + right); never traps clicks outside itself.

---

## Step 9 — Expanded mode + sidebar + layout toggle

**Goal:** maximize button widens the panel and reveals a sidebar. Grid / list layout toggle.

- [ ] Add `Maximize2` / `Minimize2` Lucide button to `NotesHeader.tsx`. Hidden if `vw < 720`.
- [ ] `GlimpsePanel.tsx` already accepts an `expanded` prop from the TODO phase — reuse, don't fork.
- [ ] Build `NotesSidebar.tsx` (rendered only when `expanded === true`):
  - 200 px fixed width. Sections: system views (Pinned / All / Archived) + Labels + `+ New Label`.
  - Active view row: `gb-row-active`, 600 weight (TODO token reuse).
  - Label items: 12 px `Tag` Lucide + name + count.
- [ ] Add layout toggle to the header: `LayoutGrid` ↔ `List`. Persists to `notesUiItem.layout`.
- [ ] `NotesGrid.tsx` renders 1 column when `layout === 'list'` OR compact, 2 columns when `layout === 'grid'` AND expanded.
- [ ] Persist `expanded`, `sidebarCollapsed`, `layout` via `notesUiItem`.
- [ ] When expanded, the compact header dropdown collapses (becomes a static title showing the active view's name only; sidebar drives switching).
- [ ] Verify:
  - Maximize → smooth width tween → sidebar appears → reload preserves expanded state.
  - Resize viewport down to 700 px → maximize button hides; if previously expanded, panel falls back to compact.
  - Layout toggle: 2 cols in expanded grid, 1 col in compact regardless.
  - Drag bar to left edge while expanded → panel anchors correctly to the left.
- [ ] **Commit:** `feat(notes): expanded mode and layout toggle`.

**Exit criteria:** smooth width transition; sidebar wired; viewport-fallback works; layout toggle persists.

---

## Step 10 — Polish + Options + verification

> **Status (2026-06-03):** Shipped — Options Notes section (count `n/100` + amber@90, default-color picker, Export/Import JSON with label-merge + cap-aware import), card keyboard shortcuts (`E`/Enter open, `P` pin, `⌫` archive, `Shift+⌫` delete), editor `Esc`-to-close (stops at the panel so it doesn't dismiss the whole panel; label-picker `Esc` stops at the popover), `console.log` audit (none in notes code), reduced-motion (popovers/header/quick-compose already honor it; editor mode-swap + composer expand are instant — no animation to gate). Cross-cutting docs synced: `requirements.md` (FR-APPS-6, FR-OPT-5, phase legend), `architecture.md` (storage items), `CLAUDE.md` (registry line + the WXT-inlines-dynamic-import convention from Step 4).
>
> **Deferred (not blocking):** arrow-key (`↑↓←→`) roving focus across the card grid — browser `Tab` already moves between cards (each is `tabIndex=0`); undo toast on archive/delete — matches the TODO phase, which also left its undo toast for later. Both noted here rather than silently dropped.

- [ ] Build the Glimpse Option Page Notes section:
  - **Notes: <n> / 100** count row. Amber when `n ≥ 90`. Reads `notesItem`.
  - **Default color** dropdown — 8 swatches + `default`. Writes to `notesUiItem.defaultColor`.
  - **Export notes as JSON** button → `Blob` download named `glimpse-notes-YYYY-MM-DD.json`.
  - **Import JSON** button → file picker → validates shape with a small schema-guard → merges into `notesItem` (dedupes by `id`; new IDs minted on collision).
- [ ] Reduced-motion: width tween + popover scale-in + editor mode-swap honor `prefers-reduced-motion: reduce` (durations → 0). Reuse `usePrefersReducedMotion`.
- [ ] Keyboard shortcuts inside NotesApp:
  - `Enter` in composer title → focus body. `Cmd/Ctrl+Enter` → save.
  - `Esc` → close any popover / cancel edit.
  - `E` → edit focused card.
  - `⌫` → archive focused card; show a `Undo` toast for 5 s.
  - `Shift+⌫` → delete focused card permanently; show `Undo` toast for 5 s.
  - `P` → toggle pin on focused card.
  - `↑/↓ ←/→` → move card focus across the grid.
- [ ] Audit `console.log` / debug exposure left from Step 2.
- [ ] Smoke test on the five hard-case sites in `testing-plan.md` §2.3.
- [ ] Tick every box in `verification.md`.
- [ ] Add a "Notes: lazy-load Markdown deps from editor only" entry to `CLAUDE.md` Critical conventions if a non-obvious learning emerges (e.g., DOMPurify config + link rel pass).
- [ ] Update cross-cutting docs (`requirements.md` FR-APPS row, `architecture.md` storage table, `ui-design.md` color tokens) wherever shipped code drifted.
- [ ] **Commit:** `chore(phase-03): polish and verification`.

**Exit criteria:** Definition of Done in `verification.md` ticked end-to-end on Chrome; smoke green on Edge + Firefox.

---

## Definition of Done — Notes phase

- [ ] All AC sections in [`verification.md`](verification.md) pass on Chrome.
- [ ] Smoke (5 min) passes on Edge + Firefox.
- [ ] No `console.error` from Glimpse code on the 5 hard-case sites.
- [ ] All 10 steps committed.
- [ ] [`scope.md`](scope.md), [`ui-spec.md`](ui-spec.md), [`README.md`](README.md) reflect what was actually shipped.
- [ ] Cross-cutting docs reviewed for drift.
- [ ] Tag the commit `notes/done` (mirror Phase 00 / 01 / 02 convention).
