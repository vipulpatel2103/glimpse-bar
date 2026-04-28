# Verification — TODO

> Acceptance criteria + manual QA scripts for the TODO phase. Run all of this before tagging the phase Done.

---

## Acceptance Criteria

### AC — Tasks (CRUD + subtasks)
- [ ] Open the TODO panel on `https://example.com`. Type `Buy milk` → Enter → row appears.
- [ ] Reload the page → row persists.
- [ ] Open the same URL in a second tab → row mirrors within ~1 s.
- [ ] Click checkbox → row gets strikethrough + 50 % opacity within 200 ms.
- [ ] Click checkbox again → un-toggles (returns to active).
- [ ] Click row text → editable input appears with text + cursor at end. Type, then Enter → text saved.
- [ ] Open editor, clear all text, blur or press Enter → row deleted.
- [ ] Right-click row → `Duplicate` → identical task appears below the original.
- [ ] Right-click row → `Add subtask` → child input focused. Type `Get oat milk` → Enter → child row appears under parent with smaller text.
- [ ] Click parent's expand chevron → children collapse / expand.
- [ ] Right-click parent → `Delete` → parent **and** all children gone.
- [ ] Hover row → trash / more icons fade in within 100 ms; do not shift row layout.
- [ ] Press `⌫` with row focused → row deleted; an `Undo` toast appears for ~3 s; click it → row restored.

### AC — Views
- [ ] Header dropdown (compact) shows `Today`, `Upcoming`, `Inbox`, `Completed` plus any custom lists.
- [ ] Each view shows a count to the right of its label.
- [ ] Toggling a Today task → `Today` count decreases by 1 within ~200 ms.
- [ ] Setting `dueAt` to tomorrow → task moves out of Today, appears in Upcoming under a `Tomorrow` group header.
- [ ] Setting `dueAt` to a date 5 days out → appears in Upcoming under the day-of-week header.
- [ ] Setting `dueAt` to a date 8+ days out → does NOT appear in Upcoming; only in its source list view.
- [ ] Removing a task's `dueAt` → it returns to Inbox (if it has no custom list assignment).
- [ ] Inbox view shows only items with no `dueAt` and no custom list (and no parent).
- [ ] Completed view sorted `doneAt` desc; items disappear after the per-list `Show completed` window expires.

### AC — Custom lists
- [ ] In compact dropdown's `Lists` section, click `+ New List`. Name it `Reading`. List appears in dropdown with count `0`.
- [ ] Switch to the new list. Add 3 tasks. Counts in dropdown update.
- [ ] Right-click list in dropdown → `Rename` → change to `Books`. Name updates everywhere.
- [ ] Right-click list → `Delete`. Tasks land in Inbox; list disappears from dropdown and sidebar.
- [ ] `Inbox` cannot be renamed or deleted (no menu entries shown).

### AC — Per-list configuration
- [ ] Open list-config ⋯ → set Sort to `Alphabetical`. Tasks reorder live.
- [ ] Set Sort back to `Manual`. Right-click any task → `Move up` / `Move down` reorders within the list.
- [ ] Set `Add new tasks at: Top`. Type a new task → it inserts at the top.
- [ ] Set `Show completed: Never`. Completed tasks vanish from the active view.
- [ ] Set `Show completed: Today`. Tasks completed today show; older completed tasks hidden.
- [ ] Toggle `Pin panel` on. Click outside the panel → panel stays open.
- [ ] Toggle `Pin panel` off. Click outside → panel closes.
- [ ] Esc and the close (✕) button close the panel even when pinned.

### AC — Dates and quick actions
- [ ] Open date popover from row's calendar icon → click `Today` chip → row gets a sun ☀ chip; appears in Today view.
- [ ] Click `Tomorrow` → chip text reads `Tomorrow`'s 3-letter day (e.g. `Wed`). Tooltip on hover reads `Due Wed`.
- [ ] Click `This Weekend` → schedules to next Saturday (or today if today is Saturday).
- [ ] Click `Next Week` → schedules to next Monday.
- [ ] Click `Pick date…` → native picker appears → choose a date 30 days out → chip updates to `Apr 30`-style label.
- [ ] Click `Remove date` → chip disappears; row returns to Inbox.
- [ ] Hover `Schedule today` quick-action → cursor pointer; click → `dueAt` set to start-of-today.
- [ ] Hover `Remove date` quick-action → click → `dueAt` cleared.
- [ ] Set `dueAt` to a past date via DevTools (`setDueAt(yesterday)`) → row appears in Today view with overdue indicator (red dot on chip); tooltip reads `Overdue — was due …`.
- [ ] Wait 60 s past midnight (or fast-forward via DevTools) → Today / Upcoming buckets recompute without manual refresh.

### AC — Right-click capture
- [ ] On `https://news.ycombinator.com`, highlight a headline. Right-click → menu shows `Add selection as task`. Click it.
- [ ] Open Inbox → task appears with the highlighted text (truncated to 280 chars if longer).
- [ ] Right-click anywhere on the page (no selection) → menu shows `Add page as task`. Click it. Inbox shows a task with the page title.
- [ ] Repeat both on `https://github.com` and `https://chatgpt.com` → both work.

