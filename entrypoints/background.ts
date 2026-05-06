import {
  activeAppItem,
  githubAuthItem,
  githubHiddenItem,
  githubPrsItem,
  githubReposItem,
  githubUiItem,
  listsItem,
  todoUiItem,
  todosItem
} from "~/lib/storage"
import { getViewer, missingScopes } from "~/lib/github/api"
import { runSync } from "~/lib/github/sync"
import { addTodo, ensureInbox } from "~/lib/todos/mutations"
import { selectToday } from "~/lib/todos/selectors"
import type { TodoItem } from "~/lib/todos/types"

type GlimpseMessage =
  | { type: "openOptionsPage"; hash?: string }
  | { type: "gh:testPat"; pat: string }
  | { type: "gh:sync"; manual?: boolean }
  | { type: "gh:disconnect" }

const MENU_SELECTION = "gb-add-selection"
const MENU_PAGE = "gb-add-page"
const MAX_TEXT_LEN = 280
const BADGE_COLOR = "#2563eb"
const ALARM_GH_SYNC = "gh-sync"

async function captureToInbox(rawText: string): Promise<void> {
  const text = rawText.trim().replace(/\s+/g, " ").slice(0, MAX_TEXT_LEN)
  if (!text) return
  try {
    const [todos, lists] = await Promise.all([
      todosItem.getValue(),
      listsItem.getValue()
    ])
    const safeLists = ensureInbox(lists)
    const { items } = addTodo(todos, safeLists, { text })
    await todosItem.setValue(items)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[glimpse-bar] captureToInbox failed", err)
  }
}

async function updateBadge(items: TodoItem[]): Promise<void> {
  // Today-incomplete count. selectToday filters root tasks with
  // dueAt <= endOfToday and !done, so overdue items roll into the badge
  // automatically.
  const count = selectToday(items, Date.now()).length
  try {
    await chrome.action.setBadgeText({
      text: count > 0 ? String(count) : ""
    })
    if (count > 0) {
      await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR })
    }
  } catch (err) {
    // chrome.action may be unavailable on some channels; log and move on.
    // eslint-disable-next-line no-console
    console.warn("[glimpse-bar] updateBadge failed", err)
  }
}

function registerContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_SELECTION,
      title: "Add selection as task",
      contexts: ["selection"]
    })
    chrome.contextMenus.create({
      id: MENU_PAGE,
      title: "Add page as task",
      contexts: ["page"]
    })
  })
}

async function setupGhAlarm(): Promise<void> {
  const ui = await githubUiItem.getValue()
  chrome.alarms.create(ALARM_GH_SYNC, { periodInMinutes: ui.refreshIntervalMin })
}

export default defineBackground(() => {
  // ── Options page bridge (Phase 00 +) ─────────────────────────────────────
  // Supports an optional `hash` so the panel can deep-link into a section
  // (e.g. { type: 'openOptionsPage', hash: 'github' } → options.html#github).
  chrome.runtime.onMessage.addListener(
    (
      message: GlimpseMessage | undefined,
      _sender,
      sendResponse: (resp: { ok: boolean; error?: string; [k: string]: unknown }) => void
    ) => {
      // ── openOptionsPage ─────────────────────────────────────────────────
      if (message?.type === "openOptionsPage") {
        const hash = message.hash
        if (hash) {
          // chrome.runtime.openOptionsPage() can't navigate to a specific hash,
          // so open (or focus) a tab directly.
          const url = chrome.runtime.getURL("options.html") + "#" + hash
          chrome.tabs.query({ url }, (existing) => {
            if (existing.length > 0 && existing[0].id != null) {
              void chrome.tabs.update(existing[0].id, { active: true })
            } else {
              void chrome.tabs.create({ url })
            }
            sendResponse({ ok: true })
          })
        } else {
          try {
            chrome.runtime.openOptionsPage(() => {
              const err = chrome.runtime.lastError
              sendResponse(err ? { ok: false, error: err.message } : { ok: true })
            })
          } catch (err) {
            sendResponse({
              ok: false,
              error: err instanceof Error ? err.message : String(err)
            })
          }
        }
        return true
      }

      // ── gh:testPat ──────────────────────────────────────────────────────
      if (message?.type === "gh:testPat") {
        const { pat } = message
        getViewer(pat)
          .then((viewer) => {
            const ms = missingScopes(viewer)
            sendResponse({
              ok:              true,
              login:           viewer.login,
              avatarUrl:       viewer.avatarUrl,
              scopes:          viewer.scopes,
              isFinegrained:   viewer.isFinegrained,
              missing:         ms.missing
            })
          })
          .catch((err: unknown) => {
            sendResponse({
              ok:    false,
              error: err instanceof Error ? err.message : String(err)
            })
          })
        return true
      }

      // ── gh:sync ─────────────────────────────────────────────────────────
      if (message?.type === "gh:sync") {
        void runSync({ manual: message.manual ?? false })
        sendResponse({ ok: true })
        return true
      }

      // ── gh:disconnect ───────────────────────────────────────────────────
      if (message?.type === "gh:disconnect") {
        Promise.all([
          githubAuthItem.setValue({}),
          githubPrsItem.setValue([]),
          githubReposItem.setValue([]),
          githubHiddenItem.setValue([])
          // githubUiItem intentionally untouched — preserve view preference.
        ])
          .then(() => sendResponse({ ok: true }))
          .catch((err: unknown) => {
            sendResponse({
              ok:    false,
              error: err instanceof Error ? err.message : String(err)
            })
          })
        return true
      }

      return false
    }
  )

  // ── Context menus + badge counter (Phase 01 Step 9) ───────────────────────
  chrome.runtime.onInstalled.addListener(registerContextMenus)
  registerContextMenus()

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === MENU_SELECTION) {
      void captureToInbox(info.selectionText ?? "")
      return
    }
    if (info.menuItemId === MENU_PAGE) {
      const title = tab?.title?.trim()
      const url = info.pageUrl ?? tab?.url ?? ""
      const text = title ? `${title} — ${url}` : url
      void captureToInbox(text)
    }
  })

  // ── Toolbar action click → open TODO "Today" view ─────────────────────────
  // Pinned action icon is the user's quickest path to today's tasks. Setting
  // storage triggers the content script's useStorageItem watch and the panel
  // slides in. Tabs without a content script (chrome://, store) silently no-op
  // and pick up the state on the next page that has the bar.
  chrome.action.onClicked.addListener(() => {
    void (async () => {
      try {
        const ui = await todoUiItem.getValue()
        if (ui.activeView !== "today") {
          await todoUiItem.setValue({ ...ui, activeView: "today" })
        }
        await activeAppItem.setValue("todo")
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[glimpse-bar] action.onClicked failed", err)
      }
    })()
  })

  void todosItem.getValue().then((v) => updateBadge(v as TodoItem[]))
  todosItem.watch((next) => {
    void updateBadge(next as TodoItem[])
  })

  // ── GitHub auto-sync alarm (Phase 02) ─────────────────────────────────────
  // Re-create the alarm on every SW startup so the period reflects the current
  // user preference. chrome.alarms.create with the same name replaces any
  // existing alarm, so this is idempotent.
  void setupGhAlarm()

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_GH_SYNC) {
      void runSync({ manual: false })
    }
  })

  // Re-create alarm if the user changes the refresh interval in Options.
  githubUiItem.watch((next, prev) => {
    if (next?.refreshIntervalMin !== prev?.refreshIntervalMin) {
      void setupGhAlarm()
    }
  })
})
