# Scope — GitHub PRs

## In scope

### Auth + connection
- PAT-based auth only. User pastes a Personal Access Token in the Glimpse Option Page; SW fetches `/user` to resolve `login` + `avatar_url` + scopes; surfaces `✓ Connected as @login` or `✗ {error}`.
- Required scopes: `repo` (private repos) or `public_repo` (public-only). Missing-scope warning.
- "Save & sync", **"Change PAT"**, "Disconnect" buttons.
  - `Change PAT` reveals the PAT field again (it was masked after save), pre-filled blank, lets the user paste a new one and re-test before committing. Old PAT not exposed.
  - `Disconnect` clears PAT + cached PRs + repos + hidden set.
- PAT stored in `sync:` storage namespace (survives profile reinstalls). Never logged, never echoed back to UI; masked after save (`ghp_••••…1234`).

### Viewer header strip (panel top)
- Above the tab row, a single row showing: viewer's avatar (28 px, round) + `@login` (13 px 600) + a small `Change PAT` link / icon button on the right that opens Options scrolled to the GitHub section.
- Hidden when no PAT is connected (replaced by the "Connect GitHub" empty state).

### Views (panel header)
- Three tabs in a segmented pill control top-right of the panel header (per screenshot):
  - `Mine` — `is:open is:pr author:@me`
  - `Review` — `is:open is:pr review-requested:@me`
  - `All` — union of both, deduped on PR id (default tab; matches user expectation that "All" is the unified queue).
  
  Note: "Default = `Review`" was the v0 plan; per screenshot `Review` is highlighted as the example active tab. Final default = `Review` (most actionable surface for the user).
- Each tab shows its count.
- Header left side: title `PR's` + refresh button (↻) + last-sync ago text (`1m ago`).
- Header right side: the three-tab segmented control.
- Header also surfaces: error chip / rate-limit chip when applicable.

### Date grouping
- Rows grouped under sticky day headers (`Mon Apr 20 2026`-style) keyed by `dayKey(updatedAt)`. Same pattern as TODO's Upcoming view.
- Within each day group, rows sorted by `updatedAt` desc.
- Day header reuses Phase 01 `lib/todos/dates.ts` `dayKey()` helper but with full `EEE MMM dd yyyy` formatting (new helper `formatDayHeading(ts)` in `lib/github/format.ts`).

### PR card row anatomy
- Implementation: a single `<a href={pr.url} target="_blank" rel="noopener">` styled as a card; rounded, padded, `gb-row-hover` on hover.
- Top line: `#NUMBER` (small, muted, `tabular-nums`) directly followed by **title** (15 px 500, `gb-text`, truncate). PR number stays compact so the title stays prominent (per screenshot).
- Bottom line:
  - Left: author avatar chip → `ChevronRight` (12 px) → up to 3 reviewer avatar chips; `+N` overflow chip when more.
  - Right: status pill + round overall-state icon (24 px circle, color of pill).
  - Far right of bottom line: comment count (`tabular-nums`) + `MessageSquare` icon (12 px).
- Hover tooltip on each avatar: `@login` (and review state for reviewers).
- Click anywhere on the card → opens PR URL. Kebab (top-right corner of card) reveals on hover for the context menu.

### Avatar chip
- Round chip, 24 px diameter on the row (28 px on the viewer header).
- Source: `avatar_url` from GitHub API; falls back to initials (first 2 letters of `login` upper-cased) on load failure.
- Outer ring (2 px, inset shadow): color-coded for reviewers per latest review state:
  - **`approved`**     → `gb-badge-success`
  - **`changes_requested`** → `gb-badge-warning`
  - **`dismissed`**    → `gb-badge-error`
  - **`commented`**    → `gb-badge-info`
  - **`pending`** / no review → no ring (default neutral border)
- Author chip: no ring (neutral).

### Status semantics

