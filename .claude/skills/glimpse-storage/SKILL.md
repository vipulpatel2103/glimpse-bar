---
name: glimpse-storage
description: >
  WXT storage patterns for the Glimpse Bar project. Use this skill whenever you need
  to persist state, add a new storage item, read/write storage in a component or hook,
  understand the difference between local and sync storage, or troubleshoot storage
  reactivity. Invoke it when the user mentions "save", "persist", "remember",
  "storage", "settings that survive reload", or asks where state lives.
---

# Glimpse Bar — Storage Patterns

Storage uses [`@wxt-dev/storage`](https://wxt.dev/storage). All items declared in `lib/storage.ts`.

---

## Define a storage item

```ts
import { storage } from "@wxt-dev/storage"

export const myItem = storage.defineItem<MyType>(
  "local:gb-feature-name",   // key
  { fallback: defaultValue }  // always provide a fallback
)
```

### Namespace: `local:` vs `sync:`

| Namespace | When to use |
|-----------|-------------|
| `local:` | Per-device state (UI layout, cache, hidden lists). Clears on profile wipe. |
| `sync:` | User credentials/auth, preferences that should follow the user across devices. |

**Rule of thumb:** Auth tokens → `sync:`. Everything else → `local:`.

### Key naming convention

```
local:gb-[feature]-[item]
sync:gb-[feature]-[item]

Examples:
  local:gb-position
  local:gb-github-prs
  local:gb-todo-ui
  sync:gb-github-auth
```

---

## All existing storage items

Defined in `lib/storage.ts`. Import from there — never redeclare.

### Core bar

| Export | Key | Type | Default |
|--------|-----|------|---------|
| `positionItem` | `local:gb-position` | `{x,y}` | `{x:0,y:0}` |
| `edgeItem` | `local:gb-edge` | `"right"\|"left"` | `"right"` |
| `transparencyItem` | `local:gb-transparency` | `number` | `0.6` |
| `activeAppItem` | `local:gb-active-app` | `AppId\|null` | `null` |
| `hiddenAppsItem` | `local:gb-hidden-apps` | `AppId[]` | `[]` |

### TODO phase

| Export | Key | Type |
|--------|-----|------|
| `todosItem` | `local:gb-todos` | `TodoItem[]` |
| `listsItem` | `local:gb-lists` | `ListMeta[]` |
| `todoUiItem` | `local:gb-todo-ui` | `{activeView,expanded,pinned,sidebarCollapsed}` |

### GitHub PRs phase

| Export | Key | Type |
|--------|-----|------|
| `githubAuthItem` | `sync:gb-github-auth` | `GitHubAuthState` |
| `githubPrsItem` | `local:gb-github-prs` | `PullRequest[]` |
| `githubReposItem` | `local:gb-github-repos` | `RepoMeta[]` |
| `githubHiddenItem` | `local:gb-github-hidden` | `PrId[]` |
| `githubUiItem` | `local:gb-github-ui` | `{activeTab,expanded,pinned,sidebarCollapsed,refreshIntervalMin}` |

### Constants (not stored — compile-time)

```ts
export const BAR_WIDTH = 44
export const PANEL_WIDTH = 360
export const PANEL_WIDTH_EXPANDED = 720
export const PANEL_GAP = 4
export const EXPAND_BREAKPOINT = 720
```

---

## Read/write in a React component

```ts
import { useStorageItem } from "~/entrypoints/glimpse.content/hooks/useStorageItem"
import { myItem } from "~/lib/storage"

function MyComponent() {
  const [value, setValue] = useStorageItem(myItem)
  // value: MyType (starts as fallback, then hydrates from storage)
  // setValue: (next: MyType) => void  (async under the hood, fire-and-forget)

  return <button onClick={() => setValue(newValue)}>Update</button>
}
```

### Critical: don't seed React state from the storage value

`useStorageItem` returns the fallback synchronously, then re-renders with the real value.
`useState(value)` locks in the fallback and ignores the real value when it arrives.

```ts
// wrong
const [local, setLocal] = useState(value)

// correct — read through the ref on demand
const valueRef = useRef(value)
valueRef.current = value   // always fresh on every render
```

---

## Read/write in a hook or service (outside React)

```ts
// one-time read
const current = await myItem.getValue()

// write
await myItem.setValue(next)

// watch for changes (cross-tab reactivity)
const unwatch = myItem.watch((next) => {
  // called whenever value changes in any context
})
// cleanup: call unwatch() when done
```

---

## Read/write from the background service worker

The background script (`entrypoints/background.ts`) can access storage directly — no hooks needed.

```ts
import { myItem } from "~/lib/storage"

const current = await myItem.getValue()
await myItem.setValue(next)
```

---

## Triggering background actions from content script

Content scripts can't do everything (alarms, fetch with certain headers, etc.). Send a message:

```ts
// content script → background
chrome.runtime.sendMessage({ type: "your-feature:action", payload: data })

// background.ts — register handler
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "your-feature:action") {
    doWork(msg.payload).then(sendResponse)
    return true  // keep channel open for async response
  }
})
```

Existing message types (background.ts):
- `"gh:sync"` — trigger GitHub PR refresh
- `"gh:testPat"` — test a PAT token
- `"gh:disconnect"` — clear GitHub auth
- `"openOptionsPage"` — open the options page

---

## Partial object updates

`defineItem` stores the whole value. For object types, spread manually:

```ts
const [ui, setUi] = useStorageItem(githubUiItem)

// update one field
setUi({ ...ui, expanded: true })
```

---

## Adding a new item — checklist

- [ ] Declare in `lib/storage.ts` with `storage.defineItem<T>(key, { fallback })`
- [ ] Use `local:gb-` prefix for device-local state, `sync:gb-` for user-synced
- [ ] Export the item so components can import it
- [ ] Use `useStorageItem(item)` in React components
- [ ] Never re-declare the same key in two places
