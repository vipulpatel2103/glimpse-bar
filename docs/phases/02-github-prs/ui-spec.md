# UI Spec — GitHub PRs

> Phase-scoped subset of [`../../ui-design.md`](../../ui-design.md) and the agent-friendly summary at [`../../../design.md`](../../../design.md). Read this for *what to build now* — read those for the *complete vision*. Tokens not redefined here inherit from Phase 00 / 01 and `design.md` §2.

---

## What's in this phase visually

- GitHub PR renderer inside the Glimpse Panel — compact (360 px) and expanded (≈720 px).
- Viewer header strip at the very top: avatar + `@login` + `Change PAT` link.
- Panel header (below viewer strip): title `PR's` + refresh ↻ + `Nm ago` indicator on the left, three-tab segmented control (`Mine` · `Review` · `All`) on the right.
- Date-grouped PR card list (`Mon Apr 20 2026` headers) — same grouping pattern as TODO Upcoming view.
- PR card rows: prominent title with `#NUMBER` prefix, author → reviewer avatar chain (color-coded rings), status pill + round overall-state icon, comment count.
- Row context menu (Open / Copy link / Copy branch / Hide-Unhide).
- Expanded mode adds a 200 px sidebar (Mine / Review / All / Hidden / per-repo).
- Empty / loading / error / rate-limit states.
- Options page section (Connection · Change PAT · Refresh interval · Repos · Status).

All other UI (write actions, repo grouping in compact mode, multi-account selector, OAuth modal) is **not** built in this phase.

---

## 1. Color tokens (additions on top of Phase 00 / 01 / `design.md`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `gb-badge-success`        | `#16a34a` | `#22c55e` | CI success · `Approved` |
| `gb-badge-warning`        | `#d97706` | `#f59e0b` | CI pending · `Changes requested` |
| `gb-badge-error`          | `#dc2626` | `#ef4444` | CI failure · `Conflicts` · failing-checks chip |
| `gb-badge-info`           | `#2563eb` | `#3b82f6` | `Draft` · `Review required` |
| `gb-badge-neutral-bg`     | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.08)` | Default chip background |
| `gb-badge-neutral-fg`     | `#525252` | `#a3a3a3` | Default chip foreground (`text-gb-text-muted`) |
| `gb-rate-limit-bg`        | `rgba(245,158,11,0.10)` | `rgba(245,158,11,0.16)` | Rate-limit chip pill |
| `gb-card-bg`              | `rgba(0,0,0,0.03)` | `rgba(255,255,255,0.04)` | PR card surface (subtle lift over panel) |
| `gb-card-bg-hover`        | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.07)` | PR card hover |
| `gb-day-heading`          | `gb-text` (semibold) | `gb-text` (semibold) | `Mon Apr 20 2026` group header |
| `gb-segmented-bg`         | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.06)` | Tab segmented-control track |
| `gb-segmented-thumb`      | `gb-panel-bg` | `rgba(255,255,255,0.14)` | Active tab pill background |
| `gb-avatar-ring-default`  | `rgba(0,0,0,0.15)` | `rgba(255,255,255,0.18)` | Avatar chip border when no review state |

All other tokens (panel surface, text, focus ring, row hover/active, dividers) inherit unchanged from Phase 01.

---

## 2. Typography (additions)

| Element | Family | Size | Weight | Line height | Color token |
|---|---|---|---|---|---|
| Viewer header `@login`     | system-ui | 13px | 600 | 1   | `gb-text` |
| Panel-header title `PR's`  | system-ui | 16px | 700 | 1   | `gb-text` |
| Tab label                  | system-ui | 12px | 600 | 1   | active `gb-text` / inactive `gb-text-muted` |
| Day-group heading          | system-ui | 12px | 600 | 1.2 | `gb-day-heading` |
| PR number `#1234` prefix   | system-ui | 11px | 500 | 1   | `gb-text-muted` (`tabular-nums`) |
| PR title                   | system-ui | 14px | 500 | 1.35 | `gb-text` (truncate) |
| Status pill                | system-ui | 10px | 600 | 1   | per-token (see §1) |
| Avatar initials            | system-ui | 9px  | 600 | 1   | `gb-text` |
| Comment count              | system-ui | 11px | 500 | 1   | `gb-text-muted` (`tabular-nums`) |
| Last-sync ago indicator    | system-ui | 11px | 400 | 1   | `gb-text-muted` (`tabular-nums`) |
| Change-PAT link            | system-ui | 11px | 500 | 1   | `gb-text-muted` → `gb-text` on hover (underline) |
| Empty-state copy           | system-ui | 12px | 400 | 1.5 | `gb-text-muted` |

