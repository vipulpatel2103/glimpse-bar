# Testing Plan

> **Doc owner:** glimpse-bar
> **Status:** Draft (2026-04-27)
> **Audience:** anyone preparing a release. Manual QA is the early-phase backbone; automated tests are introduced once the surface stabilises.
> **Scope:** describes the **full QA surface** across all phases. Each phase folder's `verification.md` lists the subset that applies to that phase's release.

---

## 1. Test Surfaces

| Surface | What to verify |
|---|---|
| Glimpse Bar | render, drag, snap, persistence, theme, transparency |
| Glimpse Panel | open/close, animation, header buttons, ESC, outside-click, pin |
| TODO app | CRUD, persistence, cross-tab sync |
| Stub apps | placeholder visible, "Open Options" button works |
| Glimpse Option Page | every control reflected live in bar; theme follows; export/import |
| Service Worker | doesn't crash; no console errors on extension reload |
| Cross-browser | Chrome, Edge, Firefox |

---

## 2. Manual QA Scripts

### 2.1 Smoke (5 min)

Run before every PR merge.

1. `pnpm dev` → load unpacked in Chrome.
2. Visit `https://example.com` → bar visible at right edge.
3. Click TODO icon → panel opens.
4. Add a TODO "smoke" → check it → reload → still there → unchecked then deleted.
5. Press ESC → panel closes.
6. Right-click extension → Options → Options page opens.
7. Slide transparency to 20% → switch back to the example.com tab → bar more transparent.
8. Close everything. No console errors anywhere.

### 2.2 Full regression (30 min)

Run before tagging a release.

1. **Bar layout** — visit each AC site (`example.com`, `github.com`, `notion.so`, `youtube.com`, your Jira). Verify bar visible, icons crisp, no horizontal scroll induced on the page.
2. **Drag/snap** — on `example.com`:
   - drag from right to free middle → release → does it snap to the nearest edge?
   - drag from right to left, release at exact center+1px → snaps right (or whichever rule we set).
   - drag down past viewport bottom → bar clamps at `viewportH − barH − 16`.
   - drag handle: confirm clicking icon area does NOT move the bar (only grip moves).
   - reload → position persists.
   - open new tab same site → position matches.
3. **Theme** — toggle OS dark mode while a tab is open with `theme: System` → bar/panel re-theme. Then in Options pick `Light` explicitly → confirm bar stays light even with OS dark.
4. **Panel** — open TODO panel:
   - click outside → closes.
   - ESC → closes.
   - click pin → ESC → stays.
   - click pin again → ESC → closes.
   - resize window to 600px wide → panel clamps to `vw − 80 = 520px`.
   - resize to 350px → confirm bar still rendered, panel covers most of viewport.
   - in DevTools "Rendering" panel, enable `prefers-reduced-motion: reduce` → reopen panel → no slide animation.
5. **TODO** — add 5, check 2, delete 1, edit 1, reload → state matches. Open second tab same site → list mirrors.
6. **Stubs** — Jira icon → placeholder shown → "Open Glimpse Options Page" button opens new tab.
7. **Options** — toggle each app off/on → bar updates. Export TODOs → JSON download with valid array. Import a JSON file → list overwritten. Theme switching → both bar and Options page reflect.
8. **Service worker** — `chrome://extensions` → click "service worker" link → DevTools opens for SW → no errors. Reload extension → no errors.
9. **Cross-browser** — repeat steps 1, 2, 4, 5 on Edge and Firefox.
10. **Performance** — DevTools Performance → record while dragging → confirm > 55fps.

### 2.3 Hard-case sites (15 min)

Sites known to be hostile to extension overlays:

