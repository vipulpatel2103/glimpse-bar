# Glimpse Bar — Docs

Cross-cutting reference docs (full system) + a phase folder for each delivery slice.

> **Stack:** [WXT](https://wxt.dev/) + React 18 + Tailwind v3 + `@wxt-dev/storage`.

---

## Cross-cutting (apply across all phases)

| File | What's in it |
|---|---|
| [`requirements.md`](requirements.md)   | Glossary, personas, FRs (with phase tags), NFRs, system AC |
| [`architecture.md`](architecture.md)   | WXT entrypoints, shadow root UI, storage model, plugin registry, build matrix |
| [`ui-design.md`](ui-design.md)         | Color tokens, typography, sizes, animations, accessibility |
| [`testing-plan.md`](testing-plan.md)   | Manual QA scripts, hard-case sites, release checklist |
| [`roadmap.md`](roadmap.md)             | Phase order, anti-goals, decision log |

## WXT framework reference (cached, don't edit)

| File | What's in it |
|---|---|
| [`wxt_dev_guide.md`](wxt_dev_guide.md) | Installation + content scripts + entrypoints from the official guide |
| [`wxt_dev_llms.md`](wxt_dev_llms.md)   | Context7-fetched LLM-friendly WXT docs, set 1 |
| [`wxt_dev_llms2.md`](wxt_dev_llms2.md) | Context7-fetched LLM-friendly WXT docs, set 2 |

When you have a "how do I X in WXT?" question, search these three first before web-fetching the live docs.

## Phases (per-delivery scope, plans, verification)

See [`phases/README.md`](phases/README.md) for the index. Active phase first:

- [`phases/00-setup-and-ui-ux/`](phases/00-setup-and-ui-ux/) — **active, fully planned**
- [`phases/01-todo/`](phases/01-todo/) — stub
- [`phases/02-github-prs/`](phases/02-github-prs/) — stub
- [`phases/03-jira/`](phases/03-jira/) — stub

---

## Reading order for a new contributor

1. [`requirements.md`](requirements.md) — what we're building.
2. [`roadmap.md`](roadmap.md) — what order, including the decision log entry for the WXT switch.
3. [`phases/00-setup-and-ui-ux/README.md`](phases/00-setup-and-ui-ux/README.md) — the active slice.
4. [`phases/00-setup-and-ui-ux/plan.md`](phases/00-setup-and-ui-ux/plan.md) — the build steps.
5. Reference [`architecture.md`](architecture.md), [`ui-design.md`](ui-design.md), [`testing-plan.md`](testing-plan.md) as needed while you're in the code.