---

## 3. Layout — Compact (360 px)

```
┌──────────────────────────────────────────────┐
│ (○) @octocat                  Change PAT  ⤡  │  ← PrViewerHeader (h=40)
├──────────────────────────────────────────────┤
│ PR's  ↻  1m ago         [ Mine | Review |All]│  ← PrHeader (h=44)
├──────────────────────────────────────────────┤
│ Mon Apr 20 2026                              │  ← day heading
│ ┌──────────────────────────────────────────┐ │
│ │ #234  feat: add support for purchases    │ │
│ │ TL ⟩ TA SB DD       [✓ Approved]  ✓  4 💬│ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │ #220  fix(GBAR-120): remove rerenders…   │ │
│ │ DJ ⟩ SB     [● Conflicts][✓ Approved] ⏱ 5💬│
│ └──────────────────────────────────────────┘ │
│                                              │
│ Fri Apr 17 2026                              │
│ ┌──────────────────────────────────────────┐ │
│ │ #198  fix(GBAR-98): hide dev section     │ │
│ │ TL ⟩ TL SB DD              [✎ Draft] ⊝ 0💬│
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Panel width | 360 px (Phase 00 default) |
| Panel height | `calc(100vh − 32px)` (Phase 00 default) |
| Viewer header height | 40 px |
| Panel header height | 44 px |
| Body padding | 8 px horizontal, 4 px top, 8 px bottom |
| Day heading | `mt-3 mb-1`, 12 px 600, sticky `top-0` while scrolling within the body, `gb-panel-bg/95 backdrop-blur` to mask rows behind it |
| Card | `rounded-xl`, `gb-card-bg`, padding 10 px horizontal / 8 px vertical, gap 4 px between cards; hover → `gb-card-bg-hover`; focus-visible → `gb-ring-active` 2 px |
| Card height | ~64 px (two stacked lines) |
| Hover state | kebab fades in top-right of card (100 ms) |

### 3.1 PrViewerHeader (top strip)

- Left: 28 px round avatar (image from `avatar_url`, falls back to initials on load error) + `@login` (13 px 600).
- Right: `Change PAT` link (11 px 500 + Lucide `KeyRound` 12 px); on click opens Options scrolled to GitHub section via `chrome.runtime.sendMessage({type:'openOptionsPage'})` + a hash like `#github` so the section is anchored.
- Hidden when no PAT is connected (replaced by the empty-state CTA in §5).
- Bottom 1 px `gb-divider-soft` separator under this strip.

### 3.2 PrHeader

- Left block (gap 8 px): `PR's` title (16 px 700) + refresh button (Lucide `RefreshCw` 14 px, 24×24 hit-box; spins while syncing) + ago indicator (`1m ago` / `2h ago`).
- Right block: three-tab segmented control (`Mine` · `Review` · `All`) with counts.
  - Track: `gb-segmented-bg`, `rounded-full`, padding 2 px, gap 0.
  - Pills: each `min-w-[64px]`, h=24 px, padding 8 px horizontal, `rounded-full`, 12 px 600.
  - Active pill: `gb-segmented-thumb` background, soft shadow `shadow-[0_1px_2px_rgba(0,0,0,0.12)]`, `gb-text`.
  - Inactive: transparent, `gb-text-muted` → `gb-text` on hover.
  - Active background slides between pills via `framer-motion` `layoutId="pr-tab-thumb"` (180 ms emphasized ease-out; reduced-motion → instant).
- Maximize / minimize button sits at the very right edge (Lucide `Maximize2` / `Minimize2`, 14 px); hidden if `vw < 720`.
- Error chip / rate-limit chip — same as v0 spec: replaces the ago indicator when set; tooltip carries the message.

### 3.3 PR card row anatomy

- Implementation: `<a href={pr.url} target="_blank" rel="noopener" className="group relative block …card styles…">`.
- **Top line** (single row, baseline-aligned):
  - `#NUMBER` (11 px 500 muted, `tabular-nums`) + 4 px gap + **title** (14 px 500, `flex-1 truncate`).
  - Right-anchored kebab (Lucide `MoreHorizontal` 14 px, 24×24, `opacity-0 group-hover:opacity-100`).
