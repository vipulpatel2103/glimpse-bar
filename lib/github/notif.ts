// Pure diffing functions. Called from sync.ts (background SW only).
// No storage reads/writes here — callers handle persistence.

import type {
  ChangeEvent,
  ChangeEventType,
  NotifBaseline,
  PullRequest,
} from "./types"

const MAX_CHANGES = 50

export function buildBaseline(prs: PullRequest[]): NotifBaseline {
  const b: NotifBaseline = {}
  for (const pr of prs) {
    b[pr.id] = {
      ciState: pr.ciState,
      reviewDecision: pr.reviewDecision,
      fromTab: pr.fromTab,
      mergeState: pr.mergeState,
      state: pr.state,
    }
  }
  return b
}

export function diffPrState(
  baseline: NotifBaseline,
  next: PullRequest[]
): ChangeEvent[] {
  const events: ChangeEvent[] = []
  const now = Date.now()

  function ev(
    pr: PullRequest,
    type: ChangeEventType,
    detail?: string
  ): ChangeEvent {
    return {
      id: crypto.randomUUID(),
      prId: pr.id,
      prNumber: pr.number,
      prTitle: pr.title,
      repo: pr.repo,
      prUrl: pr.url,
      type,
      detail,
      createdAt: now,
    }
  }

  for (const pr of next) {
    const prev = baseline[pr.id]

    if (!prev) {
      // First time seeing this PR — emit a new-PR event.
      if (pr.fromTab.includes("review")) {
        events.push(ev(pr, "new_review_request"))
      } else if (pr.fromTab.includes("mine")) {
        events.push(ev(pr, "new_mine"))
      }
      continue
    }

    // CI state change
    if (prev.ciState !== pr.ciState) {
      if (pr.ciState === "failure") {
        events.push(ev(pr, "ci_failure"))
      } else if (pr.ciState === "success" && prev.ciState === "failure") {
        events.push(ev(pr, "ci_success"))
      }
    }

    // Review decision change
    if (prev.reviewDecision !== pr.reviewDecision) {
      if (pr.reviewDecision === "approved") {
        // Try to find who approved from the reviewers list.
        const approver = pr.reviewers.find((r) => r.state === "approved")
        events.push(ev(pr, "approved", approver?.login))
      } else if (pr.reviewDecision === "changes_requested") {
        const requester = pr.reviewers.find((r) => r.state === "changes_requested")
        events.push(ev(pr, "changes_requested", requester?.login))
      }
    }

    // Merge conflict detected
    if (prev.mergeState !== "conflicting" && pr.mergeState === "conflicting") {
      events.push(ev(pr, "conflict"))
    }

    // PR merged
    if (prev.state === "open" && pr.state === "merged") {
      events.push(ev(pr, "merged"))
    }
  }

  return events
}

/** Merge incoming events with existing ones, cap at MAX_CHANGES (newest first). */
export function appendChanges(
  existing: ChangeEvent[],
  incoming: ChangeEvent[]
): ChangeEvent[] {
  if (incoming.length === 0) return existing
  const combined = [...incoming, ...existing]
  return combined.slice(0, MAX_CHANGES)
}
