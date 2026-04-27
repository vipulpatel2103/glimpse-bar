# GitHub PRs

> **Phase folder:** `docs/phases/02-github-prs/`
> **Status:** Stub — not yet planned
> **Plan when:** the **TODO** phase ([`../01-todo/`](../01-todo/)) is shipped and we've learned from it.

---

## One-line goal

Show the user's GitHub PR review queue inside the GitHub Glimpse Panel.

---

## Likely scope (subject to planning)

- GitHub PR panel renderer.
- Auth: Personal Access Token first (paste-into-options). OAuth deferred to a later phase.
- Connections section in Glimpse Option Page: GitHub PAT input, "Test connection" button, "Disconnect".
- Background service worker: `entrypoints/background.ts` (`defineBackground`) gains a fetch pipeline talking to the GitHub REST API. Content scripts call it via `browser.runtime.sendMessage` (or a typed wrapper using `@webext-core/messaging`). Reason: avoid CORS, centralise secret handling.
- Refresh button on Glimpse Panel header (manual re-fetch).
- Auto-refresh via `chrome.alarms` at a configurable interval (default 5 min).
- Cache last successful response so the panel renders something while offline / awaiting refresh.
- New permissions to add: none beyond `host_permissions` for `https://api.github.com/*` (or move all fetches through the SW which already has full host access via `<all_urls>`).
- Rate-limit handling: respect `X-RateLimit-Remaining`, back off gracefully.

## Out of scope (explicit, this phase)

- Authoring / approving / commenting on PRs from the panel.
- GitHub Issues, Discussions, Actions.
- Multi-account.
- OAuth (deferred until both Jira + GitHub are stable on PAT).

## Open questions to settle before planning

- Which PR queries do we ship: "review-requested:@me", "author:@me", or both with a tabbed UI?
- How prominent is repo grouping vs. a flat list?
- What does the icon badge show when there are unreviewed PRs (count? dot?) — only relevant if we add a toolbar badge later.

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
