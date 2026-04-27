# Scope — Setup and UI/UX

## In scope

### Extension foundation
- WXT + React + Tailwind project bootstrapped via `pnpm dlx wxt@latest init` (or hand-authored equivalents — see `plan.md`).
- TypeScript, MV3 Chrome / Edge, MV2 Firefox.
- `wxt.config.ts` with:
  - `modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons']`
  - `manifest: { name: 'Glimpse Bar', permissions: ['storage'], host_permissions: ['<all_urls>'] }`
- `tailwind.config.js` (`darkMode: 'class'`) + `postcss.config.js`.
- WXT entrypoints:
  - `entrypoints/background.ts` — `defineBackground(() => {})` empty stub.
  - `entrypoints/glimpse.content/index.tsx` — content script with `defineContentScript({ matches: ['<all_urls>'], cssInjectionMode: 'ui', main })` that mounts a React app inside a shadow root via `createShadowRootUi`.
  - `entrypoints/options/index.html` + `main.tsx` — Glimpse Option Page.
- `public/icon/128.png` — source icon for `@wxt-dev/auto-icons` (auto-emits 16 / 32 / 48 / 96 / 128).
- `.gitignore` for `node_modules/`, `.output/`, `.wxt/`, `dist/`.
- `package.json` `postinstall: "wxt prepare"` so type generation runs after every `pnpm install`.

### Glimpse Bar
- Vertical icon rail, 44px wide, transparent rail with opaque tile icons (visible on any page background — see `ui-spec.md`).
- Renders on every page via the content script entrypoint.
- Lives inside the shadow root created by `createShadowRootUi`, so host-page CSS cannot bleed in.
- Four icons in this fixed order: TODO, Jira, GitHub PRs, Settings — last one separated by a 1px hairline.
- Each icon = 36px round opaque tile with a 18px Lucide icon, hover / active / focus-visible states.
- Default position: right edge, vertically centered.
- Drag handle: 6-dot grip (`GripVertical` from Lucide) at the top, `cursor: grab` → `grabbing`.
- Drag along X and Y; on release X snaps to nearest viewport edge (left or right). Y free within `[16, viewportH − barH − 16]`.
- Position + snapped edge persisted via `@wxt-dev/storage`.
- Theme follows OS (`prefers-color-scheme`); no in-options override yet.
- Smooth visual states: hover, pressed, focus-visible ring.

### Glimpse Panel
- Slide-in panel anchored next to the bar, rendered inside the same shadow root.
- Width 360px on viewports ≥ 800px, clamps to `min(360, vw − 80)` on smaller.
- Height = `100vh − 32px`.
- Slide animation 220ms ease-out via Framer Motion, reversed on close.
- Header: app icon, app name, close button. (Refresh + pin buttons deferred until apps that need them land.)
- Body: empty in this phase — a centered "{App name} — coming in a later phase" muted placeholder is acceptable.
- Closes on: close button, ESC, outside click.
- Respects `prefers-reduced-motion: reduce` (no slide).

### Glimpse Option Page
- WXT options entrypoint at `entrypoints/options/`. HTML entry declares `<meta name="manifest.open_in_tab" content="true" />` so it opens in a tab, not a popup.
- Single section: **Appearance**.
- Single control: **Transparency** slider (0–100%, label shows current value).
- Slider live-updates the `gb-transparency` storage item on `change`.
- Bar reflects new value instantly across all open tabs (via `storage.watch`).
- Page itself respects OS theme.

### Storage items (this phase, declared in `lib/storage.ts`)
| Item | Type | Storage key | Fallback |
|---|---|---|---|
| `positionItem` | `{ x: number, y: number }` | `local:gb-position` | right-center of viewport (computed at first read) |
| `edgeItem` | `'left' \| 'right'` | `local:gb-edge` | `'right'` |
| `transparencyItem` | `number` (0..1) | `local:gb-transparency` | `0.6` |
| `activeAppItem` | `'todo' \| 'jira' \| 'github' \| null` | `local:gb-active-app` | `null` |

### Cross-browser
- **Chrome** + **Edge** prod builds verified loadable. Firefox build is a stretch goal (verify it builds; full smoke can wait).
- `pnpm dev` (Chrome runner) is the primary inner-loop. WXT spawns a managed Chrome profile with the extension preinstalled — no `--load-extension` flag friction.

---

## Out of scope (deferred to later phases)

| Item | Where it lands |
|---|---|
| TODO list (add / check / delete / persist / cross-tab) | `phases/01-todo/` |
| GitHub PR fetch + auth | `phases/02-github-prs/` |
| Jira issue fetch + auth | `phases/03-jira/` |
| Theme picker (System / Light / Dark) in Options | TODO phase (folded in there) |
| Per-app enable/disable toggles in Options | TODO phase |
| Pin button on Glimpse Panel header | TODO phase |
| Refresh button on Glimpse Panel header | first phase that has refreshable data (GitHub PRs) |
| Export/import of TODO data | TODO phase |
| Background service worker logic | first phase that needs networking |
| OAuth flows | GitHub + Jira phases (token first, OAuth later) |
| Telemetry / analytics | not currently planned (`@wxt-dev/analytics` may be revisited then) |
| i18n via `@wxt-dev/i18n` | not currently planned |
| Mobile / tablet support | not planned |
| Automated tests (Vitest + `wxt/testing/fake-browser`, Playwright) | introduced once features stabilise |

---

## Why this slice

- Bar UX is the load-bearing piece. If the bar is annoying, the whole product fails. Strip away apps so we can iterate purely on feel — drag friction, snap, transparency, theme.
- An empty Glimpse Panel still proves panel mechanics: animation timing, dismissal, viewport clamping. Wiring a real app on top is mechanical once these are right.
- Fewer permissions in setup = simpler review, smaller attack surface, faster iteration.
- A pluggable app registry exists in code from day 1 (so adding TODO in the next phase is an additive change, not a refactor) but only renders the four icon stubs.
- WXT's first-class shadow root + cross-browser dev runner removes a class of build / verification problems that bit us under Plasmo.
