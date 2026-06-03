# Requirements

> **Doc owner:** glimpse-bar
> **Status:** Draft (2026-04-27)
> **Audience:** product + engineering, written so a new contributor can scope feature work without reading code.
> **Scope:** describes the **complete target system** across all phases. Each requirement is tagged with the phase that delivers it. See [`roadmap.md`](roadmap.md) for phase order and [`phases/`](phases/) for per-phase plans.

---

## 1. Glossary (use these terms exactly — everywhere)

| Term | Definition |
|---|---|
| **Glimpse Bar** | The transparent vertical icon rail injected on every web page. Always visible. Hosts the app icons and the drag handle. |
| **Glimpse Panel** | The slide-in vertical panel that opens **next to the Glimpse Bar** when an app icon is clicked. Renders that app's content. |
| **Glimpse Option Page** | The browser extension's standard options page (`chrome.runtime.openOptionsPage()`). Configures the bar globally — transparency, theme, and which apps appear. |
| **App** | A pluggable feature inside Glimpse (TODO, Jira, GitHub PRs, ...). Each app contributes one icon to the Glimpse Bar and one renderer to the Glimpse Panel. |
| **Glimpse UI host** | The custom element `<glimpse-ui>` created by WXT's [`createShadowRootUi`](https://wxt.dev/guide/essentials/content-scripts) inside the content script. Both Glimpse Bar and Glimpse Panel render inside its shadow root so styles stay isolated from the host page. |

> If a doc, commit message, or PR uses different naming ("sidebar", "popout", "settings page"), it's wrong — fix it.

---

## 2. Vision

A developer / power user keeps glanceable context — TODOs, ticket queues, PR review queue — visible from any web page without context-switching to a separate tool. The bar never demands attention; it sits at the page edge, transparent, and only manifests UI when the user reaches for it.

---

## 3. Personas

1. **Developer Dana** — lives in GitHub + Jira + the docs site she's reading. Wants her PR review queue and current ticket one click away while she's in Stack Overflow / docs.
2. **PM Pat** — drowning in Linear / Jira tabs. Wants a TODO scratchpad that survives page reloads and travels with her between tabs.
3. **Power User Priya** — uses 8+ SaaS tools. Cares about how unobtrusive the bar is. Will uninstall instantly if it breaks a host site or eats screen space.

---

## 4. Functional Requirements

> Each requirement carries a **Phase** column. The phase that delivers the requirement is the folder under [`phases/`](phases/) where it's planned in detail. `setup` = `phases/00-setup-and-ui-ux/`, `todo` = `phases/01-todo/`, `github` = `phases/02-github-prs/`, `notes` = `phases/03-notes/`. "—" means no phase has been planned yet (parking lot in `roadmap.md`). _Jira (`phases/03-jira/`) was deferred on 2026-06-03 and replaced by Notes — see `roadmap.md`._

### 4.1 Glimpse Bar (FR-BAR)

| ID | Phase | Requirement |
|---|---|---|
| FR-BAR-1 | setup | The Glimpse Bar SHALL render on every web page (`<all_urls>`) inside the Glimpse UI host's shadow DOM. |
| FR-BAR-2 | setup | The bar SHALL be vertical, ≥ 44px wide, and contain a stack of round app-icon buttons + a drag handle. |
| FR-BAR-3 | setup | The bar SHALL be transparent — its background opacity is configurable (0–1, default 0.6) from the Glimpse Option Page. |
| FR-BAR-4 | setup | The bar SHALL be draggable along both X and Y axes. On pointer release, X SHALL snap to the nearest viewport edge (left or right). |
| FR-BAR-5 | setup | The bar's drag handle SHALL be visually distinct (6-dot grip, `cursor: grab` → `grabbing`) so that draggability is discoverable. Dragging from anywhere else on the bar SHALL NOT initiate a drag. |
| FR-BAR-6 | setup | The bar's position SHALL persist across page reloads, tab switches, and browser restarts (via `@wxt-dev/storage` over `browser.storage.local`). |
| FR-BAR-7 | setup | App icons SHALL remain clearly visible regardless of host-page background — i.e. icons sit on opaque circular tiles even when the bar itself is transparent. |
| FR-BAR-8 | setup | The bar SHALL render correctly in both light and dark theme; a single icon SHALL never become invisible due to theme/host-bg combination. |
| FR-BAR-9 | setup | The bar SHALL NOT block interaction with the host page outside its own bounding box (`pointer-events: auto` on the bar; ambient root must not capture). |

