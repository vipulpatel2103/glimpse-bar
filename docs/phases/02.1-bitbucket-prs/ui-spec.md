# UI Spec — Bitbucket PRs

> Phase-scoped subset of [`../../ui-design.md`](../../ui-design.md), [`../../../design.md`](../../../design.md), and (most importantly) [`../02-github-prs/ui-spec.md`](../02-github-prs/ui-spec.md). **Phase 02.1 is a 1:1 visual reuse of Phase 02** — read the GitHub PR ui-spec first; this file only documents what's *different* for Bitbucket.

---

## What's in this phase visually

- Bitbucket PR renderer inside the Glimpse Panel — compact (360 px) and expanded (≈720 px). Identical chrome, typography, motion, color tokens, and primitives as the GitHub renderer.
- Viewer header strip: avatar + `@nickname` + `Change credentials` link.
- Panel header: title `PR's` + refresh ↻ + `Nm ago` indicator on the left, three-tab segmented control (`Mine` · `Review` · `All`) on the right.
- Date-grouped PR card list (`Mon Apr 20 2026` headers).
- PR card rows: prominent title with `#ID` prefix, author → reviewer avatar chain, status pill + round overall-state icon, comment count.
- Row context menu (Open / Copy link / Copy branch / Hide-Unhide).
- Expanded mode adds a 200 px sidebar (Mine / Review / All / Hidden / per-workspace → per-repo).
- Empty / loading / error / rate-limit states.
- Options page section (Connection · Workspace + Username + Token · Workspaces opt-in · Repos · Refresh interval · Status).

---

## 1. Color tokens

**No new tokens.** All tokens reused unchanged from Phase 02 (`gb-badge-success` / `-warning` / `-error` / `-info`, `gb-card-bg`, `gb-segmented-bg` / `-thumb`, `gb-rate-limit-bg`, `gb-avatar-ring-default`, etc.). See [`../02-github-prs/ui-spec.md`](../02-github-prs/ui-spec.md) §1.

---

## 2. Typography

**No additions.** Reuse Phase 02 §2 exactly. The only label changes:
- `Change PAT` → **`Change credentials`** (same style — 11 px 500, `gb-text-muted` → `gb-text` underline on hover; icon `KeyRound` → `KeyRound`, unchanged).
- `Connect GitHub to see your PRs.` → **`Connect Bitbucket to see your PRs.`**

---

## 3. Layout — Compact (360 px)

```
┌──────────────────────────────────────────────┐
│ (○) @vipul          Change credentials  ⤡    │  ← BbViewerHeader (h=40)
├──────────────────────────────────────────────┤
│ PR's  ↻  1m ago         [ Mine | Review |All]│  ← BbHeader (h=44)
├──────────────────────────────────────────────┤
│ Mon Apr 20 2026                              │
│ ┌──────────────────────────────────────────┐ │
│ │ #234  feat: add support for purchases    │ │
│ │ acme/web · feat-x → main                 │ │
│ │ TL ⟩ TA SB DD       [✓ Approved]  ✓  4 💬│ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │ #220  fix: remove rerenders…             │ │
│ │ acme/web · fix-y → develop               │ │
│ │ DJ ⟩ SB              [✎ Draft]  ⊝   5 💬 │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Panel width | 360 px (Phase 00 default) — same as GitHub |
| Viewer header height | 40 px |
| Panel header height | 44 px |
| Body padding | 8 px horizontal, 4 px top, 8 px bottom |
| Day heading | sticky, same as GitHub |
| Card | identical surface, hover, focus ring as GitHub |
| Card height | ~78 px (three stacked lines — top + meta + bottom; meta line same as GitHub Phase 02) |

### 3.1 BbViewerHeader

Identical to `PrViewerHeader` except:
- `Change PAT` link copy → **`Change credentials`**.
- `Change credentials` click sends `chrome.runtime.sendMessage({type:'openOptionsPage', hash:'bitbucket'})`.
- Hidden when no creds; replaced by the empty-state CTA in §5.

### 3.2 BbHeader

Identical to `PrHeader` except:
- Animated thumb `layoutId="bb-tab-thumb"` (separate from the GitHub `pr-tab-thumb` — they shouldn't share a layout id since both renderers can be open in different sessions).
- Refresh icon dispatches `bb:sync` (not `gh:sync`).

### 3.3 PR card row anatomy

Identical to Phase 02 §3.3, with these differences:
- `#NUMBER` prefix → `#ID` (Bitbucket's numeric `id`, not `databaseId` which doesn't exist in their schema). Same `tabular-nums` styling.
- Meta line copy: `workspace/repo · head → base` (workspace/repo is a single token — the slash is part of the repo key, not a separator).
- **No `Conflicts` pill** ever rendered (see §3.4).
- Reviewer ring colors: green / amber / blue / neutral. Red ring (`dismissed`) is unused — Bitbucket has no equivalent state.

