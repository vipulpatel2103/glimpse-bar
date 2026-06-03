# Verification — Notes

> Acceptance criteria + manual QA scripts for the Notes phase. Run all of this before tagging the phase Done.

---

## Acceptance Criteria

### AC — Notes CRUD
- [ ] Open the Notes panel on `https://example.com`. Click `+ Take a note…` → composer expands.
- [ ] Type `Shopping list` in the title, `Milk, eggs, bread` in the body → Cmd/Ctrl+Enter → card appears in `All`.
- [ ] Reload the page → card persists.
- [ ] Open the same URL in a second tab → card mirrors within ~1 s.
- [ ] Click card → editor opens (View mode if body non-empty).
- [ ] Toggle Edit → textarea visible; counter reads `19 / 10,000`.
- [ ] Type body to 9 001 chars → counter turns amber (`gb-counter-warn`).
- [ ] Type body to 10 000 chars → counter turns red (`gb-counter-error`); further keystrokes ignored.
- [ ] Paste a 50 KB doc into the body → body truncates to 10 000 chars; toast `Note clipped to 10,000 chars` appears for ~3 s.
- [ ] Open card → click ⋯ → `Duplicate` → second card appears identical, with fresh `createdAt`.
- [ ] Click ⋯ → `Delete` → card removed; `Undo` toast for ~5 s; click Undo → restored.
- [ ] `⌫` with card focused → archive + `Undo` toast; click Undo → restored to `All`.
- [ ] `Shift+⌫` with card focused → permanent delete + `Undo` toast.

### AC — Markdown rendering + sanitization
- [ ] Create a note with body:
  ```
  # Heading

  - One
  - Two
  - **Three**

  [Link](https://example.com)

  ```code```
  ```
  Open in View mode → headings render, list bullets render, link is clickable and opens in a new tab.
- [ ] Open editor on a note containing `<script>alert(1)</script>` → View mode renders the literal text (or nothing) — no alert fires.
- [ ] Open editor on a note containing `<a href="javascript:alert(1)">x</a>` → rendered as inert text (link stripped).
- [ ] Open editor on a note containing `<img src="x" onerror="alert(1)">` → no `<img>` in the DOM; no alert.
- [ ] Card preview never shows raw Markdown delimiters (`*`, `#`, `>`); `stripMd` keeps the plaintext only.
- [ ] DevTools Network panel during editor open: `marked` and `dompurify` chunks load on first editor open; subsequent opens hit the cache.

### AC — Checklist mode
- [ ] Open a note. Toggle checklist mode on → body editor converts; an empty `[ ]` row + `+ Add item` row visible.
- [ ] Add 3 items. Tick the middle one → strikethrough + 50 % opacity within 200 ms.
- [ ] Reorder via the row context menu (`Move up` / `Move down` once Step 5 ships).
- [ ] Toggle checklist mode off → body restores as `- [ ] Item 1\n- [x] Item 2\n- [ ] Item 3` Markdown.
- [ ] Toggle back on → checklist re-parses correctly from the Markdown.
- [ ] Hitting `CHECKLIST_PER_NOTE` (200) → `+ Add item` row disabled with tooltip `Limit reached (200)`.

### AC — Color + labels
- [ ] Open a card → click color swatch row → choose `Yellow` → card tint updates to `gb-note-yellow-bg`; persists across reload.
- [ ] In editor, click `+` next to label chips → autocomplete popover appears.
- [ ] Type `Groc` → only `Groceries` matches → click → label applied; chip visible on card.
- [ ] Type a new label `Reading` → `+ Create "Reading"` row visible → click → label created + applied + appears in the sidebar.
- [ ] Apply 20 labels → 21st rejected with toast `Up to 20 labels per note`.
- [ ] Delete `Reading` from the sidebar → confirmation prompt → confirm → label disappears from every note; cards re-render without the chip.

