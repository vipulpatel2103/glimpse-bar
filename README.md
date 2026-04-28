# Glimpse Bar

A floating, draggable, transparent vertical sidebar that sits on every web page and lets you peek at your TODOs, Jira tickets, GitHub PRs, and more — without leaving the page you're on.

Built with [WXT](https://wxt.dev/) + React 18 + Tailwind v3 + `@wxt-dev/storage`. Targets Chrome, Edge, and Firefox.

> **Status:** in design. The first delivery slice — **Setup and UI/UX** — is fully planned. See [`docs/`](docs/).

---

## Glossary

- **Glimpse Bar** — the transparent vertical icon rail injected on every page.
- **Glimpse Panel** — the slide-in panel that opens when you click an app icon.
- **Glimpse Option Page** — the extension's settings page (a WXT options entrypoint).

---

## Documentation map

The project is delivered in **phases**. Each phase has a folder under [`docs/phases/`](docs/phases/) with its own scope, plan, UI spec, and verification. Cross-cutting docs describe the full system.

### Cross-cutting (full system)
| Doc | What's in it |
|---|---|
| **[CLAUDE.md](CLAUDE.md)**                | **Project-specific instructions for Claude Code — read first every session.** |
| **[design.md](design.md)**                | **Stitch-format design system spec for AI coding agents — read this first for any UI change.** |
| [requirements.md](docs/requirements.md)   | Glossary, personas, FRs (with phase tags), NFRs, system AC |
| [architecture.md](docs/architecture.md)   | WXT entrypoints, shadow root UI, storage model, plugin registry, build matrix |
| [ui-design.md](docs/ui-design.md)         | Color tokens, typography, sizes, animations, accessibility (human deep-dive) |
| [testing-plan.md](docs/testing-plan.md)   | Manual QA scripts, hard-case sites, release checklist |
| [roadmap.md](docs/roadmap.md)             | Phase order, anti-goals, decision log (incl. the WXT switch) |

### WXT framework reference (cached)
| Doc | What's in it |
|---|---|
| [wxt_dev_guide.md](docs/wxt_dev_guide.md) | Installation + content scripts + entrypoints from the official guide |
| [wxt_dev_llms.md](docs/wxt_dev_llms.md)   | Context7-fetched LLM-friendly WXT docs, set 1 |
| [wxt_dev_llms2.md](docs/wxt_dev_llms2.md) | Context7-fetched LLM-friendly WXT docs, set 2 |

### Phases
| Folder | Status | Goal |
|---|---|---|
| [phases/00-setup-and-ui-ux/](docs/phases/00-setup-and-ui-ux/) | **Active — fully planned** | Bar + Panel + Option Page. No real apps. |
| [phases/01-todo/](docs/phases/01-todo/)                     | Stub | Local TODO list. |
| [phases/02-github-prs/](docs/phases/02-github-prs/)         | Stub | GitHub PR review queue. |
| [phases/03-jira/](docs/phases/03-jira/)                     | Stub | Jira assigned-to-me issues. |

Index: [docs/README.md](docs/README.md) · Phase index: [docs/phases/README.md](docs/phases/README.md)

---

## Reading order for a new contributor

1. [docs/requirements.md](docs/requirements.md) — what we're building.
2. [docs/roadmap.md](docs/roadmap.md) — what order, including the decision log entry for the WXT switch.
3. [docs/phases/00-setup-and-ui-ux/README.md](docs/phases/00-setup-and-ui-ux/README.md) — the active slice.
4. [docs/phases/00-setup-and-ui-ux/plan.md](docs/phases/00-setup-and-ui-ux/plan.md) — the build steps.

---

## Project structure (target)

```
glimpse-bar/
├── package.json
├── tsconfig.json
├── wxt.config.ts                    ← modules + manifest
├── tailwind.config.js
├── postcss.config.js
├── entrypoints/
│   ├── background.ts                ← defineBackground()
│   ├── glimpse.content/             ← content script (folder entrypoint)
│   │   ├── index.tsx                ← defineContentScript + createShadowRootUi
│   │   ├── App.tsx                  ← <GlimpseBar/> + <GlimpsePanel/>
│   │   ├── components/
│   │   ├── hooks/
│   │   └── style.css                ← @tailwind directives
│   └── options/
│       ├── index.html               ← HTML entrypoint
│       ├── main.tsx
│       └── style.css
├── lib/
│   ├── storage.ts                   ← typed storage.defineItem(...) declarations
│   └── apps/
│       ├── types.ts
│       └── registry.ts
├── public/
│   └── icon/128.png                 ← @wxt-dev/auto-icons input
└── docs/                            ← see Documentation map above
```

See [docs/architecture.md](docs/architecture.md) for the rationale behind each filename and folder convention (WXT is convention-driven — file paths drive the manifest).

---

## Dev Setup

> Prerequisites: Node 18+, pnpm 8+. The project hasn't been scaffolded yet — see [Step 1 of the active phase plan](docs/phases/00-setup-and-ui-ux/plan.md) for bootstrap instructions.

Once scaffolded:

```bash
pnpm install                  # also runs `wxt prepare` to generate .wxt/

# Inner-loop: WXT spawns a Chrome window with the extension preinstalled + HMR
pnpm dev
```

Other browsers:
```bash
pnpm dev:firefox              # Firefox dev runner
pnpm build:edge               # Edge prod build → .output/edge-mv3/
```

Production:
```bash
pnpm build                    # → .output/chrome-mv3/
pnpm build:firefox            # → .output/firefox-mv2/
pnpm build:edge               # → .output/edge-mv3/
pnpm zip                      # → .output/<name>-<version>-chrome.zip
pnpm zip:firefox              # → .output/<name>-<version>-firefox.zip
```

Type check without building:
```bash
pnpm compile                  # tsc --noEmit
```

---

## Contributing

1. Read [docs/requirements.md](docs/requirements.md).
2. Find the active phase under [docs/phases/](docs/phases/).
3. Pick a step from the phase's `plan.md`.
4. Open a PR; run the phase's `verification.md` smoke script before requesting review.
