# Scope — TODO

## In scope

### Tasks
- Add via inline `+ New task` row (Enter commits; Esc cancels; empty input does nothing).
- Edit inline (click row text → editable input; Enter saves; Esc reverts; blur saves trimmed value; empty save deletes).
- Toggle complete via row checkbox (strikethrough + 50 % dim animation, 200 ms).
- Delete (hover icon, context menu, or `⌫` with row focused).
- Duplicate (context menu → `Duplicate`).
- Subtasks — **one level deep only**. Each subtask is a `TodoItem` with `parentId`. `+ New subtask` row appears under expanded parent. Deleting a parent deletes its children.
- Convert task → parent automatically when first subtask is added; UI reveals expand chevron without an explicit "convert" action.
- Capture page selection (right-click → `Add selection as task`) and page URL (right-click → `Add page as task`). Both land in **Inbox** with `dueAt: null`.

### Views
- **Today** — `(dueAt ≤ endOfToday) AND !done` (so overdue items roll up here without mutating `dueAt`).
- **Upcoming** — next 7 days excluding today, grouped by day header (`Tomorrow`, `Thursday`, `Apr 30`, …).
- **Inbox** — `dueAt == null AND listId == 'inbox' AND !parentId`. Subtasks of dated parents do not surface here.
- **Completed** — `done == true`, sorted `doneAt` desc, capped per list's `showCompleted` config.
- **Custom lists** — user-created. Each holds its own task set + own per-list config.

### Navigation
- **Compact (default, panel width 360 px):** header shows current view as a dropdown (`◐ Today  ▾`). Click → popover with the four system views + custom lists + `+ New List` + view counts.
- **Expanded (panel width `min(720, vw - 68)` px):** maximize button on header animates panel width. Sidebar (200 px fixed) renders Today / Upcoming / Inbox / Completed / + New List. Maximize icon flips to minimize.
- Falls back to compact if `vw < 720` (maximize button hidden).
- View counts shown next to each entry (sidebar **and** dropdown).
- Active view + expanded state persisted across sessions in storage.

### Dates and scheduling
- Quick-set chips in the date popover: `Today` · `Tomorrow` · `This Weekend` (next Saturday) · `Next Week` (next Monday) · `Pick date…` (native `<input type="date">`).
- Hover tooltip on row's date pill (HTML `title` attr — no library): e.g. `Due Thu`.
- Visual day chip on row when `dueAt` is set (sun ☀ for today, calendar-day for others, red dot if overdue).
- Auto-rollover is **display-only** — overdue items appear under Today via the selector. No mutation of `dueAt`.
- Day-rollover ticker — a 60 s `setInterval` ping forces re-render so a Today→Tomorrow boundary is visible without a refresh.

### Hover quick actions (right-aligned, revealed on row hover)
- Schedule today (☀) — sets `dueAt` to start-of-today.
- Remove date (calendar-with-X) — clears `dueAt`.
- Open date picker — opens the date popover.
- Add subtask (branch icon) — focuses subtask input.
- More (⋯) — opens the context menu.

### Context / right-click menu
- Edit (`E`)
- Date submenu (chips + custom)
- Add subtask
- Duplicate
- Delete (`⌫`)

### Per-list settings menu (footer ⋯)
- Sort: **Manual** (default) · By date · Alphabetical. *(Priority sort field reserved in data model but UI lands in Phase 01b.)*
- Add new tasks at: **Top** / **Bottom**.
- Show completed: **Never** / **Today** / **30 days** / **Always**.
- Pin panel — disables outside-click close while pinned. ESC + close-button still close.

### Chrome integrations (Phase 01)
- `chrome.contextMenus` (new permission):
  - `gb-add-selection` — contexts `['selection']`, title `Add selection as task`.
  - `gb-add-page` — contexts `['page']`, title `Add page as task`.
  - On click, the background SW writes directly to `todosItem`.
- Badge counter — `chrome.action.setBadgeText` shows count of incomplete tasks in **Today** view. Background SW watches `todosItem` and recomputes on change.

### Storage items (this phase, declared in `lib/storage.ts`)
| Item | Type | Storage key | Fallback |
|---|---|---|---|
| `todosItem` | `TodoItem[]` | `local:gb-todos` | `[]` |
| `listsItem` | `ListMeta[]` | `local:gb-lists` | `[ inboxDefault ]` (seeded on first read) |
| `todoUiItem` | `TodoUiState` | `local:gb-todo-ui` | `{ activeView:'today', expanded:false, pinned:false, sidebarCollapsed:false }` |

Existing items (`positionItem`, `edgeItem`, `transparencyItem`, `activeAppItem`) stay untouched.

### App registry change
- `lib/apps/registry.ts`: TODO app's `Renderer` swapped from the placeholder to the real `<TodoApp />` component. `enabled: true` already set.
- Jira and GitHub apps **stay disabled** (`enabled: false`) per CLAUDE.md "Stay strictly within the active phase scope".

### Cross-browser
- Chrome + Edge prod builds verified by full smoke (15 min QA in `verification.md`).
- Firefox build is a stretch goal — verify it builds and the smoke (5 min) passes; document quirks in `testing-plan.md` §Known issues if any.

---

## Out of scope (deferred)

| Item | Where it lands | Why deferred |
|---|---|---|
| Recurring tasks (`recurrence` field) | Phase 01b | Needs recurrence engine + state machine. Field is reserved in the data model so Phase 01b is purely additive. |
| Reminder time (`remindAt` field) | Phase 01b | Needs `chrome.alarms` permission + scheduling. Field reserved. |
| Desktop notifications | Phase 01b | Needs `chrome.notifications` permission + permission rationale entry in roadmap. |
| Omnibox quick-add | Phase 01b | Needs `commands` keyword + manifest entry; new UX surface. |
| Floating "quick capture" button on every page | Parking lot | UX clash with the bar. Revisit. |
| Priority sort | Phase 01b | `priority` field reserved; UI lands later. |
| Focus Mode / Set as Daily Goal | Rejected | Premium-flavoured noise in source app; no clear utility for v1. |
| PLUS / Premium gating UI | Rejected | No business model yet. Ship features ungated. |
| Glassmorphism / translucent panel surface | Rejected | Violates `design.md` rule "Glimpse Panel surface is **always opaque**". Bar transparency does not propagate to the panel. |
| Server sync, accounts, sharing | Out of project | Local-first. |
| Tagging / labels / colored task chips | Parking lot | Adds complexity; revisit when usage dictates. |
| Drag-to-reorder via `react-dnd` | Parking lot | Manual sort lands as up/down arrows in the row context menu. Drag handle revisit in 01b once data model patterns settle. |
| Vitest / Playwright tests | Out of project (this phase) | Per CLAUDE.md "no test framework yet". Pure modules in `lib/todos/` are written test-ready. |

---

## Why this slice

- TODO is the simplest real app to ship — no network, no auth, no third-party schema. It validates the **app-renderer-inside-panel** pattern that Jira and GitHub will follow.
- Compact mode keeps the existing 360 px panel. Expanded mode is a controlled escalation only when the user asks for it (maximize button) — it teaches us the panel-width animation pattern that later apps may want.
- Right-click selection capture is the smallest possible Chrome integration that delivers a "wow" moment. Badge counter teaches the SW-watches-storage pattern.
- Recurring + reminders + omnibox bring three new permissions and a notification permission prompt at install. Splitting them into Phase 01b keeps the install prompt minimal for the first real-app release.
- Subtasks at one level only avoids the rabbit hole of nested-tree UX (collapse-all, drag-between-levels, breadcrumb headers).
