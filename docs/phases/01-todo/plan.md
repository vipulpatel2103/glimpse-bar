# Plan — TODO (WXT)

> Step-by-step build order. Each step ends with a working, demoable build (`pnpm compile && pnpm build` both green) and a single commit. Don't move to step N+1 until the exit criteria of step N pass.

---

## Step 1 — Phase docs (this commit)

**Goal:** Phase 01 fully planned on paper before any code touches.

- [x] Replace `docs/phases/01-todo/README.md` (drop the "Stub" disclaimer).
- [x] Write `docs/phases/01-todo/scope.md`.
- [x] Write `docs/phases/01-todo/plan.md` (this file).
- [x] Write `docs/phases/01-todo/ui-spec.md`.
- [x] Write `docs/phases/01-todo/verification.md`.
- [x] Update `docs/phases/README.md` index — flip the TODO row from `Stub` → `Active — fully planned`.
- [x] Update `docs/roadmap.md` Phase Order table — same flip.
- [ ] **Commit:** `docs(phase-01): plan TODO feature scope and UI`.

**Exit criteria:** docs render cleanly in the rendered tree; relative links resolve; the phases index reflects the new status.

---

## Step 2 — Data layer

**Goal:** state model + pure selectors + storage in place. No new UI.

- [ ] Create `lib/todos/types.ts`:
  ```ts
  export type TodoId = string;
  export type ListId = string;
  export type SystemView = 'today' | 'upcoming' | 'inbox' | 'completed';

  export interface TodoItem {
    id: TodoId;
    listId: ListId;
    parentId?: TodoId;
    text: string;
    done: boolean;
    doneAt?: number;
    createdAt: number;
    updatedAt: number;
    dueAt?: number;
    order: number;
    // Reserved for Phase 01b — must accept undefined silently
    priority?: 1 | 2 | 3 | 4;
    recurrence?: { kind: 'daily' | 'weekly' | 'monthly'; interval: number };
    remindAt?: number;
  }

  export interface ListMeta {
    id: ListId;
    name: string;
    sort: 'manual' | 'date' | 'alpha';
    newTaskPosition: 'top' | 'bottom';
    showCompleted: 'never' | 'today' | '30d' | 'always';
    createdAt: number;
  }

  export interface TodoUiState {
    activeView: SystemView | ListId;
    expanded: boolean;
    pinned: boolean;
    sidebarCollapsed: boolean;
  }
  ```
- [ ] Create `lib/todos/dates.ts` with: `startOfDay`, `endOfDay`, `addDays(ts, n)`, `dayKey(ts)` (`YYYY-MM-DD`), `formatDayLabel(ts, now)` returning one of `Today` / `Tomorrow` / `Mon`–`Sun` / `MMM D` per the rules in `ui-spec.md` §4.4.
- [ ] Create `lib/todos/selectors.ts` — pure functions over `TodoItem[]` + `ListMeta[]`:
  - `selectToday(items, now)` — `(dueAt < endOfDay(now)) && !done && !parentId`.
  - `selectUpcoming(items, now)` — items with `dueAt` in `(endOfDay(now), endOfDay(now)+7d]`, sorted by `dueAt`, grouped by `dayKey(dueAt)`.
  - `selectInbox(items)` — `dueAt == null && listId == 'inbox' && !parentId && !done`.
  - `selectList(items, listId)` — items in a custom list, root level (no parent).
  - `selectCompleted(items, list, now)` — `done`, filtered by `list.showCompleted` window.
  - `selectChildren(items, parentId)` — subtasks for a parent.
  - `countByView(items, lists, now)` — `Record<view, number>`.
- [ ] Create `lib/todos/mutations.ts` — pure CRUD that returns a new `TodoItem[]`: `addTodo`, `updateTodo`, `removeTodo`, `toggleDone`, `duplicateTodo`, `setDueAt`, `addSubtask`, `reorderTodo` (move up/down within `(listId, parentId)`).
- [ ] Append to `lib/storage.ts`:
  ```ts
  export const todosItem = storage.defineItem<TodoItem[]>(
    'local:gb-todos', { fallback: [] }
  );
  export const listsItem = storage.defineItem<ListMeta[]>(
    'local:gb-lists', { fallback: [seedInbox()] }
  );
  export const todoUiItem = storage.defineItem<TodoUiState>(
    'local:gb-todo-ui',
    { fallback: { activeView: 'today', expanded: false, pinned: false, sidebarCollapsed: false } }
  );
  ```
