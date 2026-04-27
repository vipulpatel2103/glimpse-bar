import { defineConfig } from "wxt"

export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  manifest: {
    name: "Glimpse Bar",
    description:
      "Floating sidebar — TODO, Jira, GitHub PRs — on every page.",
    permissions: ["storage"],
    host_permissions: ["<all_urls>"]
  }
})
