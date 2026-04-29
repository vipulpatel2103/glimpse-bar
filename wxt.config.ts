import { defineConfig } from "wxt"

export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  manifest: {
    name: "Glimpse Bar",
    description:
      "Floating sidebar — TODO, Jira, GitHub PRs — on every page.",
    // `contextMenus` powers right-click → "Add selection / page as task"
    // (Phase 01 Step 9). `action` is required so the toolbar icon and
    // badge counter (today-incomplete tasks) are wired up.
    permissions: ["storage", "contextMenus"],
    host_permissions: ["<all_urls>"],
    action: {}
  }
})
