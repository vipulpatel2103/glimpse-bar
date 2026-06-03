# Phases

Each phase has its own folder with scope, plan, UI spec, and verification. Numeric prefixes are for ordering only — phase names are descriptive.

| Folder | Status | Goal |
|---|---|---|
| [`00-setup-and-ui-ux/`](00-setup-and-ui-ux/) | Shipped | Bar + Panel + Option Page foundation. No real apps. Clicking a non-Settings icon opens an empty Glimpse Panel. |
| [`01-todo/`](01-todo/) | Shipped | Local TODO list as the first real app. Compact + expanded modes, views, dates, subtasks, custom lists, right-click capture, badge counter. |
| [`02-github-prs/`](02-github-prs/) | Shipped (2026-05-04) | GitHub PR review queue. PAT auth, viewer header + three tabs (`Mine` / `Review` / `All`), date-grouped cards with author→reviewer avatar chains, per-repo toggle, hide PR, background sync via `chrome.alarms`. |
| [`02.1-bitbucket-prs/`](02.1-bitbucket-prs/) | Active — fully planned (2026-05-06) | Bitbucket Cloud PR review queue. `Workspace + Username + Token` auth, REST 2.0, opt-in workspaces, same UX as Phase 02. No GraphQL, no `Conflicts` pill in v0, no new permissions. |
| [`02.2-shared-pr-renderer/`](02.2-shared-pr-renderer/) | Active — design locked (2026-05-06) | Refactor: collapse GitHub + Bitbucket PR UIs into one shared visual layer driven by a `ProviderAdapter`. Sets up GitLab + Azure DevOps to ship as ~200-LOC adapters each. Pure refactor; no user-facing features. |
| [`03-notes/`](03-notes/) | Active — fully planned (2026-06-03) | Notes app. Google-Keep-flavored cards with Markdown body, checklist mode, color tints, labels, full-text search, right-click capture, and a bar Shift-click quick-compose popover. 100-note × 10 KB caps; no images; lazy-loaded `marked` + `dompurify`. |
| [`03-jira/`](03-jira/) | Deferred (2026-06-03) | Jira assigned-to-me issues. Superseded by `03-notes/`; parked until an OAuth story exists. |

> Working agreement: don't fully plan phase N+1 until phase N has shipped. Stubs hold rough notes only.

See [`../roadmap.md`](../roadmap.md) for parking-lot ideas beyond the four planned phases.
