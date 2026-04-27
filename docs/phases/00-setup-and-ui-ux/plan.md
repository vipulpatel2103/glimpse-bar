# Plan — Setup and UI/UX (WXT)

> Step-by-step build order. Each step ends with a working, demoable build. Don't move to step N+1 until the exit criteria of step N pass.

---

## Step 1 — Bootstrap WXT

**Goal:** WXT + React + Tailwind project that builds and loads in Chrome.

- [ ] Inside the existing repo (which already contains `README.md` and `docs/`), bootstrap WXT manually so we don't clobber the docs:
  ```bash
  pnpm init                       # create package.json
  pnpm add -D wxt @wxt-dev/module-react @wxt-dev/auto-icons \
              tailwindcss@3 postcss autoprefixer typescript \
              @types/react @types/react-dom @types/chrome
  pnpm add react@18 react-dom@18 framer-motion lucide-react @wxt-dev/storage
  ```
- [ ] Add scripts to `package.json`:
  ```jsonc
  "scripts": {
    "dev":          "wxt",
    "dev:firefox":  "wxt -b firefox",
    "build":        "wxt build",
    "build:firefox":"wxt build -b firefox",
    "build:edge":   "wxt build -b edge",
    "zip":          "wxt zip",
    "zip:firefox":  "wxt zip -b firefox",
    "compile":      "tsc --noEmit",
    "postinstall":  "wxt prepare"
  }
  ```
- [ ] Create `wxt.config.ts`:
  ```ts
  import { defineConfig } from 'wxt';

  export default defineConfig({
    modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
    manifest: {
      name: 'Glimpse Bar',
      description: 'Floating sidebar — TODO, Jira, GitHub PRs — on every page.',
      permissions: ['storage'],
      host_permissions: ['<all_urls>'],
    },
  });
  ```
- [ ] Create `tsconfig.json`:
  ```json
  { "extends": "./.wxt/tsconfig.json" }
  ```
- [ ] Run `pnpm install` (this triggers `wxt prepare` → generates `.wxt/`).
- [ ] Create `tailwind.config.js`:
  ```js
  /** @type {import('tailwindcss').Config} */
  module.exports = {
    darkMode: 'class',
    content: [
      './entrypoints/**/*.{ts,tsx,html}',
      './lib/**/*.{ts,tsx}'
    ],
    plugins: [],
  };
  ```
- [ ] Create `postcss.config.js`:
  ```js
  module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
  ```
- [ ] Create `entrypoints/background.ts`:
  ```ts
  export default defineBackground(() => {
    // setup phase: empty stub.
  });
  ```
- [ ] Create `public/icon/128.png` — a 512×512 source icon. `@wxt-dev/auto-icons` auto-generates 16 / 32 / 48 / 96 / 128 from this. (Use a placeholder for now — design pass in step 9.)
- [ ] Add `.gitignore`:
  ```
  node_modules/
  .output/
  .wxt/
  dist/
  *.log
  ```
- [ ] `pnpm dev` — confirm WXT spawns a Chrome window with the extension installed and `.output/chrome-mv3-dev/` exists.
- [ ] **Commit:** `chore: bootstrap wxt + react + tailwind scaffold`.

**Exit criteria:** dev runner launches, extension visible in `chrome://extensions`, no console errors.

---

## Step 2 — Empty content script (shadow root placeholder)

**Goal:** an empty rail appears on every page, proving shadow-root + Tailwind injection works.

- [ ] Create `entrypoints/glimpse.content/index.tsx`:
  ```tsx
  import './style.css';
  import ReactDOM from 'react-dom/client';
  import App from './App';

  export default defineContentScript({
    matches: ['<all_urls>'],
    runAt: 'document_idle',
    allFrames: false,
    cssInjectionMode: 'ui',

    async main(ctx) {
      const ui = await createShadowRootUi(ctx, {
        name: 'glimpse-ui',
        position: 'overlay',
        anchor: 'body',
        onMount: (container) => {
          const mount = document.createElement('div');
          container.append(mount);
          const root = ReactDOM.createRoot(mount);
          root.render(<App />);
          return root;
        },
        onRemove: (root) => root?.unmount(),
      });
      ui.mount();
    },
  });
  ```
- [ ] Create `entrypoints/glimpse.content/App.tsx`:
  ```tsx
  export default function App() {
    return (
      <div
        className="fixed right-0 top-1/2 -translate-y-1/2 w-11 h-56
                   rounded-l-2xl bg-black/60 backdrop-blur-md
                   pointer-events-auto"
      />
    );
  }
  ```