- **Bottom line** (single row, items-center):
  - **Left:** author `AvatarChip` (24 px) + `ChevronRight` (12 px, `text-gb-text-muted`) + flex-row of reviewer `AvatarChip`s (gap 4 px, max 3 visible; overflow `+N` chip).
    - When there are zero reviewers, omit the chevron + reviewer cluster.
  - **Right:** status pill (see §3.4) + 24 px round overall-state icon (filled circle in pill color, glyph 12 px white) + comment count (11 px tabular-nums) + Lucide `MessageSquare` (12 px).
- Click anywhere on the card → opens PR URL. The kebab is the only nested interactive element; `e.stopPropagation()` on its click.

### 3.4 Status pill primitive (`PrStatusBadges.tsx`)

- Pill: 20 px high, `rounded-full`, padding 8 px horizontal, gap 4 px, 10 px text 600 weight.
- Background: `${color}/16` (light) or `${color}/24` (dark) for the colored variants; `gb-badge-neutral-bg` for neutral.
- Foreground: matching `gb-badge-{success|warning|error|info}` token; neutral → `gb-badge-neutral-fg`.
- Icon: 10 px Lucide before label, optional.
- A row shows **at most two** pills, in priority order: `Conflicts` (if `mergeState='conflicting'`) > `Changes requested` > `Approved` > `Review required` > `Draft`. Anything past two collapses into a `+N` neutral pill with hover-tooltip listing the omitted statuses.

| Domain → pill mapping | Icon | Color token |
|---|---|---|
| `Approved` (reviewDecision)        | `Check`         | `gb-badge-success` |
| `Changes requested`                | `Pencil`        | `gb-badge-warning` |
| `Review required`                  | `CircleHelp`    | `gb-badge-info` |
| `Conflicts` (mergeState)           | `AlertTriangle` | `gb-badge-error` |
| `Draft` (isDraft)                  | `FileEdit`      | `gb-badge-info` |

### 3.5 Overall-state icon (round)

- 24 px round, filled in pill color, white glyph centered.
- Mapping from `overallState` (derived in `lib/github/selectors.ts`):

| `overallState` | Icon | Color |
|---|---|---|
| `ready`     | `Check`           | `gb-badge-success` |
| `failed`    | `X`               | `gb-badge-error` |
| `blocked`   | `AlertTriangle`   | `gb-badge-warning` |
| `pending`   | `Clock`           | `gb-badge-warning` |
| `neutral`   | `Minus`           | `gb-badge-neutral-fg` |

Hover tooltip: short description (`Ready to merge`, `CI failing`, `Blocked: changes requested`, `Awaiting review / CI`, `No status`).

### 3.6 AvatarChip primitive (`AvatarChip.tsx`)

- Round chip; sizes: 24 px (row), 28 px (viewer header), 16 px (`+N` overflow).
- Renders `<img src={avatarUrl}>` lazy-loaded; on `onError` swap to a `<span>` with **initials** (first two chars of `login`, upper-cased) on a `gb-card-bg` background.
- 2 px outer ring; color from `state` prop:
  - `approved`           → `gb-badge-success`
  - `changes_requested`  → `gb-badge-warning`
  - `dismissed`          → `gb-badge-error`
  - `commented`          → `gb-badge-info`
  - `pending` / undefined → `gb-avatar-ring-default`
- Hover tooltip (HTML `title` attr): `@login` for authors; `@login — approved` etc. for reviewers.
- Implementation note: ring rendered as `box-shadow: 0 0 0 2px <color>` so it never affects layout.

---

## 4. Layout — Expanded (`min(720, vw - 68)` px)

```
┌─────────────┬─────────────────────────────────┐
│ (○) @octocat            Change PAT          ⤢ │   viewer header (full width)
├─────────────┼─────────────────────────────────┤
│ ⇦ Mine    3 │ PR's  ↻ 1m ago  [Mine|Review|All]│ panel header
│ ⇨ Review  5 ├─────────────────────────────────┤
│ ⛓ All     7 │ Mon Apr 20 2026                 │
│ 🚫 Hidden 2 │  … cards …                      │
│ ─────       │                                 │
│ 🔁 org/repo 4│                                 │
│ 🔁 org/api  3│                                 │
└─────────────┴─────────────────────────────────┘
```

| Property | Value |
|---|---|
| Sidebar width | 200 px fixed |
| Sidebar item height | 28 px |
| Sidebar item border-radius | 6 px |
| Sidebar active item | `gb-row-active` + 600 weight |
| Sidebar divider before per-repo list | 1 px `gb-divider-soft`, 8 px vertical margin |
| Per-repo item icon | 12 px Lucide `GitBranch` |
| Width tween | `expanded: 280 ms cubic-bezier(0.32,0.72,0,1)` / `collapse: 200 ms cubic-bezier(0.4,0,1,1)` (same as Phase 01); locked while bar is dragging |