### AC — Badge counter
- [ ] Add 3 tasks with `dueAt: today`. Toolbar icon shows `3`.
- [ ] Complete one. Badge updates to `2` within ~500 ms.
- [ ] Complete the rest. Badge clears (no text).
- [ ] Add a task `dueAt: tomorrow`. Badge stays cleared.
- [ ] Right-click capture a new selection in another tab → badge increments if the new task lands today (it doesn't by default — it lands in Inbox `dueAt: undefined` — so badge **must not** change). Confirm.

### AC — Compact ↔ expanded mode
- [ ] On viewport ≥ 720 px wide, panel header shows `Maximize2` icon. Click → panel width animates to ≈720 px over ~280 ms.
- [ ] Sidebar appears with views + custom lists.
- [ ] Click a sidebar item → main pane updates.
- [ ] Click `Minimize2` → panel animates back to 360 px; sidebar gone.
- [ ] Reload the page → panel reopens at the previous expanded/collapsed state.
- [ ] Resize viewport down to 700 px → maximize button hidden; panel falls back to compact.
- [ ] Drag the bar to the left edge with panel expanded → panel anchors correctly to the left side.
- [ ] Width tween does not run while the bar is being dragged.

### AC — Keyboard
- [ ] Tab into TODO panel → focus lands on the first row.
- [ ] `↑` / `↓` cycle row focus.
- [ ] `Enter` (with `+ New task` focused) → creates the typed task.
- [ ] `E` with row focused → opens inline editor.
- [ ] `⌫` with row focused → deletes (with undo toast).
- [ ] Right-click and ⋯ both open the same context menu.
- [ ] Esc closes any open popover (date / context menu / list config).

### AC — Theme + reduced motion
- [ ] Toggle OS dark mode → all TODO surfaces re-skin within ~500 ms.
- [ ] Enable `prefers-reduced-motion: reduce` in DevTools → all popovers open instantly; width tween is instant; strikethrough is instant.
- [ ] WCAG-AA contrast in both themes (DevTools Accessibility panel ≥ 4.5:1 for all text).

### AC — Cross-tab consistency
- [ ] Open `example.com` in two tabs. Add a task in tab A → appears in tab B within ~1 s.
- [ ] Toggle done in tab B → reflects in tab A and the toolbar badge updates accordingly.

### AC — Cross-browser smoke
- [ ] Chrome: full smoke (5 min) below.
- [ ] Edge: full smoke (5 min) below.
- [ ] Firefox: full smoke (5 min) — note that `chrome.contextMenus` API is supported in MV2; document any missing behaviors in `testing-plan.md` §Known issues.

---

## Manual QA Scripts

### Smoke (5 min)
> Run before every commit-to-main / PR merge during this phase.

1. `pnpm dev` (or `pnpm build` then load `.output/chrome-mv3/`).
2. Visit `https://example.com` → bar visible → click TODO icon → panel opens with `Today` empty state.
3. Add 2 tasks via `+ New task`. Schedule one to `Tomorrow` via the calendar quick-action.
4. Switch to Upcoming → tomorrow's task visible under `Tomorrow` group.
5. Switch to Inbox → still 0 tasks (because both have due dates? actually one is in Today, one is in Upcoming — Inbox is correctly 0).
6. Click maximize → sidebar slides in. Click `Today`. Tick the today task. Sidebar count for Today drops.
7. Right-click on the page → `Add page as task` → switch to Inbox → page-title task appears.
8. Toolbar badge reflects today-incomplete count.
9. No `console.error` from Glimpse code in DevTools.

### Full regression (20 min)
> Run before tagging the phase Done.

1. All AC items above on Chrome.
2. Smoke on Edge.
3. Smoke on Firefox.
4. Hard-case sites from `../../testing-plan.md` §2.3:
   - `https://example.com` (baseline)
   - `https://github.com` (dark UI, SPA navigation)
   - `https://www.notion.so` (high z-index sidebar)
   - `https://www.youtube.com` (fullscreen video)
   - `https://chatgpt.com` (SPA replaces body; verify TODO panel survives `wxt:locationchange`)
5. DevTools Performance: record 5 s of typing in `+ New task` → confirm no long tasks > 50 ms.
6. DevTools Memory: heap snapshot before / after creating 200 tasks → no detached DOM nodes from row remounts (memo'd correctly).
7. Storage Inspector: check `local:gb-todos`, `local:gb-lists`, `local:gb-todo-ui` shape matches `lib/todos/types.ts`.
8. Lighthouse on `example.com` with extension loaded → no regression vs. Phase 00 baseline.

---

## Known Issues Log (this phase)

> Populate during QA. Each entry: site, browser, severity, description, mitigation. If empty at end of phase, delete the table.

| # | Site | Browser | Severity | Description | Mitigation |
|---|---|---|---|---|---|
| _ | _ | _ | _ | _ | _ |

---

## Phase Done Checklist

- [ ] All AC sections above checked off on Chrome.
- [ ] Smoke (5 min) passes on Edge + Firefox.
- [ ] No `console.error` from Glimpse code on the 5 hard-case sites.
- [ ] All 10 steps in [`plan.md`](plan.md) committed.
- [ ] [`scope.md`](scope.md), [`ui-spec.md`](ui-spec.md), [`README.md`](README.md) reflect what was actually shipped (any drift is reconciled before tagging).
- [ ] Cross-cutting docs ([`../../requirements.md`](../../requirements.md), [`../../architecture.md`](../../architecture.md), [`../../ui-design.md`](../../ui-design.md), [`../../../design.md`](../../../design.md), [`../../testing-plan.md`](../../testing-plan.md), [`../../roadmap.md`](../../roadmap.md)) reviewed for needed updates. New `contextMenus` permission documented in roadmap decision log.
- [ ] `CLAUDE.md` Critical conventions augmented with any non-obvious learning (e.g., width tween must lock during bar drag).
- [ ] Tag the commit `todo/done`.
