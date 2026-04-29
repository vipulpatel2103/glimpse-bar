import { listsItem, todosItem } from "~/lib/storage"
import { addTodo, ensureInbox } from "~/lib/todos/mutations"
import { selectToday } from "~/lib/todos/selectors"
import type { TodoItem } from "~/lib/todos/types"

type GlimpseMessage = { type: "openOptionsPage" }

const MENU_SELECTION = "gb-add-selection"
const MENU_PAGE = "gb-add-page"
const MAX_TEXT_LEN = 280
const BADGE_COLOR = "#2563eb"

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

export default defineBackground(() => {
  // ── openOptionsPage bridge (Phase 00) ─────────────────────────────────
  chrome.runtime.onMessage.addListener(
    (
      message: GlimpseMessage | undefined,
      _sender,
      sendResponse: (resp: { ok: boolean; error?: string }) => void
    ) => {
      if (message?.type === "openOptionsPage") {
        try {
          chrome.runtime.openOptionsPage(() => {
            const err = chrome.runtime.lastError
            if (err) {
              sendResponse({ ok: false, error: err.message })
            } else {
              sendResponse({ ok: true })
            }
          })
        } catch (err) {
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : String(err)
          })
        }
        return true
      }
      return false
    }
  )

  // ── Context menus + badge counter (Phase 01 Step 9) ───────────────────
  chrome.runtime.onInstalled.addListener(registerContextMenus)
  // SW startup also registers — onInstalled doesn't fire on browser restart.
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

  // Initial badge sync + watcher. SWs in MV3 sleep between events; the
  // watcher re-attaches whenever the SW wakes, and we run an initial
  // pass so cold starts don't show a stale count.
  void todosItem.getValue().then((v) => updateBadge(v as TodoItem[]))
  todosItem.watch((next) => {
    void updateBadge(next as TodoItem[])
  })
})