### 4.1 View interaction rules

- Tab selector and sidebar item co-exist:
  - Selecting a system row (`Mine` / `Review` / `All`) sets both `activeTab` and `activeView`.
  - Selecting `Hidden` overrides — the segmented control is visually muted; list shows hidden PRs (sorted by `updatedAt` desc, still date-grouped).
  - Selecting a per-repo row keeps `activeTab` value as a sub-filter (PRs from that repo, intersected with the active tab).

---

## 5. Empty / loading / error states

| State | Icon (32 px, `text-gb-text-muted/50`) | Copy |
|---|---|---|
| No PAT                            | `KeyRound`             | Connect GitHub to see your PRs. **Open settings →** |
| Mine — no PRs                     | `GitPullRequest`       | You haven't opened any PRs. |
| Review — no PRs                   | `Inbox`                | No PRs awaiting your review. |
| All — no PRs                      | `Github`               | No open PRs in your queue. |
| Hidden — no PRs                   | `EyeOff`               | Nothing hidden. |
| Per-repo — no PRs                 | `GitBranch`            | No PRs in this repo. |
| Loading (first sync, no cache)    | spinner (Lucide `Loader2`, animate-spin) | Syncing GitHub… |
| Error                             | `AlertCircle`          | Couldn't sync — `{error}`. **Retry** |
| Rate-limited                      | `Clock`                | Rate-limited — resets in `Nm`. |

---

## 6. Row context menu

```
┌────────────────────────────────┐
│  ↗  Open in GitHub             │
│  ⎘  Copy PR link               │
│  ⎘  Copy branch name           │
│  🚫 Hide PR                    │
└────────────────────────────────┘
```

| Property | Value |
|---|---|
| Width | 200 px |
| Item height | 28 px |
| Item padding | 8 px horizontal |
| Surface | `gb-panel-bg`, 1 px `gb-panel-border`, `rounded-lg`, panel shadow |
| Anchor | At cursor on right-click; below the kebab on click; flips above when overflow at viewport bottom. |
| Animation | 140 ms ease-out fade + 4 px slide. Reduced-motion → instant. |
| Dismissal | `pointerdown` outside via `composedPath` (per CLAUDE.md gotcha). |

---

## 7. Options page — GitHub section

```
GitHub                                             #github (anchor)
─────────────────────────────────────────
(○) @octocat   scopes: repo            [ Change PAT ]   [ Disconnect ]

Refresh every  [ 5 ] minutes

Repositories (auto-discovered)
[x] octocat/hello-world           4 open
[x] octocat/spoon-knife            1 open
[ ] github/docs                    0 open

Last sync: 2026-05-02 18:14 — [ Sync now ]
```

When **not connected** OR after **Change PAT** is clicked, the connection block expands to:

```
Personal Access Token
[ ghp_… new token … ]   [ Test connection ]
(status row: ✓ Connected as @octocat / ✗ Bad credentials / ⚠ Missing scope: repo)
[ Save & sync ]   [ Cancel ]
```

| Property | Value |
|---|---|
| Section heading | matches existing Appearance heading style (16 px 600 + 8 px bottom margin); anchored as `#github` so the panel can deep-link into it |
| Connected row | viewer avatar (28 px) + `@login` + scopes chips; right-aligned `Change PAT` + `Disconnect` |
| Field gap | 12 px between rows; 16 px between sub-sections |
| PAT field | `type="password"`; visible only in connect / change-PAT mode |
| Test button | Disabled until field is non-empty; spinner on button while testing |
| Status row | success → green text + check; failure → red text + ✗; missing scope → amber warning row underneath |
| Save & sync | Persists new PAT (replacing old); kicks `gh:sync`; collapses the form |
| Cancel | Hides the form; PAT field zeroed; old PAT untouched |
| Repo list | Scrollable max-h 240 px; checkbox + `key` + open count |
| Sync now | Debounced 1 s |
| Disconnect | Red secondary button; opens a small confirm dialog |

---

## 8. Animations

| What | Duration | Easing |
|---|---|---|
| Tab switch (active pill background) | 180 ms | `[0.32, 0.72, 0, 1]` |
| Row hover icons reveal | 100 ms | ease-out |
| Refresh icon spin | 600 ms / loop | linear |
| Popover open / close | 180 / 140 ms | open ease-out / close ease-in |
| Panel width tween | 280 / 200 ms | open ease-out / close ease-in |