- [ ] Inbox seeding — on first read of `listsItem`, ensure an `inbox` entry exists (if user wiped storage, `seedInbox()` regenerates it). Do NOT regenerate when the user has a populated lists array missing inbox — that means we deleted it; treat as a bug instead.
- [ ] Verify in DevTools: `pnpm dev` → run `(await listsItem.getValue())` in the page console (after exposing items for a temp debug). Roll back debug exposure before commit.
- [ ] **Commit:** `feat(todos): types, storage, and pure selectors`.

**Exit criteria:** `pnpm compile` green; `pnpm build` green; storage items appear in `chrome://extensions` → service worker → Storage tab.

---

## Step 3 — Compact panel skeleton + Today view CRUD

**Goal:** `<TodoApp />` renders inside the Glimpse Panel for the TODO app. Today view supports add / toggle / delete with persistence.

- [ ] In `entrypoints/glimpse.content/components/`, create `todo/`:
  - `TodoApp.tsx` — top-level. Reads `todosItem`, `listsItem`, `todoUiItem`. Computes `view` from `todoUiItem.activeView`. Renders `<TodoHeader/>`, `<TodoListView/>`, `<TodoNewRow/>`.
  - `TodoHeader.tsx` — compact-only for now. Title `◐ Today  ▾` + maximize stub (disabled in Step 3) + ⋯ list-config stub.
  - `TodoListView.tsx` — renders `TodoRow[]` for the active view. Empty state when none.
  - `TodoRow.tsx` — checkbox + text + (Step 5) day chip + (Step 5) hover actions. For Step 3: checkbox + text + delete button on hover.
  - `TodoNewRow.tsx` — `+ New task` row. Enter commits; Esc cancels; respects current list's `newTaskPosition`.
- [ ] Modify `entrypoints/glimpse.content/components/GlimpsePanel.tsx`:
  - When `app.id === 'todo'`, render `<TodoApp />` in the body slot instead of the placeholder copy.
  - Header: keep the 44 px title row but **hide it** when the body is `<TodoApp />` — TodoApp owns its own header for compact mode (cleaner).
- [ ] Modify `lib/apps/registry.ts`:
  - Replace TODO app's `Renderer: PlaceholderRenderer` with `Renderer: TodoApp`.
- [ ] Wire CRUD: add → `addTodo` mutation → `todosItem.setValue(...)`. Toggle done → `toggleDone`. Delete → `removeTodo`.
- [ ] Verify on `https://example.com`:
  - Open TODO panel → empty state visible.
  - Type `Buy milk` + Enter → row appears.
  - Reload → row persists.
  - Open same site in second tab → row mirrors within ~1 s.
  - Check checkbox → strikethrough + dim.
  - Hover row → delete icon → click → row gone.
- [ ] **Commit:** `feat(todos): compact panel with Today view and inline add`.

**Exit criteria:** all five sub-bullets in the verify list pass on Chrome.

---

## Step 4 — Upcoming / Inbox / Completed views + counts

**Goal:** four system views switchable via header dropdown; live counts.

- [ ] Build `TodoHeader.tsx`'s view dropdown (compact). Click title → popover anchored below the title with the four system views. Each row: icon + name + count (right-aligned). Closes on outside click + Esc.
- [ ] Wire counts via `countByView(items, lists, now)` memoized on `(items, lists, now-bucket)` (1 min granularity).
- [ ] Implement `Upcoming` rendering: group rows by day header (`Tomorrow`, `Thursday`, `Apr 30`).
- [ ] Implement `Inbox` rendering — flat list, no day grouping.
- [ ] Implement `Completed` rendering — sorted `doneAt` desc, throttled by `list.showCompleted`. Show a count in the header (e.g., `Completed (29)`).
- [ ] Empty state per view (one-line muted copy + a faint Lucide illustration ≤ 32 px). Copy:
  - Today: `Nothing scheduled. Pick a task from Inbox.`
  - Upcoming: `Calendar's clear for the next week.`
  - Inbox: `Inbox is empty. Capture something with right-click → Add selection as task.` (Step 9 makes that real.)
  - Completed: `No tasks completed yet.`
