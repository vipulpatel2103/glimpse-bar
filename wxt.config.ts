import { defineConfig } from "wxt"

export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  manifest: {
    name: "Glimpse Bar",
    description:
      "Floating sidebar — TODO, Jira, GitHub PRs — on every page.",
    // `contextMenus` — right-click → "Add selection / page as task" (Phase 01).
    // `action`       — toolbar icon + badge counter.
    // `alarms`       — GitHub PR auto-refresh every N minutes (Phase 02).
    permissions: ["storage", "contextMenus", "alarms"],
    host_permissions: ["<all_urls>"],
    action: {}
  }
})