| Site | What to check |
|---|---|
| `https://www.youtube.com` (in fullscreen video) | Bar still renders? If overlay covers a video control, dock to opposite edge. Document. |
| `https://www.notion.so` | Notion uses high z-index for its toolbar — verify bar isn't covered. |
| `https://www.figma.com` | Figma captures all keyboard events. Verify ESC still closes our panel (or document the conflict). |
| `https://meet.google.com` (in a call) | Verify bar doesn't break call UI; Google Meet uses fullscreen + permission overlays. |
| `https://docs.google.com` | Bar visibility, panel doesn't interfere with comments / collaboration cursors. |
| Atlassian Jira tenant | Verify our (stub) Jira icon doesn't conflict with Jira's own UI when bar is over Jira. |
| Sites with strict CSP (e.g., GitHub's some pages) | Verify shadow-DOM `<style>` injection succeeds. |

For each hostile site: capture a screenshot if a regression occurs and file as a known issue in §5 below.

---

## 3. Test Data

**TODO list test data** — a JSON sample saved at `docs/assets/test-todos.json` (create during Phase 7):
```json
[
  { "id": "1", "text": "Pick up groceries",  "done": false, "createdAt": 1714000000000 },
  { "id": "2", "text": "Send invoice",       "done": true,  "createdAt": 1714000100000 },
  { "id": "3", "text": "Review PR #428",     "done": false, "createdAt": 1714000200000 }
]
```

Use this for import/export round-trip testing.

---

## 4. Browser-Specific Notes

### Chrome
- Primary target. Best path: `pnpm dev` — WXT's runner spawns a managed Chrome profile with the extension preinstalled and HMR for content scripts + options. For manual / prod smoke: `pnpm build` then `chrome://extensions` → Developer mode → Load unpacked → `.output/chrome-mv3/`.
- WXT HMR covers content scripts and the options page. Service-worker changes still require an explicit extension reload.

### Edge
- Same MV3 build. `pnpm build:edge` outputs `.output/edge-mv3/`. Load via `edge://extensions` → Developer mode → Load unpacked.
- Edge sometimes caches unpacked extensions aggressively — toggle off/on if changes don't appear.

### Firefox
- `pnpm dev:firefox` for inner-loop, or `pnpm build:firefox` then `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on" → pick `.output/firefox-mv2/manifest.json`.
- Temporary add-ons are removed on Firefox restart — re-add when continuing dev.
- Storage API is identical (`browser.storage.local`; the WebExtension polyfill is bundled by WXT).
- **Known constraint:** Firefox MV3 service workers are still partially supported. Since our SW is empty, MV2 with a background page is fine for the setup phase. If we add SW logic in a later phase, revisit Firefox MV3 status at that time.

---

## 5. Known Issues (template)

> Populate during QA. Each entry: site, browser, severity, description, mitigation.

| # | Site / Surface | Browser | Severity | Description | Mitigation |
|---|---|---|---|---|---|
| _ | _ | _ | _ | _ | _ |

---

## 6. Edge Cases & Failure Modes

| Case | Expected behavior |
|---|---|
| Storage quota exceeded (>10MB of TODOs — implausible) | Catch the `QuotaExceededError`, surface a toast in the panel, keep the in-memory list. |
| `browser.storage.local` returns `undefined` for a key | `@wxt-dev/storage` returns the item's `fallback`. |
| Another extension defines a custom element named `glimpse-ui` (extremely unlikely) | The browser will throw a custom-element redefinition error during `createShadowRootUi`. Document; rename our `name` in the call to disambiguate. |
| Site uses iframes that fill the viewport (e.g., docs sites that wrap content in iframes) | Our content script runs in the top-level page only (`allFrames: false`); the bar overlays the page chrome regardless of iframe content. |
| User opens DevTools and changes a storage key by hand | UI reacts via storage events. Do not crash on malformed values — validate with `zod` or simple guards in `lib/storage.ts`. |
| Reduced-motion users | Skip slide animation; instant fade only. |
| 4K monitor with browser zoom 50% | Bar scales with `vw`/`vh` math; verify it's still tappable (≥ 24px hit-box). |

---

## 7. Automation Backlog (deferred to v2)

These are not v1 deliverables, but the structure should be friendly to add later:

- **Vitest** for `lib/` pure functions (storage helpers, snap math, theme resolver).
- **Playwright** with `chromium.launchPersistentContext({ args: ['--load-extension=build/chrome-mv3-prod'] })` for end-to-end:
  - bar visible on a sample page
  - drag → snap → persistence
  - TODO add / check / delete
- **GitHub Actions** matrix: chrome / edge / firefox builds on every PR; smoke test against a static fixture page.

---

## 8. Release Checklist

- [ ] All §2.2 regression steps pass on Chrome.
- [ ] Smoke test passes on Edge + Firefox.
- [ ] No new entries in §5 above severity ≥ Medium.
- [ ] `pnpm package` produces a clean zip for each browser.
- [ ] `docs/` is consistent with the shipped code.
- [ ] Tag the commit `v1.0.0`.