### 3.4 Status pill primitive

Reuses the GitHub `PrStatusBadges` primitive (or a thin Bitbucket wrapper). **`Conflicts` is removed from the priority order in v0.** Final order:

1. `Changes requested` (when `reviewDecision === 'changes_requested'`)
2. `Approved` (when `reviewDecision === 'approved'`)
3. `Review required` (when `reviewDecision === 'review_required'`)
4. `Draft` (when `isDraft === true`)

Anything past two collapses into a `+N` neutral pill.

| Domain → pill mapping | Icon | Color token |
|---|---|---|
| `Approved`           | `Check`         | `gb-badge-success` |
| `Changes requested`  | `Pencil`        | `gb-badge-warning` |
| `Review required`    | `CircleHelp`    | `gb-badge-info` |
| `Draft` (isDraft)    | `FileEdit`      | `gb-badge-info` |

### 3.5 Overall-state icon

Same primitive as GitHub. Mapping reduced (no `blocked`):

| `overallState` | Icon | Color |
|---|---|---|
| `ready`     | `Check`           | `gb-badge-success` |
| `failed`    | `X`               | `gb-badge-error` |
| `pending`   | `Clock`           | `gb-badge-warning` |
| `neutral`   | `Minus`           | `gb-badge-neutral-fg` |

Hover tooltip: `Ready to merge`, `CI failing`, `Awaiting review / CI`, `No status`.

### 3.6 AvatarChip primitive

Reuses GitHub's. Source for Bitbucket: `links.avatar.href` from user objects. Initials fallback uses `nickname` (preferred) or `display_name` first 2 chars upper-cased.

---

## 4. Layout — Expanded (`min(720, vw - 68)` px)

```
┌──────────────┬────────────────────────────────┐
│ (○) @vipul          Change credentials      ⤢ │   viewer header (full width)
├──────────────┼────────────────────────────────┤
│ ⇦ Mine     3 │ PR's  ↻ 1m ago [Mine|Rev.|All] │ panel header
│ ⇨ Review   5 ├────────────────────────────────┤
│ ⛓ All      7 │ Mon Apr 20 2026                │
│ 🚫 Hidden  2 │  … cards …                     │
│ ─────        │                                │
│ ⌄ acme-corp  │                                │  ← workspace heading (collapsible)
│   🔁 acme/web 4│                              │
│   🔁 acme/api 3│                              │
│ ⌃ partner-co │                                │
└──────────────┴────────────────────────────────┘
```

| Property | Value |
|---|---|
| Sidebar width | 200 px fixed |
| Sidebar item height | 28 px |
| Sidebar item border-radius | 6 px |
| Sidebar active item | `gb-row-active` + 600 weight |
| Sidebar divider before per-workspace list | 1 px `gb-divider-soft`, 8 px vertical margin |
| Workspace heading | 12 px 600, `gb-text`, click toggles `expanded` state, `ChevronDown` / `ChevronRight` glyph |
| Per-repo item icon | 12 px Lucide `GitBranch` |
| Per-repo item indent | 12 px (under workspace heading) |
| Width tween | identical to Phase 02 — 280 ms open / 200 ms close |

### 4.1 View interaction rules

Mirrors GitHub:
- Selecting `Mine` / `Review` / `All` sets both `activeTab` and `activeView`.
- Selecting `Hidden` overrides — segmented control visually muted; list shows hidden PRs.
- Selecting a per-repo row keeps `activeTab` as a sub-filter (intersection).
- Workspace heading click toggles its expanded state (persisted in `bitbucketUiItem.sidebarExpandedWorkspaces`); does **not** change `activeView`.

