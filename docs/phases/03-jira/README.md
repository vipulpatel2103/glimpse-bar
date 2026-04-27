# Jira

> **Phase folder:** `docs/phases/03-jira/`
> **Status:** Stub — not yet planned
> **Plan when:** the **GitHub PRs** phase ([`../02-github-prs/`](../02-github-prs/)) is shipped and we've learned from it.

---

## One-line goal

Show issues assigned to the current user inside the Jira Glimpse Panel.

---

## Likely scope (subject to planning)

- Jira issues panel renderer.
- Auth: Atlassian API token first (host + email + token in Options). OAuth (3LO) deferred.
- Connections section in Glimpse Option Page: Jira host, email, API token, "Test connection".
- Background service worker fetches Jira REST `/rest/api/3/search?jql=assignee=currentUser() AND statusCategory != Done ORDER BY updated DESC`.
- Refresh button + auto-refresh via `chrome.alarms`.
- Issue rendering: key (e.g., GAR-2141), summary, status pill, priority icon, click-through opens the Jira issue in a new tab.
- Cache last response.

## Out of scope (explicit, this phase)

- Editing issues, transitioning status, posting comments.
- Multiple Jira tenants per user (parking-lot for v3).
- Boards, sprints, releases.
- OAuth (3LO).

## Open questions to settle before planning

- Single global JQL vs. user-configurable JQL field in Options? (Likely: ship a sensible default, allow override via "Advanced" expandable.)
- Server (DC) Jira support, or Cloud only? (Likely: Cloud only for v1; document the gap.)
- Per-project filtering — bake in or skip?

---

## Files this folder will hold (template — to be authored at planning time)

- `README.md` (this file, expanded)
- `scope.md`
- `plan.md`
- `ui-spec.md`
- `verification.md`

---

## Don't plan this yet

Per the project working agreement, we don't fully spec a phase until the previous phase has shipped. Notes here are intentionally rough.