### AC — Views
- [ ] Header dropdown (compact) shows `Pinned`, `All`, `Archived` plus any labels.
- [ ] Each view shows a count to the right of its label.
- [ ] Pin a card from `All` → `Pinned` count increments; card surfaces under the `Pinned` group header in `All`.
- [ ] Archive a card → `All` count decreases; `Archived` count increases.
- [ ] In `Archived`, the card's hover actions are `Restore` + `Delete forever` (no pin / archive).
- [ ] Click a label in the sidebar → only matching cards visible; group headers omitted.

### AC — Search
- [ ] Click `Search` icon in compact → header swaps to a search input.
- [ ] Type `milk` → only matching cards remain; non-matching fade out.
- [ ] Empty result → muted copy `No notes match "milk".`.
- [ ] Press Esc → search bar closes; full view restored.
- [ ] Switch to `Archived` → search input remembers query; archived-only matches.
- [ ] Search a label name → cards carrying that label appear.
- [ ] Performance: 100 notes, search every keystroke → no long task > 50 ms (Performance panel).

### AC — Right-click capture
- [ ] On `https://news.ycombinator.com`, highlight a headline → right-click → menu shows `Add selection as note` → click → open Notes → card with the selection appears in `All`.
- [ ] Right-click anywhere (no selection) → menu shows `Add page as note` → click → Inbox card has page title as title + URL as body.
- [ ] Hit 100 notes → right-click capture toasts `Note limit reached (100). Archive or delete old notes.` and does not add.
- [ ] Both items appear alongside the TODO context-menu items (no conflict).

### AC — Bar inline quick-compose
- [ ] Shift+click on the Notes icon in the bar → composer popover appears next to the icon (opposite side from the bar edge).
- [ ] Type a note → Enter → popover closes; open the panel → card appears in `All`.
- [ ] Shift+Enter inserts a newline; Enter alone saves.
- [ ] Esc closes without saving.
- [ ] Click outside the popover (anywhere on the host page) → closes without saving.
- [ ] With the bar on the left edge → popover anchors to the right of the icon. Drag bar to the right edge → composer next time appears anchored to the left.
- [ ] Hit 100 notes → composer shows inline error `Note limit reached (100)`; Save is disabled.

### AC — Compact ↔ expanded mode
- [ ] On viewport ≥ 720 px wide, panel header shows `Maximize2` icon. Click → panel width animates to ≈720 px over ~280 ms.
- [ ] Sidebar appears with views + labels.
- [ ] Click a sidebar item → main pane updates.
- [ ] Click `Minimize2` → panel animates back to 360 px; sidebar gone.
- [ ] Reload the page → panel reopens at the previous expanded / collapsed state.
- [ ] Resize viewport down to 700 px → maximize button hidden; panel falls back to compact.
- [ ] Drag the bar to the left edge with panel expanded → panel anchors correctly to the left side.
- [ ] Width tween does not run while the bar is being dragged.

### AC — Layout toggle
- [ ] Expanded + grid layout → 2-column card grid.
- [ ] Expanded + list layout → 1-column card list (full width).
- [ ] Compact → always 1 column regardless of layout setting.
- [ ] Toggle persists across reload.

### AC — Keyboard
- [ ] Tab into Notes panel → focus lands on the composer.
- [ ] `↑` / `↓` / `←` / `→` cycle card focus.
- [ ] `Enter` in composer title → focus moves to body.
- [ ] `Cmd/Ctrl+Enter` saves the composer.
- [ ] `E` with card focused → opens editor.
- [ ] `⌫` with card focused → archives + undo toast.
- [ ] `Shift+⌫` with card focused → deletes + undo toast.
- [ ] `P` with card focused → toggles pin.
- [ ] Esc closes any open popover (color / labels / context menu / search bar / editor).

### AC — Theme + reduced motion
- [ ] Toggle OS dark mode → all Notes surfaces re-skin within ~500 ms; all 9 card tints remain legible.
- [ ] Enable `prefers-reduced-motion: reduce` in DevTools → popovers open instantly; width tween is instant; editor mode swap is instant.
- [ ] WCAG-AA contrast in both themes for all card tints (DevTools Accessibility panel ≥ 4.5:1 for body text on every tint).