| Domain | Values | Source |
|---|---|---|
| `state`           | `open` / `closed` / `merged` | PR JSON |
| `isDraft`         | `true` if `draft: true` | PR JSON |
| `reviewDecision`  | `approved` / `changes_requested` / `review_required` / `commented` / `none` | derived from `/reviews` (latest per reviewer) |
| `ciState`         | `success` / `failure` / `pending` / `neutral` / `none` | rollup of `/check-runs` for `head_sha` |
| `mergeState`      | `clean` / `conflicting` / `behind` / `blocked` / `unknown` | from PR JSON `mergeable_state` |
| `failingChecks`   | int                          | count of conclusions in (failure, timed_out, cancelled, action_required) |
| `totalChecks`     | int                          | length of check-runs array |
| `overallState`    | `ready` / `pending` / `blocked` / `failed` / `neutral` | derived for the row's right-side state icon: `ready` = `approved` + CI success + clean; `failed` = CI failure or dismissed; `blocked` = changes_requested or conflicting; `pending` = CI pending or review_required; else `neutral`. |
| `reviewers`       | `Reviewer[]` `{login, avatarUrl, state}` | from `/reviews`: latest review per reviewer; `state` mapped to `approved` / `changes_requested` / `commented` / `dismissed` / `pending` |

### Repo scope
- Repos are auto-discovered from PR query results (no explicit add).
- Each repo has `enabled: true | false` toggle in Options. Default for newly-discovered repos: enabled.
- Filtering happens client-side at render time — disabled repos still get fetched (acceptable: query is `author:@me` / `review-requested:@me`, not per-repo).
- Disconnect clears the repo list.

### Hide PR
- Permanent until unhidden. Stored as `PrId[]`.
- Sidebar (expanded mode) gets a `Hidden` system view listing all hidden PRs.
- `Unhide` action available in the Hidden view's row context menu.

### Refresh + sync
- Background SW owns all API calls. Content/options scripts use `chrome.runtime.sendMessage`.
- **Transport: GitHub GraphQL v4 API** (`https://api.github.com/graphql`). One POST per sync returns viewer + both queues (mine + review) + reviewers + CI rollup + mergeable state. Replaces ~3N+1 REST round-trips with a single request, includes fields REST doesn't expose (`reviewDecision`, `statusCheckRollup`, `mergeable`).
- Auto-refresh via `chrome.alarms` named `gh-sync`. Configurable interval (1 / 5 / 15 / 30 / 60 min), default 5.
- Manual refresh from panel header button. Disabled while syncing.
- Cache-first render: panel reads `githubPrsItem` immediately; sync happens async; UI updates via `storage.watch`.
- On error: `lastSyncError` persisted; cached PRs not clobbered.
- Rate-limit detection: GraphQL responses always 200; check `data.rateLimit.remaining === 0` or `errors[].type === 'RATE_LIMITED'`. Compute reset from `data.rateLimit.resetAt`. Throw typed `RateLimitError`. Header shows `Rate-limited · resets in Nm`. No auto-retry storm.
- `mergeable: UNKNOWN` handling: GitHub computes mergeability lazily after pushes; first read can return `UNKNOWN`. After each sync, schedule a single targeted re-fetch of just those PRs by `id` after ~8 s; patch only the `mergeState` field. No full re-sync.

### Context menu (per PR row)
- `Open in GitHub` (default action; same as click)
- `Copy PR link` (writes `pr.url` to clipboard)
- `Copy branch name` (writes `pr.headRef` to clipboard)
- `Hide PR` (or `Unhide PR` in Hidden view)

### Permissions added this phase
- `alarms` — for `chrome.alarms.create('gh-sync', …)`. Rationale logged in roadmap decision log.
- `host_permissions` for `https://api.github.com/*` not strictly needed because Phase 00 already declared `<all_urls>` for content-script injection; the SW therefore has fetch access. We do **not** narrow `<all_urls>` in this phase.

### Storage items (this phase, declared in `lib/storage.ts`)

