import { defineConfig } from "wxt"

export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  manifest: {
    name: "Glimpse Bar",
    description:
      "A floating transparent rail on every web page — manage tasks, track plans, and review GitHub PRs without switching tabs.",
    // `contextMenus` — right-click → "Add selection / page as task" (Phase 01).
    // `action`       — toolbar icon + badge counter.
    // `alarms`       — GitHub PR auto-refresh every N minutes (Phase 02).
    permissions: ["storage", "contextMenus", "alarms"],
    host_permissions: ["<all_urls>"],
    action: {}
  }
})