### AC — Cross-tab consistency
- [ ] Open `example.com` in two tabs. Add a note in tab A → appears in tab B within ~1 s.
- [ ] Toggle pin in tab B → reflects in tab A.
- [ ] Delete a note in tab A → disappears in tab B.

### AC — Options page
- [ ] Open the Glimpse Option Page → Notes section visible.
- [ ] Storage row reads `Notes: <n> / 100`. Add notes → count updates live.
- [ ] At 90 notes → row turns amber.
- [ ] Change `Default color` to `Yellow` → new notes added via right-click / quick-compose / panel composer carry `color: 'yellow'`.
- [ ] Click `Export notes as JSON` → file downloads named `glimpse-notes-YYYY-MM-DD.json`.
- [ ] Wipe `notesItem` from DevTools → click `Import JSON` → select the file → notes restore intact (labels match by name; new IDs minted on collision).

### AC — Cross-browser smoke
- [ ] Chrome: full smoke (5 min) below.
- [ ] Edge: full smoke (5 min) below.
- [ ] Firefox: full smoke (5 min) — confirm `contextMenus` items render; document any missing behaviors in `testing-plan.md` §Known issues.

### AC — Performance
- [ ] Cold-load: opening the Notes panel from Phase-02-shaped baseline adds < 5 KB to the gzipped content-script bundle (verify with `pnpm build` size diff).
- [ ] Editor open: first open of an editor loads `marked` + `DOMPurify` in < 200 ms on a mid-tier laptop. Subsequent opens are instant.
- [ ] Storage write debouncing: typing 60 chars/sec into the editor causes ≤ 3 writes/sec to `notesItem` (verify via `chrome.storage.local.onChanged` log).

---

## Manual QA Scripts

### Smoke (5 min)
> Run before every commit-to-main / PR merge during this phase.

1. `pnpm dev` (or `pnpm build` then load `.output/chrome-mv3/`).
2. Visit `https://example.com` → bar visible → click Notes icon → panel opens with `All` empty state.
3. Add 2 notes via composer. Color one Yellow. Add label `Reading` to the other.
4. Click maximize → sidebar slides in. Switch to `Reading` label → one card visible.
5. Switch back to `All`. Pin the Yellow card. Confirm it surfaces under `Pinned`.
6. Right-click on the page → `Add page as note` → switch to `All` → card with page title appears.
7. Shift+click the Notes icon → quick-compose popover opens → type `Quick capture test` → Enter → reopens panel — card present.
8. Search `Quick` → only that card visible. Esc to clear.
9. Archive the search card. Switch to `Archived` → card visible.
10. No `console.error` from Glimpse code in DevTools.

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
   - `https://chatgpt.com` (SPA replaces body; verify Notes panel survives `wxt:locationchange`)
5. DevTools Performance: open the editor on a 9 000-char note → confirm no long tasks > 50 ms during render.
6. DevTools Memory: heap snapshot before / after opening + closing 50 editors → no detached DOM nodes; `marked` parse caches do not grow unboundedly.
7. Storage Inspector: check `local:gb-notes`, `local:gb-note-labels`, `local:gb-notes-ui` shape matches `lib/notes/types.ts`.
8. Lighthouse on `example.com` with extension loaded → no regression vs. Phase 02 baseline.
9. XSS attempt: paste the test bodies from `AC — Markdown rendering + sanitization` and confirm zero alerts.

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
- [ ] Cross-cutting docs ([`../../requirements.md`](../../requirements.md), [`../../architecture.md`](../../architecture.md), [`../../ui-design.md`](../../ui-design.md), [`../../../design.md`](../../../design.md), [`../../testing-plan.md`](../../testing-plan.md), [`../../roadmap.md`](../../roadmap.md)) reviewed for needed updates. Markdown deps (`marked`, `dompurify`) documented in roadmap decision log.
- [ ] `CLAUDE.md` Critical conventions augmented with any non-obvious learning (e.g., DOMPurify config + post-sanitize link `target` pass).
- [ ] Tag the commit `notes/done`.
