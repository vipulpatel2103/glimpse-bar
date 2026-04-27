# Verification — Setup and UI/UX

> Acceptance criteria + manual QA script for the Setup phase. Run all of this before tagging the phase Done.

---

## Acceptance Criteria

### AC — Glimpse Bar
- [ ] Visit `https://example.com` → bar visible at right edge, vertically centered.
- [ ] Drag the grip → bar follows pointer; release on left half → snaps to left edge.
- [ ] Reload page → bar still on left edge at the same Y coordinate.
- [ ] Click anywhere on the bar **outside** the grip → does NOT initiate drag.
- [ ] Visit a dark site (e.g., `https://github.com`) → bar tiles + icons remain clearly visible (manual contrast check).
- [ ] Toggle OS dark mode while a tab is open → bar re-themes within ~500ms.
- [ ] Bar does not block scrolling, link clicks, or keyboard shortcuts on the host page (test on `example.com` and `github.com`).

### AC — Glimpse Panel
- [ ] Click the TODO icon → panel slides in from the bar's edge with an empty body and "TODO — content lands in a later phase" placeholder text.
- [ ] Click the Jira icon while TODO panel is open → header swaps to "Jira", body remains empty placeholder.
- [ ] Click the GitHub PRs icon → header swaps to "GitHub PRs".
- [ ] Press ESC while panel is open → panel closes with reverse slide.
- [ ] Click anywhere on the host page (outside both bar and panel) → panel closes.
- [ ] Click the panel's close (✕) button → panel closes.
- [ ] Resize viewport to 600px wide → panel width clamps to 520px (`vw − 80`).
- [ ] Enable `prefers-reduced-motion: reduce` in DevTools "Rendering" panel → reopen the panel → no slide animation, instant fade only.
- [ ] Drag the bar to the left edge → reopen the panel → panel anchors on the right side of the bar (i.e., outward from the bar).

### AC — Glimpse Option Page
- [ ] Click Settings icon in the bar → Glimpse Option Page opens in a new tab.
- [ ] Right-click extension toolbar icon → Options → same page opens.
- [ ] Drag the transparency slider → switch back to a tab with the bar → bar transparency updates live.
- [ ] Set transparency to 0% → bar background fully transparent (only icon tiles visible).
- [ ] Set transparency to 100% → bar background fully opaque.
- [ ] Toggle OS dark mode → Options page re-themes.

### AC — Drag handle visible affordance
- [ ] On hover over the grip area, cursor changes to `grab`.
- [ ] While dragging, cursor stays `grabbing` even if the pointer leaves the bar bounds.
- [ ] Grip dots are visible (≥ 4.5:1 contrast against the bar background) in both themes at all transparency values.

### AC — Cross-tab consistency
- [ ] Open `example.com` in two tabs → drag the bar in tab A → tab B updates within ~1s.
- [ ] Change transparency in Options → both tabs reflect within ~1s.

### AC — Cross-browser smoke
- [ ] Chrome: bar mounts, drag works, panel opens, options work.
- [ ] Edge: same.
- [ ] Firefox: same. Document any differences (animation timing, drop-shadow rendering) in [`../../testing-plan.md`](../../testing-plan.md) §Known issues.

---

## Manual QA Scripts

### Smoke (5 min)
> Run before every commit-to-main / PR merge during this phase.

1. `pnpm dev` → WXT auto-launches a dedicated Chrome with the extension preinstalled (output at `.output/chrome-mv3-dev/`). For prod smoke, `pnpm build` then load unpacked from `.output/chrome-mv3/`.
2. Visit `https://example.com` → bar visible.
3. Click TODO → panel opens with empty placeholder. ESC → panel closes.
4. Drag bar from right to left → snaps left. Reload → still on left.
5. Click Settings → Options page opens. Slide transparency to 20%. Switch back to example.com → bar more transparent.
6. No console errors anywhere.

### Full regression (15 min)
> Run before tagging the phase Done.

1. Run all AC items above on Chrome.
2. Repeat the smoke script on Edge.
3. Repeat the smoke script on Firefox.
4. Visit each "hard-case" site from [`../../testing-plan.md`](../../testing-plan.md) §2.3 and confirm the bar doesn't break:
   - `https://example.com` (baseline)
   - `https://github.com` (dark UI, SPA navigation)
   - `https://www.notion.so` (high z-index sidebar)
   - `https://www.youtube.com` (fullscreen video)
   - `https://docs.google.com` (collaboration overlays)
5. DevTools Performance: record a 5-second drag → confirm > 55fps (no long tasks > 50ms).
6. DevTools Accessibility tree: confirm the bar element shows up as `role="toolbar"` with all icons named.
7. Run Lighthouse on `example.com` with the extension loaded → score not regressed vs. baseline.

---

## Known Issues Log (this phase)

> Populate during QA. Each entry: site, browser, severity, description, mitigation. If empty at end of phase, delete the table.

| # | Site | Browser | Severity | Description | Mitigation |
|---|---|---|---|---|---|
| _ | _ | _ | _ | _ | _ |

---

## Phase Done Checklist

- [ ] All AC sections above are checked off on Chrome.
- [ ] Smoke passes on Edge + Firefox.
- [ ] No `console.error` from Glimpse code on the 5 hard-case sites.
- [ ] [`plan.md`](plan.md) all 10 steps committed.
- [ ] [`scope.md`](scope.md), [`ui-spec.md`](ui-spec.md), [`README.md`](README.md) reflect what was actually shipped (any drift is reconciled before tagging).
- [ ] Cross-cutting docs ([`../../requirements.md`](../../requirements.md), [`../../architecture.md`](../../architecture.md), [`../../ui-design.md`](../../ui-design.md), [`../../testing-plan.md`](../../testing-plan.md), [`../../roadmap.md`](../../roadmap.md)) reviewed for needed updates.
- [ ] Tag the commit `setup-and-ui-ux/done` (or whatever convention the team adopts).
