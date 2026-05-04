---
name: glimpse-options
description: >
  Patterns for the Glimpse Option Page — adding settings sections, form controls,
  hooks, and message passing. Use this skill whenever the user wants to add a new
  settings section, a new toggle/slider/dropdown, connect a feature to its options UI,
  or asks "where do I add the setting for X?". Also invoke it when editing any file
  under entrypoints/options/.
---

# Glimpse Option Page — Patterns

The Options page is a standard WXT options entrypoint at `entrypoints/options/`.

Entry point: `entrypoints/options/main.tsx`
Sections live in: `entrypoints/options/sections/`

---

## Page layout

```tsx
// entrypoints/options/main.tsx
<main className="min-h-screen bg-white p-6 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
  <div className="mx-auto max-w-2xl">
    <h1 className="mb-6 text-[20px] font-semibold">Glimpse Bar — Options</h1>

    {/* sections, each separated by a divider */}
    <AppearanceSection />

    <hr className="my-6 border-black/[0.08] dark:border-white/[0.08]" />

    <AppVisibilitySection />

    <hr className="my-6 border-black/[0.08] dark:border-white/[0.08]" />

    <GitHubSection />
  </div>
</main>
```

Dark mode: Tailwind `dark:` prefix. The page reads `prefers-color-scheme` via:
```ts
const [dark, setDark] = useState(
  window.matchMedia("(prefers-color-scheme: dark)").matches
)
// then applies `class="dark"` on <html>
```

---

## Adding a new section

### 1. Create the section component

`entrypoints/options/sections/YourSection.tsx`

```tsx
import { useStorageItem } from "~/entrypoints/glimpse.content/hooks/useStorageItem"
import { yourItem } from "~/lib/storage"

export function YourSection() {
  const [value, setValue] = useStorageItem(yourItem)

  return (
    <section>
      <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Section Title
      </h2>
      <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
        Brief explanation of what this section controls.
      </p>

      {/* form controls go here */}
    </section>
  )
}
```

### 2. Import and render in `main.tsx`

```tsx
import { YourSection } from "./sections/YourSection"

// inside the <div className="mx-auto max-w-2xl">:
<hr className="my-6 border-black/[0.08] dark:border-white/[0.08]" />
<YourSection />
```

---

## Typography classes (Options page)

| Element | Class |
|---------|-------|
| H1 (page title) | `text-[20px] font-semibold` |
| H2 (section heading) | `text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400` |
| Label | `text-sm font-medium` or `text-[13px] font-medium` |
| Help / description | `text-xs text-neutral-500 dark:text-neutral-400` |
| Error text | `text-xs text-red-600 dark:text-red-400` |
| Success text | `text-xs text-green-600 dark:text-green-500` |

---

## Form control patterns

### Slider (range)

```tsx
<input
  type="range"
  min={0} max={100} step={1}
  value={Math.round(value * 100)}
  onChange={(e) => setValue(Number(e.target.value) / 100)}
  className="w-full max-w-md accent-blue-500"
/>
<span className="text-xs text-neutral-500">{Math.round(value * 100)}%</span>
```

### Checkbox / toggle

```tsx
<label className="flex cursor-pointer items-center gap-3">
  <input
    type="checkbox"
    checked={!hidden.includes(app.id)}
    onChange={() => toggle(app.id)}
    className="accent-blue-500"
  />
  <span className="text-sm font-medium">{app.name}</span>
</label>
```

### Select / dropdown

```tsx
<select
  value={selectedValue}
  onChange={(e) => setSelectedValue(e.target.value)}
  className="rounded-md border border-neutral-200 px-2 py-1 text-sm
             dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
>
  <option value="5">5 minutes</option>
  <option value="15">15 minutes</option>
</select>
```

### Text input (e.g. PAT / token)

```tsx
<input
  type="password"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  placeholder="ghp_..."
  className="w-full rounded-md border border-neutral-200 px-3 py-1.5 text-sm
             focus:outline-none focus:ring-2 focus:ring-blue-500
             dark:border-neutral-700 dark:bg-neutral-900"
/>
```

### Button — primary

```tsx
<button
  type="button"
  onClick={handleAction}
  disabled={loading}
  className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white
             hover:bg-blue-700 disabled:opacity-50"
>
  {loading ? "Saving…" : "Save"}
</button>
```

### Button — secondary / ghost

```tsx
<button
  type="button"
  onClick={handleAction}
  className="rounded-md border border-neutral-200 px-4 py-1.5 text-sm
             hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
>
  Cancel
</button>
```

---

## Storage in the options page

```ts
import { useStorageItem } from "~/entrypoints/glimpse.content/hooks/useStorageItem"
import { myItem } from "~/lib/storage"

const [value, setValue] = useStorageItem(myItem)
```

For **live preview** (changes visible before Save), watch the item directly:

```ts
useEffect(() => {
  return myItem.watch((next) => setLocalPreview(next))
}, [])
```

For **partial object updates:**

```ts
setUi({ ...ui, fieldName: newValue })
```

---

## Message passing to background

When an action needs the service worker (e.g. triggering a sync, testing a token):

```ts
// in an options section component
chrome.runtime.sendMessage({ type: "feature:action", payload: data })

// with async response
const result = await chrome.runtime.sendMessage({ type: "feature:testToken", token })
```

Registered message types in `entrypoints/background.ts`:
- `"gh:sync"` — trigger GitHub PR sync
- `"gh:testPat"` — test PAT validity, returns `{ login, avatarUrl, scopes }`
- `"gh:disconnect"` — clear auth and stop sync
- `"openOptionsPage"` — open options from content script

---

## Opening options from a content script

Content scripts cannot call `chrome.runtime.openOptionsPage()` reliably. Send to background:

```ts
// content script
chrome.runtime.sendMessage({ type: "openOptionsPage" })

// background.ts (already registered)
chrome.runtime.openOptionsPage()
```

---

## Existing sections reference

| Section | File | Storage used |
|---------|------|-------------|
| Appearance (transparency) | `main.tsx` inline | `transparencyItem` |
| App Visibility | `sections/AppVisibilitySection.tsx` | `hiddenAppsItem` |
| GitHub | `sections/GitHubSection.tsx` | `githubAuthItem`, `githubReposItem`, `githubUiItem` |

---

## Checklist — adding a new settings section

- [ ] Declare storage item in `lib/storage.ts` (see `glimpse-storage` skill)
- [ ] Create `entrypoints/options/sections/YourSection.tsx`
- [ ] Use `useStorageItem()` for all reads/writes
- [ ] Add `<hr>` divider + `<YourSection />` in `main.tsx`
- [ ] `pnpm compile && pnpm build` pass
- [ ] Manually verify in Options page — dark + light mode both look correct