---

## 5. Empty / loading / error states

| State | Icon (32 px, `text-gb-text-muted/50`) | Copy |
|---|---|---|
| No credentials                    | `KeyRound`         | Connect Bitbucket to see your PRs. **Open settings →** |
| No workspaces enabled             | `Building2`        | Enable a workspace in Options to start syncing. **Open settings →** |
| Mine — no PRs                     | `GitPullRequest`   | You haven't opened any PRs. |
| Review — no PRs                   | `Inbox`            | No PRs awaiting your review. |
| All — no PRs                      | `<bb.png at 32px>` | No open PRs in your queue. |
| Hidden — no PRs                   | `EyeOff`           | Nothing hidden. |
| Per-repo — no PRs                 | `GitBranch`        | No PRs in this repo. |
| Loading (first sync, no cache)    | spinner (`Loader2`, animate-spin) | Syncing Bitbucket… |
| Error                             | `AlertCircle`      | Couldn't sync — `{error}`. **Retry** |
| Rate-limited                      | `Clock`            | Rate-limited — resets in `Nm`. |

Note: the `All` empty-state icon uses `assets/bb.png` rendered at 32 × 32 with `opacity: 0.5` (matches the `text-gb-text-muted/50` treatment). All other icons are Lucide.

---

## 6. Row context menu

Same as GitHub's, with the first item label changed:

```
┌────────────────────────────────┐
│  ↗  Open in Bitbucket          │
│  ⎘  Copy PR link               │
│  ⎘  Copy branch name           │
│  🚫 Hide PR                    │
└────────────────────────────────┘
```

Width / item height / surface / anchor / animation / dismissal — identical to Phase 02 §6.

---

## 7. Options page — Bitbucket section

```
Bitbucket                                          #bitbucket (anchor)
─────────────────────────────────────────────
(○) @vipul   workspace: acme-corp                  [ Change credentials ]   [ Disconnect ]

Refresh every  [ 5 ] minutes
⚠ Heavy: ~Nrk req/hr · consider longer interval         (only if projected > 800 req/hr)

Workspaces (auto-discovered — opt in to start syncing)
[ ] acme-corp           42 repos · 8 open PRs
[x] partner-co          12 repos · 3 open PRs
    ⌄ partner-co/web                  2 open
    ⌄ partner-co/api                  1 open
    ☐ partner-co/legacy               0 open

Last sync: 2026-05-06 18:14 — [ Sync now ]
```

When **not connected** OR after **Change credentials** is clicked, the connection block expands to:

```
Workspace
[ acme-corp                                  ]
Username
[ vipul                                      ]
Token  ⓘ App Password or Workspace Access Token
[ ●●●●●●●●●●●●  new token  ●●●●●●●●●●●●     ]   [ Test connection ]
(status row: ✓ Connected as @vipul / ✗ Bad credentials / ⚠ Token missing scope: pullrequest)
[ Save & sync ]   [ Cancel ]
```

| Property | Value |
|---|---|
| Section heading | matches existing `GitHub` section heading style; anchored as `#bitbucket` |
| Connected row | viewer avatar (28 px) + `@nickname` + workspace chip; right-aligned `Change credentials` + `Disconnect` |
| Field gap | 12 px between rows; 16 px between sub-sections (matches GitHub section) |
| Token field | `type="password"`; visible only in connect / change-credentials mode |
| Token helper | small ⓘ tooltip: `App Password or Workspace Access Token. We send Authorization: Basic base64(username:token).` |
| Test button | Disabled until all three fields non-empty; spinner while testing |
| Status row | success → green text + check; failure → red text + ✗; missing scope → amber warning row underneath |
| Save & sync | Persists new credentials (replacing old); kicks `bb:sync`; collapses the form |
| Cancel | Hides the form; Token field zeroed; old credentials untouched |
| Workspace list | Scrollable max-h 320 px; checkbox + slug + summary; toggling ON triggers a one-time repo enumeration |
| Repo list (per workspace) | Indented 16 px; checkbox + repo key + open-PR count; only visible when its workspace is enabled |
| Sync now | Debounced 1 s |
| Disconnect | Red secondary button; opens a small confirm dialog |
| Heavy-budget warning | Amber pill row beneath interval select; only when projected (intervalsPerHour × enabledRepos) > 800 |

