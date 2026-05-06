# Architecture

> **Doc owner:** glimpse-bar
> **Status:** Draft (2026-04-27)
> **Audience:** engineers about to write code or extend the extension.
> **Framework:** [WXT](https://wxt.dev/) — convention-driven browser-extension build tool. Replaces our earlier Plasmo plan.

---

## 1. High-Level Picture

```
┌──────────────────────────────────────────────────────────────────┐
│  HOST WEB PAGE  (https://example.com etc.)                       │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │  <wxt-glimpse-ui> (custom element, shadow DOM)            │  │
│   │   created by createShadowRootUi(ctx, { name: 'glimpse-ui'}│   │
│   │                                                          │   │
│   │   <App>                                                  │   │
│   │     <GlimpseBar/>                                         │  │
│   │     <GlimpsePanel/>                                       │  │
│   │   </App>                                                 │   │
│   └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
        ↑ ↓                                       ↑ ↓
  storage.watch(...) events            options page writes
        ↑ ↓
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  entrypoints/background.ts  │    │  entrypoints/options/        │
│  defineBackground()          │   │  Glimpse Option Page         │
│  (empty stub for setup)      │   │  (options HTML + main.tsx)   │
└─────────────────────────────┘    └─────────────────────────────┘
                ↑                          ↑
                └─── @wxt-dev/storage  ─────┘   ← single source of truth
                     (browser.storage.local)
```

**Single source of truth** = `browser.storage.local` accessed via `@wxt-dev/storage`. Every surface (content script on every tab, options page, future background) reads/writes through `storage.defineItem(...)`. `storage.watch(...)` fires in every context when any context writes — so cross-tab sync is free.

---

## 2. Project Layout (WXT conventions)

```
glimpse-bar/
├── package.json              ← scripts + deps; manifest is in wxt.config.ts
├── tsconfig.json             ← extends .wxt/tsconfig.json (auto-generated)
├── wxt.config.ts             ← modules + manifest overrides
├── tailwind.config.js
├── postcss.config.js
├── entrypoints/              ← file-based routing (the heart of WXT)
│   ├── background.ts                ← defineBackground(() => {...})
│   ├── glimpse.content/             ← content script (folder = entrypoint)
│   │   ├── index.tsx                ← defineContentScript + createShadowRootUi
│   │   ├── App.tsx                  ← React root: <GlimpseBar/> + <GlimpsePanel/>
│   │   ├── components/
│   │   │   ├── GlimpseBar.tsx
│   │   │   ├── GlimpsePanel.tsx
│   │   │   ├── AppIconButton.tsx
│   │   │   └── DragHandle.tsx
│   │   ├── hooks/
│   │   │   ├── useDrag.ts
│   │   │   ├── useTheme.ts
│   │   │   └── useStorageItem.ts    ← thin React wrapper over @wxt-dev/storage
│   │   └── style.css                ← @tailwind directives, content-script-scoped
│   └── options/                     ← options page (folder = entrypoint)
│       ├── index.html               ← HTML entrypoint, mounts main.tsx
│       ├── main.tsx                 ← React root for the options page
│       └── style.css
├── lib/                       ← cross-entrypoint code
│   ├── storage.ts             ← typed storage.defineItem(...) declarations
│   └── apps/
│       ├── types.ts
│       └── registry.ts
├── public/                    ← copied verbatim into the extension build
│   └── icon/                  ← @wxt-dev/auto-icons reads from here
│       └── 128.png
└── docs/                      ← these files
```

**Why these names:**
- WXT discovers entrypoints by filename. `entrypoints/background.ts` → service worker. `entrypoints/<name>.content/index.tsx` → content script. `entrypoints/options/index.html` → options page.
- A folder under `entrypoints/` is treated as an entrypoint *only* when it has an `index.{ts,tsx,html}`. Putting components in subfolders (e.g. `components/`) keeps them out of the entrypoint discovery scan.
- `lib/` lives outside `entrypoints/` so its files aren't mistaken for entrypoints.

---

## 3. WXT Modules in Use

Configured in `wxt.config.ts`:

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: [
    '@wxt-dev/module-react',   // React + JSX/TSX + Fast Refresh
    '@wxt-dev/auto-icons',     // generates 16/32/48/128 icons from public/icon/128.png
  ],
  manifest: {
    name: 'Glimpse Bar',
    description: 'A floating transparent rail on every web page — manage tasks, track plans, and review GitHub PRs without switching tabs.',
    permissions: ['storage'],
    host_permissions: ['<all_urls>'],
  },
});
```

Other WXT-ecosystem packages we install but don't register as modules (they're plain runtime deps):
- `@wxt-dev/storage` — typed `browser.storage` wrapper used everywhere.

Future phases may add: `@wxt-dev/i18n`, `@wxt-dev/analytics`, `@wxt-dev/runner`, `@wxt-dev/is-background`. None are required for setup.

---

## 4. Content Script (Glimpse Bar + Panel)

`entrypoints/glimpse.content/index.tsx`:

```tsx
import './style.css';
import ReactDOM from 'react-dom/client';
import { defineContentScript } from 'wxt/sandbox';
import { createShadowRootUi } from 'wxt/client';
import App from './App';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  allFrames: false,
  cssInjectionMode: 'ui',          // tells WXT to inject style.css into the shadow root, not the page

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'glimpse-ui',           // becomes the custom element tag
      position: 'overlay',          // fixed-position host that doesn't disturb page layout
      anchor: 'body',
      onMount(container) {
        // body anchors warn React when used as a root; create a wrapper.
        const mountEl = document.createElement('div');
        container.append(mountEl);
        const root = ReactDOM.createRoot(mountEl);
        root.render(<App />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    ui.mount();
    // ctx.onInvalidated handles HMR — wxt re-runs main() on file change.
  },
});
```

**Key WXT mechanics:**
- `cssInjectionMode: 'ui'` — `import './style.css'` is NOT injected into the host page. It's bundled separately and `createShadowRootUi` attaches it to the shadow root, so Tailwind utilities apply only inside our UI.
- `position: 'overlay'` — WXT inserts the host as `position: fixed` covering the viewport with `pointer-events: none`. Children with `pointer-events: auto` re-enable clicks.
- The host element gets the high z-index automatically; we don't need the `z-index: 2147483647` trick from the Plasmo plan.
- `ctx.isInvalid` and `ctx.onInvalidated` let us guard against double-mounting on SPA navigations.

---

## 5. State & Storage (`@wxt-dev/storage`)

### 5.1 Typed item declarations

```ts
// lib/storage.ts
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

