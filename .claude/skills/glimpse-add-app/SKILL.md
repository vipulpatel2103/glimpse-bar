---
name: glimpse-add-app
description: >
  How to add a new app (panel + icon) to the Glimpse Bar. Use this skill whenever
  the user wants to add a new app, panel, integration, or icon to the Glimpse sidebar —
  even if they say "add Jira support", "add a calendar app", "create a new panel", or
  just "add [X] to the bar". Always invoke this skill before touching any app-related files.
---

# Adding a New App to the Glimpse Bar

A "Glimpse app" = one icon tile in the bar + one panel that slides out when clicked.
Four files always change; two more are optional. Follow in this order.

---

## 1. Add the ID — `lib/apps/types.ts`

```ts
// Extend the AppId union:
export type AppId = "todo" | "jira" | "github" | "settings" | "your-app"
```

The id string is the stable key used in storage, registry, and the panel switch.

---

## 2. Register the app — `lib/apps/registry.ts`

Add an entry to `ALL_APPS`. Set `enabled: false` during development; flip to `true` to ship.

```ts
import { YourIcon } from "lucide-react"
import { YourApp } from "~/entrypoints/glimpse.content/components/your-app/YourApp"

// inside ALL_APPS:
{
  id: "your-app",
  name: "Your App",          // shown in panel header tooltip
  Icon: YourIcon,            // Lucide icon, size=18 strokeWidth=2.25 on the bar
  Renderer: YourApp as unknown as ComponentType,
  enabled: true,             // false = hidden from bar entirely
  // isExternal: true        // uncomment only if clicking opens a new tab / options page
},
```

**Rule:** Settings always stays last. New apps go before it.

---

## 3. Wire the renderer — `entrypoints/glimpse.content/components/GlimpsePanel.tsx`

The panel uses an `if/else` chain. Add a branch for your app:

```tsx
} : app.id === "your-app" ? (
  <YourApp theme={theme} />
) : (
  // ... existing fallback
```

Import `YourApp` at the top of the file.

---

## 4. Build the Renderer component

Create `entrypoints/glimpse.content/components/your-app/YourApp.tsx`.

### Minimal stub (placeholder, not yet implemented)

```tsx
import { X, YourIcon } from "lucide-react"

interface Props { theme: "light" | "dark" }

export function YourApp({ theme }: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const border = theme === "dark" ? "1px solid rgba(255,255,255,0.06)"
                                  : "1px solid rgba(0,0,0,0.06)"
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header
        className="flex h-11 shrink-0 items-center gap-2 px-3"
        style={{ borderBottom: border }}>
        <YourIcon size={16} strokeWidth={2} aria-hidden />
        <h2 className="flex-1 text-[14px] font-semibold leading-none">Your App</h2>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 py-8 text-center">
        <p className="text-[13px]" style={{ color: muted }}>
          Coming soon
        </p>
      </div>
    </div>
  )
}
```

### Full-featured app structure

```
entrypoints/glimpse.content/components/your-app/
├── YourApp.tsx          ← root (flex column, height 100%)
├── YourHeader.tsx       ← 44px header: icon + title + close + actions
├── YourListView.tsx     ← scrollable body content
└── YourCardRow.tsx      ← individual item row
```

**Key prop:** Every renderer receives `theme: "light" | "dark"`. Use it for all inline color styles (see `glimpse-design` skill for tokens).

**Panel dimensions (from `lib/storage.ts`):**
```ts
BAR_WIDTH = 44
PANEL_WIDTH = 360           // compact
PANEL_WIDTH_EXPANDED = 720  // with sidebar open
PANEL_GAP = 4
EXPAND_BREAKPOINT = 720     // viewport px at which expanded layout kicks in
```

---

## 5. Storage (if your app needs persistent state)

Add to `lib/storage.ts` (see `glimpse-storage` skill for full patterns):

```ts
// App-specific UI state
export const yourAppUiItem = storage.defineItem<YourUiState>(
  "local:gb-your-app-ui",
  { fallback: { expanded: false, pinned: false } }
)

// Auth / credentials → use "sync:" so they survive profile reinstalls
export const yourAppAuthItem = storage.defineItem<YourAuthState>(
  "sync:gb-your-app-auth",
  { fallback: {} }
)
```

Read in component:
```ts
const [ui, setUi] = useStorageItem(yourAppUiItem)
```

---

## 6. Optional: lib folder (for non-trivial apps)

When the app has API calls, data transforms, or complex state:

```
lib/your-app/
├── types.ts        ← TypeScript interfaces for data shapes
├── api.ts          ← fetch / chrome.runtime calls
├── selectors.ts    ← pure functions that derive view data from raw state
└── mutations.ts    ← functions that produce next-state from events
```

Background sync (if polling): register message handlers in `entrypoints/background.ts`.

---

## Checklist

- [ ] `AppId` union extended in `lib/apps/types.ts`
- [ ] Entry added to `ALL_APPS` in `lib/apps/registry.ts`
- [ ] Renderer branch added in `GlimpsePanel.tsx`
- [ ] Renderer component created (even if stub)
- [ ] Storage items added to `lib/storage.ts` (if needed)
- [ ] `pnpm compile && pnpm build` pass
- [ ] Manually loaded in Chrome and icon visible in bar