---

## 8. Animations

Identical to Phase 02 §8. The only new animated id is `layoutId="bb-tab-thumb"` for the Bitbucket segmented control (separate from the GitHub one). All durations → 0 when `prefers-reduced-motion: reduce`.

---

## 9. Iconography

Reuses the GitHub icon set, with these additions:

| Icon | Where |
|---|---|
| `<img src="/bb.png" />` | Bar tile (`AppIconButton`) + `All` empty-state at 32 px (50% opacity) |
| `Building2`            | "No workspaces enabled" empty state + workspace heading prefix in sidebar |
| `ChevronDown` / `ChevronRight` | Workspace heading expand/collapse glyph |

Everything else (`RefreshCw`, `Maximize2`, `Inbox`, `EyeOff`, `Eye`, `KeyRound`, `Clock`, `AlertCircle`, `Loader2`, `MessageSquare`, `GitBranch`, `ChevronRight`, `Check`, `X`, `Minus`, `Pencil`, `CircleHelp`, `FileEdit`, `MoreHorizontal`, `ExternalLink`, `Copy`) — unchanged.

---

## 10. Accessibility

Mirrors Phase 02 §10. Specific to this phase:
- Bar tile `<img>` for `bb.png` carries `alt="Bitbucket PRs"` (matches the app `name`).
- Workspace heading in the sidebar is a `<button aria-expanded={…}>` with the chevron glyph as `aria-hidden`. Per-repo items inside are conditionally rendered when expanded, so screen readers announce a normal expandable section.
- All other roles, focus-visible rings, color-not-the-only-cue rules are inherited unchanged.

---

## 11. Reference

- [`../02-github-prs/ui-spec.md`](../02-github-prs/ui-spec.md) — primary reference. Phase 02.1 reuses ~95% of its visual surface.
- Phase 00 [`ui-spec.md`](../00-setup-and-ui-ux/ui-spec.md) for panel / bar primitives.
- Phase 01 [`ui-spec.md`](../01-todo/ui-spec.md) for tab/sidebar/list/popover patterns.
- Project [`design.md`](../../../design.md) for tokens, motion language, "panel surface always opaque" rule, and the gotchas (composedPath, transformed-ancestor offset).
- `assets/bb.png` — Bitbucket brand mark used as the bar icon. Sized 18 × 18 in the bar; 32 × 32 (50% opacity) in the `All` empty state.

---

## 12. Acceptance (visual only)

- [ ] Compact panel matches §3 layout: viewer header strip, panel header with `PR's ↻ Nm ago` on the left and the `Mine|Review|All` segmented control on the right.
- [ ] Tab switching slides the active pill via `layoutId="bb-tab-thumb"` (180 ms); reduced-motion → instant.
- [ ] PR cards match §3.3 anatomy: `#ID` + title on top, meta line in middle, author → reviewers chain + status pill + round overall-state icon + comment count on bottom.
- [ ] Reviewer avatar rings use the correct color per review state (green / amber / blue / neutral). Red ring never appears.
- [ ] No `Conflicts` pill is ever rendered.
- [ ] Day headings sticky while scrolling; no card layout shift.
- [ ] Expanded panel matches §4 with sidebar at 200 px; per-workspace headings collapsible; per-repo rows indented.
- [ ] Status pills + overall-state icons render with correct color tokens in both themes (≥ 4.5:1 contrast).
- [ ] Hover-revealed kebab does not shift card layout.
- [ ] Rate-limit chip renders in amber and counts down in minutes.
- [ ] Empty states show the right icon + copy per §5; "No workspaces enabled" deep-links to Options.
- [ ] Viewer header `Change credentials` link opens the Options page anchored to the Bitbucket section.
- [ ] Bar icon renders from `assets/bb.png` (raster, 18 × 18) and not a Lucide glyph.
- [ ] Reduced-motion: tab transition, popover open, refresh spinner are all instant / static.
- [ ] No `console.error` from the Bitbucket renderer in DevTools.
