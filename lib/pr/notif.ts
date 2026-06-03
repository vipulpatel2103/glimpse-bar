// Shared change-feed diffing. Called from per-provider sync.ts (background SW only).
// No storage reads/writes here — callers handle persistence.

import type {
  ChangeEventType,
  NormalizedChangeEvent,
  NormalizedPr,
  NotifBaseline
} from "./types"

const MAX_CHANGES = 50

export function buildBaseline(prs: NormalizedPr[]): NotifBaseline {
  const b: NotifBaseline = {}
  for (const pr of prs) {
    b[pr.id] = {
      ciState:        pr.ciState,
      reviewDecision: pr.reviewDecision,
      fromTab:        pr.fromTab,
      mergeState:     pr.mergeState,
      state:          pr.state
    }
  }
  return b
}

export function diffPrState(
  baseline: NotifBaseline,
  next: NormalizedPr[]
): NormalizedChangeEvent[] {
  const events: NormalizedChangeEvent[] = []
  const now = Date.now()

  function ev(
    pr: NormalizedPr,
    type: ChangeEventType,
    detail?: string
  ): NormalizedChangeEvent {
    return {
      id:        crypto.randomUUID(),
      prId:      pr.id,
      prNumber:  pr.number,
      prTitle:   pr.title,
      repo:      pr.repo,
      prUrl:     pr.url,
      type,
      detail,
      createdAt: now
    }
  }

  for (const pr of next) {
    const prev = baseline[pr.id]

    if (!prev) {
      if (pr.fromTab.includes("review")) {
        events.push(ev(pr, "new_review_request"))
      } else if (pr.fromTab.includes("mine")) {
        events.push(ev(pr, "new_mine"))
      }
      continue
    }

    if (prev.ciState !== pr.ciState) {
      if (pr.ciState === "failure") {
        events.push(ev(pr, "ci_failure"))
      } else if (pr.ciState === "success" && prev.ciState === "failure") {
        events.push(ev(pr, "ci_success"))
      }
    }

    if (prev.reviewDecision !== pr.reviewDecision) {
      if (pr.reviewDecision === "approved") {
        const approver = pr.reviewers.find((r) => r.state === "approved")
        events.push(ev(pr, "approved", approver?.displayName))
      } else if (pr.reviewDecision === "changes_requested") {
        const requester = pr.reviewers.find((r) => r.state === "changes_requested")
        events.push(ev(pr, "changes_requested", requester?.displayName))
      }
    }

    if (prev.mergeState !== "conflicting" && pr.mergeState === "conflicting") {
      events.push(ev(pr, "conflict"))
    }

    if (prev.state === "open" && pr.state === "merged") {
      events.push(ev(pr, "merged"))
    }
    if (prev.state === "open" && pr.state === "declined") {
      events.push(ev(pr, "declined"))
    }
  }

  return events
}

/** Merge incoming events with existing ones, cap at MAX_CHANGES (newest first). */
export function appendChanges(
  existing: NormalizedChangeEvent[],
  incoming: NormalizedChangeEvent[]
): NormalizedChangeEvent[] {
  if (incoming.length === 0) return existing
  const combined = [...incoming, ...existing]
  return combined.slice(0, MAX_CHANGES)
}