Why `defineItem` over raw `browser.storage.local.get/set`:
- One place declares the key, type, and default.
- `getValue()` / `setValue()` are typed.
- `watch(callback)` listens to ALL writes for that key (cross-context, cross-tab).
- Versioned migrations via the `version + migrations` option (not used in setup phase).

### 5.2 React hook wrapper

WXT's storage isn't React-aware out of the box. We add a thin hook so components don't repeat `useState`+`watch`:

```ts
// entrypoints/glimpse.content/hooks/useStorageItem.ts
import { useEffect, useState } from 'react';
import type { WxtStorageItem } from '@wxt-dev/storage';

export function useStorageItem<T>(item: WxtStorageItem<T, any>) {
  const [value, setValue] = useState<T>(item.fallback as T);

  useEffect(() => {
    let cancelled = false;
    item.getValue().then((v) => {
      if (!cancelled) setValue(v);
    });
    const unwatch = item.watch((next) => setValue(next));
    return () => {
      cancelled = true;
      unwatch();
    };
  }, [item]);

  const set = async (next: T) => {
    setValue(next);
    await item.setValue(next);
  };

  return [value, set] as const;
}
```

The same hook works in the options page; storage events propagate everywhere.

---

## 6. Drag Mechanics

Identical to the previous design — pointer events, `setPointerCapture`, snap on `pointerup`, write to storage only on release. Implementation lives in `entrypoints/glimpse.content/hooks/useDrag.ts`. Framework-independent.

---

## 7. Theme Resolution

```ts
// entrypoints/glimpse.content/hooks/useTheme.ts
export function useTheme(): 'light' | 'dark' { ... }
```

Listens to `window.matchMedia('(prefers-color-scheme: dark)')`. Same as the previous plan.

The user-controlled theme override (System / Light / Dark) is deferred to the **TODO** phase, per `requirements.md` §4.4.

---

## 8. Background Service Worker (setup phase)

```ts
// entrypoints/background.ts
export default defineBackground(() => {
  // Reserved for later phases: cross-tab broadcast, OAuth, badge text.
});
```

`defineBackground` is a WXT helper. With `manifest_version: 3` (the default for Chrome / Edge), WXT emits a service worker. Firefox MV2 builds get a background page automatically.

---

## 9. Options Page

`entrypoints/options/index.html`:

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

