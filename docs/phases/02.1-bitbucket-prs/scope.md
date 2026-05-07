# Scope — Bitbucket PRs

## In scope

### Auth + connection
- **`Workspace + Email + API Token` auth.** User enters three values in the Glimpse Option Page:
  - `Workspace` — slug of the primary workspace (e.g. `acme-corp`). Used as a sanity check during `Test connection`; sync still walks all enabled workspaces (see Workspace scope below).
  - `Email` — Atlassian account email (e.g. `you@example.com`). This is the basic-auth username slot for the new scoped API tokens. (App Passwords used the Bitbucket username here, but App Passwords are gone — see below.)
  - `API Token` — Atlassian scoped API token created at `id.atlassian.com/manage-profile/security/api-tokens`.
- Sent on every request as `Authorization: Basic base64(email:api_token)`. **Bearer auth is rejected** by Bitbucket Cloud's REST 2.0 — do not switch schemes.
- "Test connection" calls `GET /2.0/user` → resolves `account_id` + `display_name` + `nickname` + `avatar`; surfaces `✓ Connected as @nickname` or `✗ {error}`.
- Required scopes (Bitbucket namespace, NOT the Atlassian-account `read:account`):
  - `read:user:bitbucket` — `/2.0/user` viewer info
  - `read:workspace:bitbucket` — `/2.0/workspaces` workspace listing
  - `read:repository:bitbucket` — repo enumeration
  - `read:pullrequest:bitbucket` — PR queries
- Missing-scope detection: a 403 from any call returns the detail (`error.detail.required` / `granted`) so the missing scope is named. The Test-connection probe specifically warns on missing `read:workspace:bitbucket` since that one breaks workspace discovery silently.
- **Atlassian retired App Passwords on 2025-09-09**; existing App Passwords are disabled on 2026-06-09. We support API tokens only going forward.
- "Save & sync", **"Change credentials"**, "Disconnect" buttons.
  - `Change credentials` reveals the three fields again (Token field starts blank — old token never echoed back), pre-fills `Workspace` and `Username` from storage, lets the user re-test before committing.
  - `Disconnect` clears all credentials + cached PRs + workspaces + repos + hidden set.
- Token stored in `sync:` storage namespace alongside `workspace` and `username`. Never logged, never echoed back to UI; masked after save (`••••…1234` for token; workspace + username displayed normally).
- **Bitbucket Cloud only.** Bitbucket Server / Data Center is on-prem with a different REST shape (`/rest/api/1.0/...`) and different auth — explicitly out of scope, called out in the Options page copy.

### Viewer header strip (panel top)
- Above the tab row, a single row showing: viewer's avatar (28 px, round) + `@nickname` (13 px 600) + a small `Change credentials` link / icon button on the right that opens Options scrolled to the Bitbucket section.
- Hidden when no credentials are connected (replaced by the "Connect Bitbucket" empty state).

### Views (panel header)
- Three tabs in a segmented pill control top-right of the panel header (mirrors GitHub):
  - `Mine` — `state="OPEN" AND author.account_id="{me}"`
  - `Review` — `state="OPEN" AND reviewers.account_id="{me}"`
  - `All` — union of both, deduped on `id` + `repo`
- Default tab: **`Review`** (matches GitHub default).
- Each tab shows its count.
- Header left side: title `PR's` + refresh button (↻) + last-sync ago text (`1m ago`).
- Header right side: the three-tab segmented control.
- Header also surfaces: error chip / rate-limit chip when applicable.