- [ ] Create `entrypoints/glimpse.content/style.css`:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- [ ] Reload extension → visit `https://example.com` → see the placeholder rail.
- [ ] Visit `https://github.com` → still visible against dark UI.
- [ ] Visit `https://chatgpt.com` → still visible (this is the SPA case; we'll make it more robust in step 7).
- [ ] **Commit:** `feat(content): mount empty glimpse rail on all pages`.

**Exit criteria:** placeholder visible on at least 3 different sites (light + dark + SPA).

---

## Step 3 — Bar layout with icons

**Goal:** real bar visuals with 4 icons. No drag, no panel yet.

- [ ] Create `lib/apps/types.ts` and `lib/apps/registry.ts` per [`../../architecture.md`](../../architecture.md) §5. Renderer for non-Settings apps is `() => null` for now.
- [ ] Create components under `entrypoints/glimpse.content/components/`:
  - `AppIconButton.tsx` — round 36×36 button with Lucide icon, `aria-label`, hover/active states.
  - `DragHandle.tsx` — 44×18 hit-box with `<GripVertical size={16}>`. Cursor `grab`. `onPointerDown` is a stub `console.log` for now.
  - `GlimpseBar.tsx` — vertical stack: DragHandle, then map registry to AppIconButtons. Insert a 1px `gb-panel-border` divider above the Settings tile.
- [ ] Wire `<GlimpseBar/>` inside `App.tsx` (replace the placeholder div).
- [ ] Tune visuals against [`ui-spec.md`](ui-spec.md) until it matches the user's screenshot reference.
- [ ] **Commit:** `feat(bar): static layout with lucide app icons`.

**Exit criteria:** bar matches `ui-spec.md` on a light test page. Icons crisp on a dark page. Right-edge rounding correct (`rounded-l-2xl` only).

---

## Step 4 — Storage layer

**Goal:** state model in place. No new UI.

- [ ] Create `lib/storage.ts`:
  ```ts
  import { storage } from '@wxt-dev/storage';
  import type { AppId } from './apps/types';

  export type Position = { x: number; y: number };
  export type Edge = 'left' | 'right';

  export const positionItem = storage.defineItem<Position>('local:gb-position', {
    fallback: { x: 0, y: 0 },
  });
  export const edgeItem = storage.defineItem<Edge>('local:gb-edge', {
    fallback: 'right',
  });
  export const transparencyItem = storage.defineItem<number>('local:gb-transparency', {
    fallback: 0.6,
  });
  export const activeAppItem = storage.defineItem<AppId | null>('local:gb-active-app', {
    fallback: null,
  });
  ```
- [ ] Create `entrypoints/glimpse.content/hooks/useStorageItem.ts` per [`../../architecture.md`](../../architecture.md) §5.2.
- [ ] In the bar root, replace hard-coded transparency with the hook value. Apply via inline CSS var: `style={{ '--gb-alpha': String(alpha) }}`. Update bar background style to read from the var (or directly from the JS value via inline `backgroundColor`).
- [ ] Verify: open DevTools → Application → Storage → IndexedDB / extension storage → see `gb-transparency` populated.
- [ ] **Commit:** `feat(storage): typed @wxt-dev/storage items + react hook`.

**Exit criteria:** changing a storage value via DevTools live-updates the bar.

---

## Step 5 — Drag + snap

**Goal:** bar is draggable, snaps, persists.

- [ ] Create `entrypoints/glimpse.content/hooks/useDrag.ts`:
  - Spreadable `dragHandlers = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }`.
  - On `pointerdown`: `setPointerCapture`, save offset, mark `isDragging`.
  - On `pointermove` (when dragging): clamp & update local React state (NOT storage).
  - On `pointerup`: compute snap edge, write `position` (snapped X) + `edge` to storage via the hook.
- [ ] Wire `useDrag` to `<DragHandle>` only — clicks on icon tiles must NOT initiate drag.
- [ ] Apply `transform: translate3d(x, y, 0)` to bar root for GPU motion.
- [ ] Border-radius logic:
  - snapped right → `rounded-l-2xl`
  - snapped left → `rounded-r-2xl`
  - mid-drag → `rounded-2xl` + `shadow-[0_8px_24px_rgba(0,0,0,0.25)]` lift
- [ ] Test: drag right → mid-page → release → snaps to nearest edge. Reload → position persists. Open same site in a second tab → mirrors.
- [ ] **Commit:** `feat(drag): pointer-event drag with edge snap and persistence`.

**Exit criteria:** all "AC — Glimpse Bar" criteria in [`verification.md`](verification.md) pass.

---

## Step 6 — Theme

**Goal:** bar respects OS dark/light.

- [ ] Create `entrypoints/glimpse.content/hooks/useTheme.ts` — listens to `window.matchMedia('(prefers-color-scheme: dark)')` and returns `'light' | 'dark'`.
- [ ] Wrap the bar root in `<div className={isDark ? 'dark' : ''}>` so Tailwind `dark:` variants resolve.
- [ ] Verify on a light page (`example.com`) and a dark page (`github.com`); flip OS theme while a tab is open and confirm bar re-themes.
- [ ] **Commit:** `feat(theme): system dark/light resolution`.

**Exit criteria:** bar is correctly themed in both modes.

---

## Step 7 — Glimpse Panel shell (empty body)

**Goal:** clicking an app icon opens an empty animating panel.

- [ ] In `entrypoints/glimpse.content/components/`, create `GlimpsePanel.tsx`:
  - Props: `app: AppDefinition | null`, `barEdge: 'left'|'right'`, `onClose: () => void`.
  - Width / height per `ui-spec.md`.
  - `motion.div` slide animation: 220ms ease-out, exit reverses.
  - Skip animation if `prefers-reduced-motion: reduce`.
  - Header: app icon + app name + close button. (No refresh, no pin yet.)
  - Body: a single muted line `"{app.name} — content lands in a later phase"`, vertically centered.
- [ ] In `App.tsx`:
  - Read `activeApp` from storage hook.
  - Render `<AnimatePresence>{activeApp && <GlimpsePanel ...>}</AnimatePresence>`.
  - Close handlers: ESC keydown (window listener), outside-click (mousedown target outside panel + bar), close button.
  - Settings icon: instead of opening panel, calls `chrome.runtime.openOptionsPage()`.
- [ ] SPA resilience: WXT exposes `ctx.addEventListener('wxt:locationchange', ...)` — re-mount the UI on URL changes (covers ChatGPT-style routes that replace `body`).
- [ ] Verify: click TODO icon → panel slides in. Click GitHub → header swaps to GitHub. ESC → closes. Outside click → closes.
- [ ] **Commit:** `feat(panel): shadow-root slide-in panel with empty body`.

**Exit criteria:** all "AC — Glimpse Panel" criteria in [`verification.md`](verification.md) pass, including ChatGPT.

---

## Step 8 — Glimpse Option Page

**Goal:** transparency slider only.

- [ ] Create `entrypoints/options/index.html`:
  ```html
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Glimpse Bar — Options</title>
      <meta name="manifest.open_in_tab" content="true" />
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="./main.tsx"></script>
    </body>
  </html>
  ```
- [ ] Create `entrypoints/options/style.css` — same `@tailwind` directives.
- [ ] Create `entrypoints/options/main.tsx`:
  - Mount React app reading `transparencyItem` via `useStorageItem`.
  - Render `<Options/>` with the layout from `ui-spec.md` §5.
  - Use the same `useTheme` hook so the page also follows OS theme.
- [ ] Verify: Settings icon in bar → Options page opens in new tab → drag slider → switch back to any tab → bar updates live (cross-tab sync via `storage.watch`).
- [ ] **Commit:** `feat(options): transparency slider in glimpse option page`.

**Exit criteria:** all "AC — Glimpse Option Page" criteria in [`verification.md`](verification.md) pass.

---

## Step 9 — Polish & a11y

- [ ] Replace placeholder icon with a designed Glimpse icon at `public/icon/128.png` (512×512). `@wxt-dev/auto-icons` regenerates the rest on next build.
- [ ] Add `aria-label` to every interactive element.
- [ ] Implement keyboard nav in the bar: Tab into bar, ArrowUp/Down moves focus among icons, Enter/Space activates, Esc closes panel.
- [ ] Verify focus ring shows on `:focus-visible` only (Tailwind `focus-visible:ring-2 focus-visible:ring-blue-500`).
- [ ] Verify `prefers-reduced-motion` is respected (no panel slide; bar drag still allowed since users opted into the action).
- [ ] DevTools "Accessibility" panel: verify ≥ 4.5:1 contrast everywhere, both themes.
- [ ] **Commit:** `chore: a11y, reduced motion, brand icon`.

**Exit criteria:** WCAG-AA contrast in both themes; full keyboard reachability.

---

## Step 10 — Cross-browser smoke

- [ ] `pnpm build` → load `.output/chrome-mv3/` in Chrome → smoke test.
- [ ] `pnpm build:edge` → load `.output/edge-mv3/` in Edge → smoke test.
- [ ] `pnpm build:firefox` → load `.output/firefox-mv2/` via `about:debugging` in Firefox → smoke test.
- [ ] Document any browser-specific quirks in [`../../testing-plan.md`](../../testing-plan.md) §Known issues.
- [ ] **Commit:** `chore: verify chrome + edge + firefox builds`.

**Exit criteria:** all three browsers run the smoke test from [`verification.md`](verification.md) §"Smoke (5 min)".

---

## Definition of Done — Setup phase

- [ ] All AC in [`verification.md`](verification.md) pass on Chrome.
- [ ] Smoke test passes on Edge + Firefox.
- [ ] No `console.error` from Glimpse code on `https://example.com`, `https://github.com`, `https://chatgpt.com`, `https://www.youtube.com`, `https://www.notion.so`.
- [ ] No regressions on the listed AC sites' main flows (page scrolls, links clickable, no layout shift).
- [ ] `docs/` is consistent with the shipped code.