`entrypoints/options/main.tsx` mounts a React app reading the same `transparencyItem` via `useStorageItem`. Manifest entry is auto-derived: `options_ui.page = 'options.html'`, `open_in_tab: true`.

`<meta name="manifest.open_in_tab" content="true" />` is the WXT idiom for HTML-entrypoint manifest options — keeps config close to the file.

---

## 10. Build Outputs

| Browser | Command | Output dir |
|---|---|---|
| Chrome MV3 | `pnpm build` | `.output/chrome-mv3/` |
| Firefox MV2 | `pnpm build:firefox` | `.output/firefox-mv2/` |
| Edge MV3 | `pnpm build:edge` | `.output/edge-mv3/` |
| Zips for stores | `pnpm zip`, `pnpm zip:firefox` | `.output/*.zip` |

Dev:
| Command | Behavior |
|---|---|
| `pnpm dev` | Builds to `.output/chrome-mv3-dev/`, opens a dedicated Chrome instance with the extension preloaded. HMR for content scripts and options page. |
| `pnpm dev:firefox` | Same for Firefox. |

`pnpm dev` uses WXT's runner — a separate Chrome profile with the extension auto-installed. **No `--load-extension` flag woes** like the Plasmo+Playwright setup we abandoned.

---

## 11. Manifest Permissions

Declared in `wxt.config.ts`. WXT merges permissions from entrypoints (e.g. `defineContentScript({ matches: ['<all_urls>'] })` automatically requests `<all_urls>` host permission) with explicit declarations.

```ts
manifest: {
  permissions: ['storage'],
  host_permissions: ['<all_urls>'],
}
```

Phase 0 ships **only** `storage` and `<all_urls>`. Anything more is added by the phase that needs it.

---

## 12. Performance Notes

- Tailwind CSS bundled via PostCSS into `style.css`, JIT-tree-shaken by content config in `tailwind.config.js`.
- Content script mount: WXT defers `main()` to `document_idle`; first paint of the bar is < 100ms post-mount on a modest laptop.
- During drag we only write to `storage` on `pointerup`; `pointermove` updates a local `useState` so we never await storage in the drag hot path.

---

## 13. Failure Modes & Fallbacks

| Scenario | Behavior |
|---|---|
| `browser.storage.local` read fails | `defineItem` returns the `fallback`. UI surfaces a toast in a later phase. |
| Site CSP blocking inline styles | `cssInjectionMode: 'ui'` puts our CSS inside the shadow root attached via constructable stylesheets — not affected by host CSP. |
| SPA replaces `document.body` (e.g., ChatGPT) | `createShadowRootUi` returns a `ui` object with `mount()` / `remove()` / `mounted`. `ctx.addEventListener('wxt:locationchange', ...)` lets us re-mount on URL changes. We add this in step 6 of the setup plan. |
| HMR stale React tree | `ctx.onInvalidated(() => root?.unmount())` is wired in `onRemove` — WXT calls it before re-running `main()`. |
| Quota exceeded on storage | `setValue` rejects; the hook keeps the in-memory value and logs. |

---

## 14. Why WXT (vs. our earlier Plasmo plan)

| Concern | Plasmo | WXT |
|---|---|---|
| Build time on Windows | Slow; Parcel + native deps tripped Smart App Control on this machine. | Vite-based; no native binary load issues observed. |
| Programmatic E2E | `--load-extension` silently ignored by Chrome 137+ in our test runs. | `wxt dev` boots a runner that auto-installs the build into a managed Chrome profile. |
| Shadow DOM helper | Manual `getStyle()` + `:root → :host` rewrite. | First-class `createShadowRootUi(ctx, { ... })` with mount/remove lifecycle. |
| Storage helper | `@plasmohq/storage` (good, but not typed defaults). | `@wxt-dev/storage` with typed `defineItem`, fallbacks, migrations, and `watch`. |
| Manifest config | `package.json#manifest`. | `wxt.config.ts` (typed) + per-entrypoint meta tags. |
| MV3/MV2 + cross-browser | Both via flags. | Both via flags; same code, no fork. |

Logged in `roadmap.md` decision log.

---

## 15. Open Architecture Questions (deferred)

1. Per-app credential storage (Jira API token, GitHub PAT) — `local:` for now; revisit `session:` for ephemeral OAuth tokens.
2. Whether to add a popup. Currently no.
3. SW lifecycle once we add networking — MV3 SW termination + `chrome.alarms` keep-alive considerations.
