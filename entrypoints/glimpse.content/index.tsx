import "./style.css"

import ReactDOM from "react-dom/client"

import App from "./App"

const HOST_TAG = "glimpse-ui"
const MAX_Z = "2147483647"

const forceHostStacking = () => {
  // WXT's overlay position sets `position: fixed; inset: 0; pointer-events: none`
  // on the custom-element host but does NOT set z-index. Without an explicit
  // z-index, host pages with z-index'd UIs (Notion, ChatGPT, dashboards) can
  // paint over our bar / panel. Pin the host to max int.
  const host = document.querySelector(HOST_TAG) as HTMLElement | null
  if (host) {
    host.style.zIndex = MAX_Z
    host.style.position = "fixed"
    host.style.inset = "0"
    host.style.pointerEvents = "none"
  }
}

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  allFrames: false,
  cssInjectionMode: "ui",

  async main(ctx) {
    // eslint-disable-next-line no-console
    console.log("[glimpse-bar] mounting on", window.location.href)

    const ui = await createShadowRootUi(ctx, {
      name: HOST_TAG,
      position: "overlay",
      anchor: "body",
      onMount: (container) => {
        const mount = document.createElement("div")
        mount.id = "glimpse-bar-react-root"
        container.append(mount)
        const root = ReactDOM.createRoot(mount)
        root.render(<App />)
        return root
      },
      onRemove: (root) => {
        root?.unmount()
      }
    })

    ui.mount()
    forceHostStacking()

    // SPA resilience: if a host page replaces document.body (e.g. ChatGPT
    // routes), our custom element gets removed. Re-mount and re-stack.
    ctx.addEventListener(window, "wxt:locationchange", () => {
      if (!document.querySelector(HOST_TAG)) {
        ui.mount()
        forceHostStacking()
      }
    })
  }
})
