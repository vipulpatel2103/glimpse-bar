# TODO

> **Phase folder:** `docs/phases/01-todo/`
> **Status:** Stub — not yet planned
> **Plan when:** the **Setup and UI/UX** phase ([`../00-setup-and-ui-ux/`](../00-setup-and-ui-ux/)) is shipped and we've learned from it.

---

## One-line goal

Make the TODO icon do something real: a local task list with add / edit / toggle-done / delete, persisted across reloads and synced across tabs.

---

## Likely scope (subject to planning)

- TODO panel renderer replacing the empty placeholder body.
- Storage shape: `gb:todos` = `Array<{ id, text, done, createdAt }>`.
- Cross-tab sync via `@wxt-dev/storage` (free with `storage.watch` or our `useStorageItem` hook).
- Add input with Enter to commit; per-item more-menu (Edit / Delete).
- Empty state, count footer.
- Glimpse Option Page additions:
  - Theme picker (System / Light / Dark) — folded in here because TODO is the first place users care about chrome.
  - Per-app enable/disable toggles — folded in here for the same reason.
  - Export TODOs as JSON / Import JSON.
- Pin button on Glimpse Panel header (so the TODO list can stay open across navigation).

## Out of scope (explicit)

- Reminders / due dates.
- Sub-tasks, nested lists.
- Sync to a server.
- Sharing.

## Open questions to settle before planning

- Do we need per-site or per-domain TODO lists, or is one global list enough? (Likely: one global. Domain scoping is v2.)
- How does Pin interact with multi-tab — should pinning in tab A pin everywhere? (Likely: yes, since storage is shared.)

---

## Files this folder will hold (template — to be authored at planning time)

- `README.md` (this file, expanded)
- `scope.md`
- `plan.md`
- `ui-spec.md`
- `verification.md`

---

## Don't plan this yet

Per the project working agreement, we don't fully spec a phase until the previous phase has shipped. Notes here are intentionally rough.