All durations → 0 when `prefers-reduced-motion: reduce`.

---

## 9. Iconography (additions; library: lucide-react)

| Icon | Where |
|---|---|
| `Github`               | Empty-state All / sidebar header / fallback for unknown |
| `GitPullRequest`       | Empty state Mine, sidebar Mine row |
| `RefreshCw`            | Refresh button (spins while syncing) |
| `Maximize2` / `Minimize2` | Compact ↔ expanded toggle (inherited) |
| `Inbox`                | Empty state Review, sidebar Review row |
| `Layers`               | Sidebar All row |
| `EyeOff` / `Eye`       | Hide/Unhide context-menu items + Hidden view |
| `KeyRound`             | Empty state for "no PAT" + Change-PAT link icon |
| `Clock`                | Rate-limit chip + overall-state pending |
| `AlertCircle`          | Error state |
| `Loader2`              | Loading state (spin) |
| `MessageSquare`        | Comment count |
| `GitBranch`            | Per-repo sidebar items |
| `ChevronRight`         | Author → reviewers separator inside the card |
| `Check` / `X` / `CircleDot` / `Minus` / `Pencil` / `CircleHelp` / `MessageCircle` / `FileEdit` / `AlertTriangle` | Status pills + overall-state icon |
| `MoreHorizontal`       | Row kebab |
| `ExternalLink`         | Optional, on hover at top-right of card |
| `Copy`                 | Copy link / branch context-menu items |

All stroke 2. Header / chip / popover icons 10–16 px per the table above.

---

## 10. Accessibility

- Tabs: `<button role="tab" aria-selected={…}>` inside `<div role="tablist" aria-label="PR queries">`. The animated thumb is purely decorative — `aria-hidden`. Active tab is conveyed by `aria-selected` + visible background, not by color alone.
- Avatar chips: `<img alt="@{login}">` with `title="@{login}"`. Reviewer state communicated via the `title` attr (`@bob — approved`) so screen readers don't rely on the ring color alone.
- Day-group headings: `role="heading" aria-level="3"`.
- Sidebar: `role="navigation" aria-label="PR views"`.
- Row container: `role="list"`. Each row: an `<a>` (so it's keyboard-navigable + middle-click-friendly).
- Context menu: `role="menu"` with `role="menuitem"`s; arrow keys cycle, Enter activates, Esc closes.
- Status chips: convey state via icon + text, not color alone. WCAG-AA contrast ≥ 4.5:1 in both themes.
- Focus ring: 2 px `gb-ring-active`, 1 px offset, only on `:focus-visible`.
- `prefers-reduced-motion: reduce` → all durations zeroed.
- Refresh spinner has `aria-label="Syncing"` while spinning; otherwise `Refresh`.

---

## 11. Reference

- User-supplied screenshot for PR row anatomy.
- Phase 00 [`ui-spec.md`](../00-setup-and-ui-ux/ui-spec.md) for panel / bar primitives.
- Phase 01 [`ui-spec.md`](../01-todo/ui-spec.md) for tab/sidebar/list/popover patterns to mirror.
- Project [`design.md`](../../../design.md) for tokens, motion language, "panel surface always opaque" rule, and the gotchas (composedPath, transformed-ancestor offset).

---

## 12. Acceptance (visual only)

- [ ] Compact panel matches §3 layout on a light page: viewer header strip, panel header with `PR's ↻ Nm ago` on the left and the `Mine|Review|All` segmented control on the right.
- [ ] Tab switching slides the active pill via `layoutId="pr-tab-thumb"` (180 ms); reduced-motion → instant.
- [ ] PR cards match §3.3 anatomy: `#NUMBER` + title on top, author → reviewers chain + status pill + round overall-state icon + comment count on bottom.
- [ ] Reviewer avatar rings use the correct color per review state (green / amber / red / blue / neutral).
- [ ] Day headings are sticky while scrolling and do not shift card layout.
- [ ] Expanded panel matches §4 with sidebar at 200 px (Mine / Review / All / Hidden / per-repo).
- [ ] Status pills + overall-state icons render with correct color tokens in both themes (≥ 4.5:1 contrast).
- [ ] Hover-revealed kebab does not shift card layout.
- [ ] Rate-limit chip renders in amber and counts down in minutes.
- [ ] Empty states show the right icon + copy per §5.
- [ ] Viewer header `Change PAT` link opens the Options page anchored to the GitHub section.
- [ ] Reduced-motion: tab transition, popover open, refresh spinner are all instant / static.
- [ ] No `console.error` from the GitHub renderer in DevTools.