- [ ] Persist `activeView` on switch.
- [ ] Verify: switch views, counts update live as you toggle done / change dates from devtools.
- [ ] **Commit:** `feat(todos): Today/Upcoming/Inbox/Completed views`.

**Exit criteria:** all four views switchable; counts correct; reload preserves last-active view.

---

## Step 5 — Due dates + chips + rollover

**Goal:** dates land. Quick chips, day chip, rollover.

- [ ] Create `DatePopover.tsx`:
  - Anchored to the row's calendar icon (or context-menu Date entry).
  - Quick chips: `Today` · `Tomorrow` · `This Weekend` · `Next Week` · `Pick date…`.
  - Picker uses native `<input type="date">` with `min={today}`.
  - Selecting a chip writes `setDueAt` mutation and closes the popover.
  - "Remove date" link at the bottom.
- [ ] Add hover quick-action icons to `TodoRow.tsx`:
  - Schedule today (`Sun` Lucide) — `setDueAt(startOfDay(today))`.
  - Remove date (`CalendarOff`) — `setDueAt(undefined)`.
  - Open picker (`Calendar`) — opens DatePopover.
  - More (`MoreHorizontal`) — opens context menu (Step 6).
- [ ] Day chip on row: when `dueAt` set, show a small pill on the right edge of the row text. Sun glyph for today, calendar glyph + day-label for others, red-dot indicator if overdue. Tooltip `Due Thu` via HTML `title` attr.
- [ ] Rollover ticker: in `TodoApp.tsx`, set up a 60 s `setInterval` that bumps a `now` state. Selectors recompute. Cleared on unmount.
- [ ] Verify:
  - Add a task, schedule `Tomorrow` → it leaves Today, appears in Upcoming under tomorrow's day header.
  - Schedule `Today` → returns to Today.
  - Schedule a date in the past via DevTools (`setDueAt(yesterday)`) → appears in Today (rollover).
  - Hover over chip → tooltip reads `Due Thu` (or appropriate day).
- [ ] **Commit:** `feat(todos): due dates with quick chips and rollover`.

**Exit criteria:** task can move between views purely by changing `dueAt`. No mutation of `dueAt` on rollover (use selector logic).

---

## Step 6 — Edit, duplicate, subtasks, context menu

**Goal:** rich per-task actions.

- [ ] Inline edit in `TodoRow.tsx`: clicking the text swaps to a contenteditable `<input>` (or contenteditable span). Enter saves trimmed value (empty → delete). Esc reverts. Blur saves.
- [ ] Create `ContextMenu.tsx`:
  - Triggers: right-click on row, or the more (⋯) hover icon, or `E` keypress with row focused.
  - Items in order: `Edit (E)`, `Date ▸` (submenu reusing DatePopover), `Add subtask`, `Duplicate`, `Delete (⌫)`.
  - Keyboard: `↑↓` cycles items, `Enter` activates, `Esc` closes. First item focused on open.
  - Anchored to the trigger; flips above when near the viewport bottom.
- [ ] Subtasks:
  - `TodoRow.tsx` shows an expand chevron when `selectChildren(items, row.id).length > 0`. Default: expanded for tasks with `< 5` subtasks; user toggle persisted in component-local state for the session (no storage in v1).
  - `TodoSubtasks.tsx` renders child rows + a `+ New subtask` row at the bottom.
  - Context-menu `Add subtask` focuses that input.
