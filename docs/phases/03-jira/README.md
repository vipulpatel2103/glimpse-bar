# Jira

> **Phase folder:** `docs/phases/03-jira/`
> **Status:** **Deferred (2026-06-03)** — superseded by [`../03-notes/`](../03-notes/) (Notes app). Jira moves to the parking lot in [`../../roadmap.md`](../../roadmap.md).
> **Plan when:** an OAuth (3LO) story exists, or the project grows a backend the bar can talk to.

---

## Why deferred

- Jira Cloud needs OAuth 3LO for a useful flow; the project has no redirect / token-rotation infrastructure.
- API tokens work but force every user to mint one in `id.atlassian.com` — high friction for the first "real productivity app" beyond TODO + PRs.
- A pure-local Notes app delivers a second "wow" without auth, network, or storage budget worry.

The original sketch (issues assigned to current user, API-token-first auth, refresh button + `chrome.alarms`, REST `/rest/api/3/search?jql=…`) is preserved below for whoever picks this up.

---

## Original one-line goal

Show issues assigned to the current user inside the Jira Glimpse Panel.

## Original likely scope (subject to planning)

- Jira issues panel renderer.
- Auth: Atlassian API token first (host + email + token in Options). OAuth (3LO) deferred.
- Connections section in Glimpse Option Page: Jira host, email, API token, "Test connection".
- Background service worker fetches Jira REST `/rest/api/3/search?jql=assignee=currentUser() AND statusCategory != Done ORDER BY updated DESC`.
- Refresh button + auto-refresh via `chrome.alarms`.
- Issue rendering: key (e.g., GAR-2141), summary, status pill, priority icon, click-through opens the Jira issue in a new tab.
- Cache last response.

## Original out of scope (this phase)

- Editing issues, transitioning status, posting comments.
- Multiple Jira tenants per user (parking-lot for v3).
- Boards, sprints, releases.
- OAuth (3LO).

## Open questions left to settle before planning

- Single global JQL vs. user-configurable JQL field in Options? (Likely: ship a sensible default, allow override via "Advanced" expandable.)
- Server (DC) Jira support, or Cloud only? (Likely: Cloud only for v1; document the gap.)
- Per-project filtering — bake in or skip?

---

## What replaced this phase

**Phase 03 is now Notes** — a Google-Keep / OneNote-flavored notes app with Markdown bodies. See [`../03-notes/`](../03-notes/) for the full scope, plan, UI spec, and verification.
