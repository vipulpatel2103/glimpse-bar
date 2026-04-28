# Phases

Each phase has its own folder with scope, plan, UI spec, and verification. Numeric prefixes are for ordering only — phase names are descriptive.

| Folder | Status | Goal |
|---|---|---|
| [`00-setup-and-ui-ux/`](00-setup-and-ui-ux/) | Shipped | Bar + Panel + Option Page foundation. No real apps. Clicking a non-Settings icon opens an empty Glimpse Panel. |
| [`01-todo/`](01-todo/) | **Active — fully planned** | Local TODO list as the first real app. Compact + expanded modes, views, dates, subtasks, custom lists, right-click capture, badge counter. |
| [`02-github-prs/`](02-github-prs/) | Stub | GitHub PR review queue. |
| [`03-jira/`](03-jira/) | Stub | Jira assigned-to-me issues. |

> Working agreement: don't fully plan phase N+1 until phase N has shipped. Stubs hold rough notes only.

See [`../roadmap.md`](../roadmap.md) for parking-lot ideas beyond the four planned phases.