- [ ] Duplicate via `duplicateTodo` mutation: clones text, due date, list. New `id`, new `createdAt`, `done: false`, fresh `order`, no children.
- [ ] Verify:
  - Edit, save with Enter → text persists across reload.
  - Right-click row anywhere on page → menu appears (within the shadow root).
  - Add subtask → expand chevron appears → child row visible → check it independently → unaffected by parent.
  - Delete parent → all children gone (verify in DevTools storage).
- [ ] **Commit:** `feat(todos): edit, duplicate, subtasks, and context menu`.

**Exit criteria:** all five context-menu items work; subtasks persist; deletion cascades.

---

## Step 7 — Custom lists + per-list config

**Goal:** users can create lists; each list has its own sort / position / show-completed / pin.

- [ ] In compact mode, the header dropdown grows a `Lists` section below the system views. `+ New List` row at the bottom (prompt-driven for v1; rename inline; delete moves items to Inbox).
- [ ] Inbox is the only list that cannot be renamed or deleted. UI hides those affordances for Inbox.
- [ ] Create `ListConfigMenu.tsx` (footer ⋯ in TodoApp):
  - Sort: Manual / Date / Alpha (radio group). Manual sort surfaces `↑ Move up` / `↓ Move down` items in the row context menu (drag handle deferred).
  - Add new tasks at: Top / Bottom (radio).
  - Show completed: Never / Today / 30 days / Always (radio).
  - Pin panel: toggle. When on, the panel ignores outside-click and the maximize button shows a small dot indicator.