| Item | Type | Storage key | Fallback |
|---|---|---|---|
| `githubAuthItem`   | `GitHubAuthState` | `sync:gb-github-auth`   | `{}` |
| `githubPrsItem`    | `PullRequest[]`   | `local:gb-github-prs`   | `[]` |
| `githubReposItem`  | `RepoMeta[]`      | `local:gb-github-repos` | `[]` |
| `githubHiddenItem` | `PrId[]`          | `local:gb-github-hidden`| `[]` |
| `githubUiItem`     | `GitHubUiState`   | `local:gb-github-ui`    | `{ activeTab:'review', expanded:false, pinned:false, sidebarCollapsed:false, activeView:'review', refreshIntervalMin:5 }` |

Existing items untouched.

### App registry change
- `lib/apps/registry.ts`: GitHub app's `Renderer` swapped from the placeholder to the real `<PrApp />`. `enabled: true`.
- Jira app stays disabled (`enabled: false`) per CLAUDE.md "Stay strictly within the active phase scope".

### Cross-browser
- Chrome + Edge prod builds verified by full smoke (`verification.md`).
- Firefox is a stretch goal — verify it builds and the smoke (5 min) passes.

---

## Out of scope (deferred or rejected)

| Item | Where it lands | Why deferred |
|---|---|---|
| Approve / Request changes / Comment / Merge from panel | Future phase | Write actions need explicit confirmation UX, scopes audit, and an undo / safety net. Read-only first. |
| GitHub Issues, Discussions, Actions | Future phase | Adds new query shapes + UI surfaces. PRs alone justify Phase 02. |
| Multi-account | Future phase | Single `GitHubAuthState` this phase. Multi-account needs an account selector + per-account caches. |
| OAuth (GitHub Apps / device flow) | Future phase | PAT covers personal use. OAuth adds a redirect URI + secret rotation story. |
| Bitbucket / GitLab / Azure DevOps | Future phase(s) | Each is a separate auth + REST shape; would balloon scope. |
| ~~GraphQL API~~ | **Promoted to in-scope (2026-05-02)** | Single-query snapshot is dramatically cheaper (1 request vs ~3N+1) and exposes fields REST doesn't (`reviewDecision`, `statusCheckRollup`, `mergeable`). |
| Toolbar action badge for unreviewed-PR count | Parking lot | Phase 01 owns the badge today (today-incomplete TODO count). Multi-app badge is a cross-cutting decision. |
| Notifications on new review request | Phase 01b cadence (needs `notifications` perm) | Same permission gating as TODO reminders. |
| Drag-to-reorder PRs | Rejected | List is naturally sorted by `updatedAt` desc; user-driven order has unclear value here. |
| Server sync / accounts | Out of project | Local-first. Cache only. |

---

## Why this slice

- PRs are the highest-frequency surface most engineers check daily — high-value first integration after TODO.
- PAT is the lowest-friction auth path that works without a backend; OAuth needs a redirect URL + secret rotation story we don't have. Same reasoning as Jira phase will use API tokens first.
- Two tabs (Authored + Review requests) cover the two actual workflows: "what am I waiting on" and "what's waiting on me". A single combined list with filter pills was rejected as less discoverable.
- Auto-discovering repos from query results avoids forcing the user to type `owner/repo` upfront and removes a common onboarding-failure mode. Disable-toggle gives explicit pruning when the user wants it.
- Hide-permanent (vs. hide-until-update) matches the user's mental model better: "I've decided I don't care about this PR."
- Background-SW-owned fetch keeps the PAT off the host page and removes CORS as a worry. The panel never touches `api.github.com` directly.
- GraphQL chosen as the transport so a full sync is one POST instead of ~3N+1 REST calls. The single-query design also lets us surface `reviewDecision`, `statusCheckRollup`, and `mergeable` natively — no manual rollup logic to maintain.
- Rate-limit visibility (header chip) is non-negotiable: silent rate-limiting is the worst kind of failure mode in a sync app.