### 4.2 Glimpse Panel (FR-PANEL)

| ID | Phase | Requirement |
|---|---|---|
| FR-PANEL-1 | setup | Clicking an app icon SHALL open the Glimpse Panel anchored next to the Glimpse Bar (panel slides outward — to the left if bar is right-edge, to the right if bar is left-edge). |
| FR-PANEL-2 | setup | The Glimpse Panel SHALL be rendered inside the same shadow root as the Glimpse Bar (created by WXT's `createShadowRootUi`), **not** the Chrome `chrome.sidePanel` API. Reason: cross-browser support (Firefox) and tighter visual coupling to the bar. |
| FR-PANEL-3 | setup | Panel width SHALL be 360px on viewports ≥ 800px wide; on narrower viewports it SHALL clamp to `min(360, viewportWidth − 80)`. Panel height SHALL match viewport height with a 16px gap top/bottom. |
| FR-PANEL-4 | setup | Open animation SHALL slide the panel from behind the bar with a 220ms ease-out; close animation reverses. The animation MUST be skipped if the user has `prefers-reduced-motion: reduce`. |
| FR-PANEL-5 | setup | The panel SHALL close on (a) ESC key, (b) close button, (c) outside-click — UNLESS the user has clicked "Pin", in which case only (b) closes it. |
| FR-PANEL-6 | setup | The panel SHALL show, in its header: the app's icon, app name, optional refresh button, pin toggle, close button. |
| FR-PANEL-7 | setup | The panel SHALL show **empty content** in the Setup phase — clicking any app icon other than Settings opens the panel with the app's name in the header and an empty body. App-specific renderers land in their respective phases. |

### 4.3 Apps (FR-APPS)

| ID | Phase | Requirement |
|---|---|---|
| FR-APPS-1 | setup | The Glimpse Bar SHALL show four icons in this fixed order: **TODO**, **Jira**, **GitHub PRs**, **Settings** (separated visually). |
| FR-APPS-2 | setup | The **Settings** icon SHALL open the Glimpse Option Page via `chrome.runtime.openOptionsPage()` (in a new tab). It does NOT open the Glimpse Panel. |
| FR-APPS-3 | setup | The **TODO**, **Jira**, **GitHub PRs** icons SHALL be clickable; clicking each SHALL open the Glimpse Panel with that app's name in the header and an empty body (real renderers land in later phases). |
| FR-APPS-4 | todo | TODO panel SHALL support: add item, edit text, toggle done, delete item, persist via `@wxt-dev/storage`. List SHALL sync across tabs in real time. |
| FR-APPS-5 | github | GitHub PRs panel SHALL show the user's PR review queue, fetched via PAT (later: OAuth). Refresh button manually re-fetches; auto-refresh is configured via `chrome.alarms`. |
| FR-APPS-6 | notes | Notes panel SHALL provide a local notes app (Google-Keep-flavored cards): create / edit / delete notes with a Markdown body or checklist, color tints, labels, pin, archive, and full-text search. Capped at 100 notes × 10 000-char bodies. Persisted via `@wxt-dev/storage`; no network. _(Jira issues — original FR — deferred 2026-06-03; see roadmap.)_ |

### 4.4 Glimpse Option Page (FR-OPT)

| ID | Phase | Requirement |
|---|---|---|
| FR-OPT-1 | setup | The Glimpse Option Page SHALL be a WXT options entrypoint (`entrypoints/options/index.html` + `main.tsx`) opened via `chrome.runtime.openOptionsPage()` in a new tab (`<meta name="manifest.open_in_tab" content="true" />`). |
| FR-OPT-2 | setup | It SHALL provide a **Transparency** slider (0–100%, label shows current value) that updates the bar's `--gb-alpha` CSS variable in real time, persisted to storage. |
| FR-OPT-3 | todo | "Export TODOs as JSON" + "Import JSON" buttons SHALL be added for TODO data portability. |
| FR-OPT-4 | github | A "Connections → GitHub" section SHALL accept a PAT and validate it with a "Test connection" button. |
| FR-OPT-5 | notes | A "Notes" section SHALL provide Export / Import JSON, a stored-notes count (`n / 100`, amber at 90), and a default-color picker for new notes. _(Jira "Connections" — original FR — deferred 2026-06-03.)_ |

> Theme picker (System/Light/Dark) and per-app enable toggles are deferred until at least one real app exists to enable/disable. They land alongside the **TODO** phase. The Setup phase ships only the Transparency slider as the user explicitly requested.

---

## 5. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-PERF-1 | Bar mount SHALL complete < 200ms after `document_idle` on a typical page (measured via `performance.now()` from content script start to first paint). |
| NFR-PERF-2 | Drag SHALL maintain ≥ 55fps on a mid-tier laptop. Storage writes during drag MUST be debounced (≥ 200ms after pointerup; no writes during pointermove). |
| NFR-A11Y-1 | All interactive elements SHALL have accessible names (`aria-label`). |
| NFR-A11Y-2 | Bar SHALL be reachable via keyboard: focus enters via Tab, arrow keys move focus among icons, Enter/Space activates. |
| NFR-A11Y-3 | Icons SHALL maintain ≥ 4.5:1 contrast against their tile background in both themes. |
| NFR-COMPAT-1 | The extension SHALL run on Chrome ≥ 110, Edge ≥ 110, Firefox ≥ 115. |
| NFR-SEC-1 | Until a phase explicitly adds a permission, the extension SHALL request only `storage` permission and `<all_urls>` host permission. Network access (e.g., GitHub / Jira API calls) is added in those phases. |
| NFR-SEC-2 | Content scripts SHALL NOT exfiltrate any host-page data. All app data lives only in `chrome.storage.local`. |
| NFR-PRIVACY-1 | No telemetry, no analytics, no remote logging in any phase without explicit, off-by-default opt-in. |
| NFR-RESILIENCE-1 | If `@wxt-dev/storage` (or the underlying `browser.storage.local`) fails to read, the bar SHALL render with each item's `fallback` and surface a non-blocking toast. It MUST NOT crash the host page. |

---

## 6. Acceptance Criteria

> System-wide AC live here. Phase-specific AC live in each phase folder's `verification.md`.

### AC — Glimpse Bar (setup)
- [ ] Visit `https://example.com` → bar visible at right edge, vertically centered.
- [ ] Drag the grip → bar follows pointer; release on left half → snaps to left edge.
- [ ] Reload page → bar still on left edge at same Y.
- [ ] Click anywhere on the bar **outside** the grip → does NOT initiate drag.
- [ ] Bar is visible on a dark page and a light page; icons stay legible in both.

### AC — Glimpse Panel (setup)
- [ ] Click any non-Settings icon → panel slides in from the bar's edge with an empty body.
- [ ] Press ESC → panel closes.
- [ ] Click pin → press ESC → panel stays open.
- [ ] Click another non-Settings icon while a panel is open → panel content header changes to the new app; body stays empty.
- [ ] Resize viewport to 600px wide → panel clamps to `viewportW − 80 = 520px`.
- [ ] With `prefers-reduced-motion: reduce` → panel appears/disappears with no slide.

### AC — Glimpse Option Page (setup)
- [ ] Click Settings icon in bar → Options page opens in a new tab.
- [ ] Right-click extension toolbar icon → Options → same page opens.
- [ ] Drag transparency slider → switch back to any tab with the bar → bar transparency updates live.

### AC — TODO app (todo phase)
- [ ] Add 3 TODOs → reload page → all 3 still there in order.
- [ ] Open same site in new tab → TODO list mirrors the first tab.
- [ ] Toggle a TODO done in tab A → tab B reflects within 1s.
- [ ] Delete all TODOs → list empty in both tabs.

### AC — GitHub PRs / Jira / future apps
Defined in their respective phase folders.

---

## 7. Out of Scope (system-wide, all phases)

- Mobile / tablet support.
- I18n; English-only copy.
- Telemetry without an explicit, off-by-default opt-in.
- Cross-device sync (everything is browser-local until a phase explicitly adds it).
- Chrome `chrome.sidePanel` API (we use a WXT `createShadowRootUi` overlay for cross-browser parity).
- Anything not listed in [`roadmap.md`](roadmap.md).