- [ ] `App.tsx` outside-click handler honors `todoUiItem.pinned` (don't close the panel when pinned). Esc + close button still work.
- [ ] Persist all list config via `listsItem.setValue(...)`.
- [ ] Verify:
  - Create a list `Reading`. Switch to it.
  - Add 3 tasks. Reorder via the row context menu (Manual sort).
  - Set Show completed → `Never`. Tick a task → it disappears.
  - Pin panel. Click outside → panel stays open. Toggle off → outside-click closes.
  - Delete `Reading` list → tasks land in Inbox.
- [ ] **Commit:** `feat(todos): custom lists and per-list configuration`.

**Exit criteria:** list lifecycle (create / rename / delete) works; per-list config survives reload; pin behavior verified.

---

## Step 8 — Expanded mode + sidebar

**Goal:** maximize button toggles a wider panel with a sidebar.

- [ ] Add `Maximize2` / `Minimize2` Lucide button to `TodoHeader.tsx`. Hidden if `vw < 720`.
- [ ] `GlimpsePanel.tsx` accepts an `expanded` prop and tweens `width` between `compactW = 360` and `expandedW = min(720, vw - 68)`. Tween only when `isDragging === false`.
- [ ] Width animation: 280 ms ease-out open, 200 ms ease-in close. Use the same cubic-beziers as the slide animation (`[0.32, 0.72, 0, 1]` and `[0.4, 0, 1, 1]`).
- [ ] Build `TodoSidebar.tsx` (rendered only when `expanded === true`):
  - 200 px fixed width. Top: `☑ Tasks ▾` (no behavior beyond decoration). Then four system views with counts. Then a `Lists` header. Then `+ New List`.
  - Active view row: `bg-black/[0.04] dark:bg-white/[0.06]`, 600 weight.
- [ ] Persist `expanded` + `sidebarCollapsed` via `todoUiItem`.
- [ ] When expanded, the compact header dropdown collapses (becomes a static title showing the active view's name only; sidebar drives switching).
- [ ] Verify:
  - Click maximize → smooth width tween → sidebar appears → reload preserves expanded state.
  - Resize viewport down to 700 px → maximize button hides; if previously expanded, panel falls back to compact.
  - Drag bar to left edge while expanded → panel anchors correctly to the left.
- [ ] **Commit:** `feat(todos): expanded mode with sidebar`.

**Exit criteria:** smooth width transition; sidebar fully wired; viewport-fallback works.

---

## Step 9 — Right-click capture + badge counter

**Goal:** Chrome integrations land.

- [ ] Add `'contextMenus'` to `wxt.config.ts` `manifest.permissions`.
- [ ] Update `docs/roadmap.md` Decision Log with one row:
  - `2026-04-28 | Add contextMenus permission for "Add selection as task" capture | Smallest possible Chrome integration that delivers a useful feature; benign permission widely understood by users.`
- [ ] Extend `entrypoints/background.ts`:
  - On `runtime.onInstalled`, register two `contextMenus.create` items: `gb-add-selection` (contexts `['selection']`, `Add selection as task`) and `gb-add-page` (contexts `['page']`, `Add page as task`).
  - `contextMenus.onClicked` handler:
    - Read `info.selectionText` or `info.pageUrl` (truncate to 280 chars).
    - Call `todosItem.getValue()` → mutate → `todosItem.setValue(next)`. New item lands in Inbox with `dueAt: undefined`.
    - For `gb-add-page`, prefix text with `tab.title` if present, else use the URL.
  - Badge updater:
    - Subscribe via `todosItem.watch((next) => updateBadge(next))`.
    - Compute count of `selectToday(next, Date.now()).length`.
    - `chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' })`.
    - `chrome.action.setBadgeBackgroundColor({ color: '#2563eb' })`.
    - Also call once on SW startup (in case watch missed an update during install).
  - Day-rollover handling for badge: register `chrome.alarms` is **out of scope** (Phase 01b). Instead, recompute on every storage change; the badge will be slightly stale at midnight if no edits happen — accept this for v1 and document.
- [ ] Verify:
  - Highlight text on `https://news.ycombinator.com` → right-click → `Add selection as task` appears → click → open Inbox in panel → task is there with selected text.
  - Right-click anywhere on a page → `Add page as task` → open Inbox → task with page title appears.
  - Add 3 tasks `dueAt: today` → extension toolbar icon shows `3`. Complete one → updates to `2`. Clear all → badge clears.
  - Cross-tab: badge updates regardless of which tab created the change.
- [ ] **Commit:** `feat(todos): right-click capture and badge counter`.

**Exit criteria:** both context-menu items work on at least 3 hard-case sites (`example.com`, `github.com`, `chatgpt.com`); badge text accurate.

---

## Step 10 — Polish + verification

- [ ] Empty-state illustrations finalized (any Lucide icon at 32 px, `text-gb-text-muted/50`).
- [ ] Strikethrough animation on done-toggle: 200 ms `text-decoration` + opacity (row text only — never panel surface).
- [ ] Keyboard shortcuts inside TodoApp:
  - `Enter` in `+ New task` → commit
  - `Esc` → close any popover / cancel edit
  - `E` → edit focused row
  - `⌫` → delete focused row (with one-step undo via inline `Undo` toast — 3 s window)
  - `↑/↓` → move row focus
- [ ] Reduced-motion: width transition + popover scale-in honor `prefers-reduced-motion: reduce` (durations → 0).
- [ ] Audit `console.log` / debug exposure left from Step 2.
- [ ] Smoke test on the five hard-case sites in `testing-plan.md` §2.3.
- [ ] Tick every box in `verification.md`.
- [ ] Add a "TODO panel: expanded mode + width animation" entry to `CLAUDE.md` Critical conventions if any non-obvious learning emerges (e.g., width tween fights with bar drag → must lock during drag).
- [ ] Update cross-cutting docs (`requirements.md`, `architecture.md`, `ui-design.md`) wherever shipped code drifted.
- [ ] **Commit:** `chore(phase-01): polish and verification`.

**Exit criteria:** Definition of Done in `verification.md` ticked end-to-end on Chrome; smoke green on Edge + Firefox.

---

## Definition of Done — TODO phase

- [ ] All AC sections in [`verification.md`](verification.md) pass on Chrome.
- [ ] Smoke (5 min) passes on Edge + Firefox.
- [ ] No `console.error` from Glimpse code on the 5 hard-case sites.
- [ ] All 10 steps committed.
- [ ] [`scope.md`](scope.md), [`ui-spec.md`](ui-spec.md), [`README.md`](README.md) reflect what was actually shipped.
- [ ] Cross-cutting docs reviewed for drift.
- [ ] Tag the commit `todo/done` (mirror Phase 00 convention).
