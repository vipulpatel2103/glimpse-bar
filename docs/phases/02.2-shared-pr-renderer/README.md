# Shared PR Renderer

> **Phase folder:** `docs/phases/02.2-shared-pr-renderer/`
> **Status:** Active — design locked (2026-05-06)
> **Framework:** WXT + React 18 + Tailwind v3 + `@wxt-dev/storage` (no new runtime deps)
> **Goal:** collapse the duplicated GitHub + Bitbucket PR-rendering code into a single shared visual layer driven by a `ProviderAdapter` plugin. Sets up Phase 02.3 (GitLab) and 02.4 (Azure DevOps) to be ~200 LOC each instead of ~2 000.

---

## Why this phase exists

Phase 02 (GitHub) and Phase 02.1 (Bitbucket) shipped near-identical UI: viewer header, segmented `Mine | Review | All` tabs, date-grouped PR cards, hide/unhide, expanded sidebar. The Bitbucket implementation duplicated ~90% of GitHub's visual code — about **1 600 lines of near-duplicate**. Adding GitLab and Azure DevOps later would 4× that.

This phase deduplicates the visual layer, replacing ~22 provider-specific component files with ~14 shared ones, and makes the per-provider code shrink to a thin adapter object.

**No new user-facing features. Pure refactor.**

---

## What this phase changes

1. **One canonical `NormalizedPr` type** holds any provider's PR data. Each provider's sync function maps native API → `NormalizedPr` before persisting.
2. **One copy** of every PR visual primitive lives under `entrypoints/glimpse.content/components/pr/`. Provider-specific copies are deleted.
3. **`ProviderAdapter` interface** describes everything the shared `<PrApp>` needs from a provider: brand, storage handles, sync message, segmented-tab `layoutId`, status-pill priority, empty-state copy, sidebar component.
4. **Per-provider sidebars stay distinct** (different hierarchy depths), but compose shared sidebar primitives (`SidebarSystemRow`, `SidebarHierarchyRow`, `SidebarLeafRow`).
5. **Auth flows stay per-provider.** Options-page sections (`GitHubSection`, `BitbucketSection`) are untouched.
6. **Storage cache items bump keys** (`gb-github-prs` → `gb-github-prs-v2` etc.) to force a clean start with the new shape. No migration — pre-public release.

---

## Out of scope (deferred or rejected)

- GitLab adapter — Phase 02.3.
- Azure DevOps adapter — Phase 02.4.
- Auth abstraction — auth forms genuinely differ; one shared form would just bloat the abstraction.
- Cross-provider unified queue (single tab listing PRs from all providers in one place). Future, if user demand surfaces.
- New visual features — refactor only.

---

## Files in this folder

| File | Purpose |
|---|---|
| [`README.md`](README.md) | This page. |
| [`design.md`](design.md) | Full architecture: type system, adapter contract, file layout, sequence diagrams, risks. |
| [`plan.md`](plan.md) | Step-by-step migration order with exit criteria. |
| [`verification.md`](verification.md) | Acceptance criteria — Phase 02 + 02.1 smoke must pass against the shared renderer. |

`scope.md` is intentionally absent for this phase — `design.md` covers what's in / out / why with more depth than a separate scope doc would.

---

## Cross-cutting references

- [`../02-github-prs/`](../02-github-prs/) — what we're refactoring.
- [`../02.1-bitbucket-prs/`](../02.1-bitbucket-prs/) — what we're refactoring.
- [`../../architecture.md`](../../architecture.md) — WXT entrypoints, shadow root UI, storage model.
- [`../../../design.md`](../../../design.md) — agent-friendly visual spec. Read before any UI tweak.
- [`../../roadmap.md`](../../roadmap.md) — phase order + decision log.