### Date grouping
- Same pattern as Phase 02. Sticky day headings (`Mon Apr 20 2026`-style) keyed by `dayKey(updatedAt)`. Within each group, rows sorted by `updatedAt` desc.
- New helper in `lib/bitbucket/format.ts` reuses `dayKey` from `lib/todos/dates.ts` and adds `formatDayHeading(ts)` (identical to GitHub's; could later move to a shared `lib/dates.ts`, deferred to keep diffs small).

### PR card row anatomy
- Implementation: `<a href={pr.url} target="_blank" rel="noopener">` styled as a card; same dimensions, hover state (`gb-card-bg-hover`), rounded corners, repo color bar (3 px left border) as GitHub.
- Top line: `#ID` (small, muted, `tabular-nums`) directly followed by **title** (15 px 500, `gb-text`, truncate).
- Meta line (between top and bottom): `workspace/repo · head → base` (small, muted, truncated). Identical to GitHub.
- Bottom line:
  - Left: author avatar chip → `ChevronRight` (12 px) → up to 3 reviewer avatar chips; `+N` overflow chip when more.
  - Right: status pill + round overall-state icon (24 px circle, color of pill).
  - Far right of bottom line: comment count (`tabular-nums`) + `MessageSquare` icon (12 px).
- Hover tooltip on each avatar: `@nickname` (and review state for reviewers).
- Click anywhere on the card → opens PR URL. Kebab (top-right corner of card) reveals on hover for the context menu.

### Avatar chip
- Reuses the GitHub primitive. **Phase 02.1 ships no new visual primitives** — same `AvatarChip` component (renamed import from `lib/bitbucket/format` for color helpers, but the chip itself is shared).
- Source: `links.avatar.href` from Bitbucket user objects; falls back to initials (first 2 letters of `nickname` or `display_name`) on load failure.
- Outer ring (2 px, inset shadow): color-coded for reviewers per latest review state:
  - **`approved`** → `gb-badge-success`
  - **`changes_requested`** → `gb-badge-warning` (Bitbucket calls this "needs work")
  - **`commented`** → `gb-badge-info`
  - **`pending`** / no review → no ring (default neutral border)
- Bitbucket has **no** equivalent for `dismissed` — that ring color simply doesn't appear in this phase.
- Author chip: no ring (neutral).

### Status semantics

| Domain | Values | Source |
|---|---|---|
| `state`           | `open` / `merged` / `declined` / `superseded` | PR JSON (filtered to `OPEN` for sync; others surface only in change feed if a PR transitions) |
| `isDraft`         | `true` if `draft: true` | PR JSON `draft` field (Bitbucket added this in 2024) |
| `reviewDecision`  | `approved` / `changes_requested` / `review_required` / `commented` / `none` | derived from `participants[]` array on PR JSON: `approved` if all reviewers `approved`; `changes_requested` if any reviewer `state === "changes_requested"`; `commented` if any reviewer participated but no approval; `review_required` if any reviewer pending; else `none` |
| `ciState`         | `success` / `failure` / `pending` / `neutral` / `none` | rollup of `/pullrequests/{id}/statuses` — Bitbucket Pipelines + 3rd-party check states |
| `mergeState`      | `clean` / `unknown` only — **no `conflicting`/`behind`/`blocked` in v0** | `unknown` until/unless we build a separate dry-run pipeline (deferred) |
| `failingChecks`   | int                          | count of statuses with `state === "FAILED"` or `state === "STOPPED"` |
| `totalChecks`     | int                          | length of statuses array |
| `overallState`    | `ready` / `pending` / `failed` / `neutral` (no `blocked` since `mergeState` can't say so) | `ready` = `approved` + CI success; `failed` = CI failure; `pending` = CI pending or review_required; `changes_requested` collapses to `pending` for the icon (the explicit pill carries the detail); else `neutral` |
| `reviewers`       | `Reviewer[]` `{login, avatarUrl, state}` | from `participants[]` filtered to `role: "REVIEWER"`; `state` mapped to `approved` / `changes_requested` / `commented` / `pending` |

### Workspace + repo scope (this phase's biggest divergence from GitHub)
- **Explicit opt-in.** No workspace or repo is fetched until the user enables it.
  - On first successful `Test connection`, the SW calls `GET /2.0/user/permissions/workspaces` and persists discovered workspaces with `enabled: false`.
  - Empty-state copy in the panel: `Enable a workspace in Options to start syncing your Bitbucket PRs.`
  - Options page lists discovered workspaces with checkboxes. Toggling one ON triggers a one-time enumeration of repos in that workspace (`GET /2.0/repositories/{workspace}?role=member&pagelen=100`, paginated) → repos persisted with `enabled: true` (default-on for newly-discovered repos within enabled workspaces).
- **Mine query** (`GET /2.0/pullrequests/{accountId}?state=OPEN`) returns all authored PRs across the user's account regardless of workspace. We filter client-side to enabled workspaces only.
- **Review query** has no global "review-requested-of-me" endpoint; we iterate enabled (workspace, repo) pairs, calling `GET /2.0/repositories/{ws}/{repo}/pullrequests?q=state="OPEN" AND reviewers.account_id="{me}"`. Concurrency cap = 5; pagination via `pagelen=50`.
- Disconnect clears workspaces + repos + hidden set.

### Hide PR
- Permanent until unhidden. Stored as `BbPrId[]` in `bitbucketHiddenItem`.
- Sidebar (expanded mode) gets a `Hidden` system view listing all hidden PRs.
- `Unhide` action available in the Hidden view's row context menu.

### Refresh + sync
- Background SW owns all API calls. Content/options scripts use `chrome.runtime.sendMessage`.
- **Transport: REST 2.0** (`https://api.bitbucket.org/2.0/...`). No GraphQL — Bitbucket Cloud doesn't offer one. One sync = ~1 + N + M HTTP requests where N = enabled repos with review-requested PRs, M = PRs needing CI rollup. Concurrency cap 5; total ≤ ~30 requests in normal cases.
- Auto-refresh via `chrome.alarms` named `bb-sync`. Configurable interval (1 / 5 / 15 / 30 / 60 min), default 5. Independent of `gh-sync`.
- Manual refresh from panel header button. Disabled while syncing.
- Cache-first render: panel reads `bitbucketPrsItem` immediately; sync happens async; UI updates via `storage.watch`.
- On error: `lastSyncError` persisted; cached PRs not clobbered.
- **Rate-limit detection:** Bitbucket returns HTTP 429 + `X-RateLimit-Remaining: 0` + `X-RateLimit-Reset` (Unix epoch seconds). Throw typed `BitbucketRateLimitError`. Header shows `Rate-limited · resets in Nm`. No auto-retry storm.
- Bitbucket Cloud rate limit: **1000 req/hr per user**. Default cadence (5 min × ~20 enabled repos) = ~240 req/hr — well within budget. Worst case (1 min × 50 enabled repos with CI fetch) = ~3 000 req/hr → flagged in Options (UI displays `Heavy: ~Nrk req/hr` warning when projected hourly request count > 800).

### CI rollup (statuses)
- Bitbucket's PR list response does **not** include CI state inline. We make a secondary `GET /2.0/repositories/{ws}/{repo}/pullrequests/{id}/statuses` per PR surfaced this sync.
- Concurrency cap = 5 across all status calls in a sync.
- We only fetch statuses for PRs whose `updatedAt` advanced since last sync (delta-fetch). On first sync, fetch for all PRs.
- If a status fetch fails, `ciState` defaults to `none`; no full sync abort.

### Context menu (per PR row)
- `Open in Bitbucket` (default action; same as click)
- `Copy PR link` (writes `pr.url` to clipboard)
- `Copy branch name` (writes `pr.headRef` to clipboard)
- `Hide PR` (or `Unhide PR` in Hidden view)

### Permissions added this phase
- **None.** `<all_urls>` host permission already covers `https://api.bitbucket.org/*` (declared in Phase 00 for content-script injection). `alarms` permission already declared in Phase 02.
- No new permission rationale entry needed beyond noting "no new permissions" in the roadmap decision log.

### Storage items (this phase, declared in `lib/storage.ts`)

| Item | Type | Storage key | Fallback |
|---|---|---|---|
| `bitbucketAuthItem`         | `BbAuthState`        | `sync:gb-bb-auth`         | `{}` |
| `bitbucketPrsItem`          | `BbPullRequest[]`    | `local:gb-bb-prs`         | `[]` |
| `bitbucketWorkspacesItem`   | `BbWorkspaceMeta[]`  | `local:gb-bb-workspaces`  | `[]` |
| `bitbucketReposItem`        | `BbRepoMeta[]`       | `local:gb-bb-repos`       | `[]` |
| `bitbucketHiddenItem`       | `BbPrId[]`           | `local:gb-bb-hidden`      | `[]` |
| `bitbucketUiItem`           | `BbUiState`          | `local:gb-bb-ui`          | `{ activeTab:'review', expanded:false, pinned:false, sidebarCollapsed:false, activeView:'review', refreshIntervalMin:5 }` |
| `bitbucketChangesItem`      | `BbChangeEvent[]`    | `local:gb-bb-changes`     | `[]` |
| `bitbucketNotifBaselineItem`| `BbNotifBaseline`    | `local:gb-bb-baseline`    | `{}` |

Existing items untouched.

### App registry change
- `lib/apps/registry.ts`: new `bitbucket` app entry, `enabled: true`, `iconUrl: '/bb.png'` (raster import from `assets/bb.png` via WXT public-asset pattern), `Renderer: BbApp`.
- App ordering in the bar: `TODO → GitHub → Bitbucket → Settings`.
- `AppDefinition` extended with optional `iconUrl?: string`; `AppIconButton` prefers `iconUrl` over `Icon` (Lucide) when set, rendering `<img class="w-[18px] h-[18px]" />`.

### Cross-browser
- Chrome + Edge prod builds verified by full smoke (`verification.md`).
- Firefox is a stretch goal — verify it builds and the smoke (5 min) passes.

---

## Out of scope (deferred or rejected)

| Item | Where it lands | Why deferred |
|---|---|---|
| Approve / Request changes / Comment / Merge from panel | Future phase | Same reasoning as Phase 02 — write actions need a dedicated confirmation UX, scopes audit, and undo. Read-only first. |
| Bitbucket Issues / Pipelines runs / branch restrictions | Future phase | Adds new query shapes + UI surfaces. PRs alone justify Phase 02.1. |
| **Bitbucket Server / Data Center** | Future phase, possibly never | On-prem REST API is incompatible (`/rest/api/1.0/`) and different auth (HTTP Basic with personal access tokens at `/users/{user}/personal-access-tokens`). Each on-prem install also has a unique base URL the user must enter. Justifying it requires real demand. |
| Multi-account | Future phase | Single `BbAuthState` this phase. Multi-account needs an account selector + per-account caches. |
| OAuth | Future phase | Scoped API tokens cover personal use. OAuth adds a redirect URI + secret rotation story. |
| GitLab / Azure DevOps | Future phase(s) | Each is a separate auth + REST shape. |
| Conflict / mergeable detection | Parking lot | Bitbucket's REST 2.0 doesn't expose `mergeable` cheaply on the PR list response; per-PR `/merge?dry_run=true` is heavyweight. We surface `unknown` and rely on `state` only. Revisit if user feedback demands. |
| Toolbar action badge for unreviewed-PR count | Parking lot | Phase 01 owns the badge today (today-incomplete TODO count). Multi-app badge is a cross-cutting decision. |
| Notifications on new review request | Phase 01b cadence (needs `notifications` perm) | Same permission gating as TODO reminders + GitHub change feed. |
| Drag-to-reorder PRs | Rejected | Same reasoning as GitHub: list naturally sorted by `updatedAt` desc; user-driven order has unclear value. |
| Server sync / accounts | Out of project | Local-first. Cache only. |
| Auto-enable all discovered workspaces | Rejected (2026-05-06) | Each enabled workspace adds N repos worth of `pullrequests?q=...` calls per sync; auto-enabling on a user with 30 workspaces would spike rate-limit usage. Explicit opt-in keeps the request budget predictable. |

---

## Why this slice

- **Two providers, one shape.** PRs are the highest-frequency surface most engineers check daily. Many teams use Bitbucket alongside (or instead of) GitHub. Phase 02 already proved the panel UX; Phase 02.1 stamps that UX over a second provider with minimal new design.
- **`Workspace + Email + API Token` is the only practical auth path** post-App-Password sunset. Atlassian scoped API tokens (`id.atlassian.com/manage-profile/security/api-tokens`) use `Authorization: Basic base64(email:api_token)`. Bearer is rejected by Bitbucket Cloud REST 2.0.
- **REST 2.0, not GraphQL.** Bitbucket Cloud has no GraphQL surface. We accept the higher request count (~20–30 per sync) and design the cap (concurrency 5, only enabled repos, only when `updatedAt` changed) to stay well under the 1000/hr per-user budget.
- **Workspaces opt-in.** A user with 30 workspaces shouldn't have all of them syncing by default — both for rate-limit safety and to keep the panel uncluttered. Explicit ticks in Options match the GitHub per-repo toggle pattern.
- **No `Conflicts` pill in v0.** Mergeability detection requires a per-PR dry-run merge that's both expensive and slow. Shipping without it lets us deliver the panel UX now; we can revisit if users ask.
- **Background-SW-owned fetch keeps the token off the host page** and removes CORS as a worry. Same reasoning as GitHub PAT.
- **Rate-limit visibility (header chip) is non-negotiable** — silent rate-limiting is the worst kind of failure mode in a sync app.
- **No new permissions.** `<all_urls>` (Phase 00) and `alarms` (Phase 02) cover everything Phase 02.1 needs.
