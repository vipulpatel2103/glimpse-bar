type GlimpseMessage = { type: "openOptionsPage" }

export default defineBackground(() => {
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
        // keep the message channel open for the async sendResponse
        return true
      }
      return false
    }
  )
})
