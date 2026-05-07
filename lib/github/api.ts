// GitHub GraphQL v4 transport + response mapping to NormalizedPr.

import { deriveOverallState } from "../pr/format"
import type {
  CiState,
  MergeState,
  NormalizedPr,
  Reviewer,
  ReviewerState,
  ReviewDecision
} from "../pr/types"
import {
  GqlRecheckResponse,
  GqlSnapshotResponse,
  GqlViewerResponse,
  type GqlPr,
  PR_SNAPSHOT_QUERY,
  RECHECK_MERGEABLE_QUERY,
  VIEWER_QUERY
} from "./query"

const GQL_ENDPOINT = "https://api.github.com/graphql"

// ── Error types ─────────────────────────────────────────────────────────────

export class GitHubApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GitHubApiError"
  }
}

export class RateLimitError extends GitHubApiError {
  /** ms epoch when the rate limit resets. */
  readonly resetAt: number
  constructor(resetAt: number) {
    super("GitHub rate limit reached")
    this.name = "RateLimitError"
    this.resetAt = resetAt
  }
}

// ── Core transport ──────────────────────────────────────────────────────────

async function gqlRequest<T>(
  pat: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data: T; headers: Headers }> {
  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `bearer ${pat}`,
      "Content-Type": "application/json",
      "X-GitHub-Next-Global-ID": "1"
    },
    body: JSON.stringify({ query, variables: variables ?? {} })
  })

  if (res.status === 401) {
    throw new GitHubApiError("Bad credentials — check your PAT")
  }
  if (res.status === 403) {
    const resetHeader = res.headers.get("X-RateLimit-Reset")
    if (resetHeader) {
      throw new RateLimitError(Number(resetHeader) * 1000)
    }
    throw new GitHubApiError("Forbidden (403)")
  }

  const body = (await res.json()) as {
    data?: T
    errors?: Array<{ message: string; type?: string }>
  }

  if (body.errors?.length) {
    const rateLimited = body.errors.find((e) => e.type === "RATE_LIMITED")
    if (rateLimited) {
      const resetHeader = res.headers.get("X-RateLimit-Reset")
      throw new RateLimitError(
        resetHeader ? Number(resetHeader) * 1000 : Date.now() + 60_000
      )
    }
    throw new GitHubApiError(body.errors.map((e) => e.message).join("; "))
  }

  if (!body.data) {
    throw new GitHubApiError("Empty response from GitHub")
  }

  return { data: body.data, headers: res.headers }
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface ViewerResult {
  login: string
  avatarUrl: string
  scopes: string[]
  isFinegrained: boolean
}

export async function getViewer(pat: string): Promise<ViewerResult> {
  const { data, headers } = await gqlRequest<GqlViewerResponse>(pat, VIEWER_QUERY)
  const scopeHeader = headers.get("X-OAuth-Scopes") ?? ""
  const scopes = scopeHeader ? scopeHeader.split(", ").map((s) => s.trim()).filter(Boolean) : []
  return {
    login:        data.viewer.login,
    avatarUrl:    data.viewer.avatarUrl,
    scopes,
    isFinegrained: scopes.length === 0 && !!pat
  }
}

export interface MissingScopes {
  missing: string[]
  isFinegrained: boolean
}

export function missingScopes(viewer: ViewerResult): MissingScopes {
  if (viewer.isFinegrained) {
    return { missing: [], isFinegrained: true }
  }
  const required = ["repo"]
  const has = new Set(viewer.scopes)
  if (has.has("repo") || has.has("public_repo")) {
    return { missing: [], isFinegrained: false }
  }
  return { missing: required, isFinegrained: false }
}

export interface SnapshotResult {
  viewer: { login: string; avatarUrl: string }
  prs: NormalizedPr[]
  /** GraphQL node IDs of PRs whose mergeable came back UNKNOWN. */
  unknownMergeableNodeIds: string[]
  /** Map of GraphQL node ID → NormalizedPr id, for the recheck pass. */
  nodeIdToPrId: Map<string, string>
}

export async function fetchPrSnapshot(pat: string): Promise<SnapshotResult> {
  const { data } = await gqlRequest<GqlSnapshotResponse>(pat, PR_SNAPSHOT_QUERY, {
    mineQ:   "is:open is:pr author:@me archived:false",
    reviewQ: "is:open is:pr review-requested:@me archived:false"
  })

  if (data.rateLimit.remaining === 0) {
    throw new RateLimitError(new Date(data.rateLimit.resetAt).getTime())
  }

  const mineNodes   = data.mine.nodes.filter((n): n is GqlPr => n !== null)
  const reviewNodes = data.review.nodes.filter((n): n is GqlPr => n !== null)

  const fromTabMap = new Map<string, Array<"mine" | "review">>()
  for (const pr of mineNodes) {
    fromTabMap.set(pr.id, ["mine"])
  }
  for (const pr of reviewNodes) {
    const existing = fromTabMap.get(pr.id)
    if (existing) {
      existing.push("review")
    } else {
      fromTabMap.set(pr.id, ["review"])
    }
  }

  const seen = new Set<string>()
  const allNodes: GqlPr[] = []
  for (const pr of [...mineNodes, ...reviewNodes]) {
    if (!seen.has(pr.id)) {
      seen.add(pr.id)
      allNodes.push(pr)
    }
  }

  const unknownMergeableNodeIds: string[] = []
  const nodeIdToPrId = new Map<string, string>()
  const prs = allNodes.map((node) => {
    const pr = mapGqlPr(node, fromTabMap.get(node.id) ?? ["mine"])
    nodeIdToPrId.set(node.id, pr.id)
    if (node.mergeable === "UNKNOWN") {
      unknownMergeableNodeIds.push(node.id)
    }
    return pr
  })

  return {
    viewer: { login: data.viewer.login, avatarUrl: data.viewer.avatarUrl },
    prs,
    unknownMergeableNodeIds,
    nodeIdToPrId
  }
}

export async function recheckMergeableWithMap(
  pat: string,
  nodeIds: string[],
  nodeIdToPrId: Map<string, string>
): Promise<Array<{ id: string; mergeState: MergeState }>> {
  if (nodeIds.length === 0) return []
  const { data } = await gqlRequest<GqlRecheckResponse>(pat, RECHECK_MERGEABLE_QUERY, {
    ids: nodeIds
  })

  const patches: Array<{ id: string; mergeState: MergeState }> = []
  for (const node of data.nodes) {
    if (!node || node.mergeable === "UNKNOWN" || node.mergeable === null) continue
    const prId = nodeIdToPrId.get(node.id)
    if (!prId) continue
    patches.push({ id: prId, mergeState: mapMergeable(node.mergeable) })
  }
  return patches
}

// ── Mapping helpers ─────────────────────────────────────────────────────────

function mapGqlPr(
  node: GqlPr,
  fromTab: Array<"mine" | "review">
): NormalizedPr {
  const repo = node.repository.nameWithOwner
  const id = `github:${repo}#${node.number}`
  const [owner] = repo.split("/")

  const reviewers = buildReviewers(node)
  const ciState   = mapCiState(node)
  const { failingChecks, totalChecks } = countChecks(node)
  const mergeState = mapMergeable(node.mergeable)
  const reviewDecision = mapReviewDecision(node.reviewDecision)

  const pr: NormalizedPr = {
    id,
    providerId:    "github",
    displayNumber: `#${node.number}`,
    number:        node.number,
    title:         node.title,
    url:           node.url,
    repo,
    parent:        owner,
    author: {
      displayName: node.author?.login ?? "ghost",
      avatarUrl:   node.author?.avatarUrl
    },
    isDraft:       node.isDraft,
    state:         "open",
    headRef:       node.headRefName,
    baseRef:       node.baseRefName,
    createdAt:     new Date(node.createdAt).getTime(),
    updatedAt:     new Date(node.updatedAt).getTime(),
    commentsCount: node.comments.totalCount,
    reviewDecision,
    reviewers,
    ciState,
    failingChecks,
    totalChecks,
    mergeState,
    overallState:  "neutral",
    fromTab
  }
  pr.overallState = deriveOverallState(pr)
  return pr
}

function buildReviewers(node: GqlPr): Reviewer[] {
  const map = new Map<string, Reviewer>()

  // Seed with requested reviewers (pending).
  for (const req of node.reviewRequests.nodes) {
    const user = req.requestedReviewer
    if (!user?.login) continue
    map.set(user.login, {
      id:          user.login,
      displayName: user.login,
      avatarUrl:   user.avatarUrl,
      state:       "pending"
    })
  }

  // Apply reviews oldest→newest; later wins.
  const sorted = [...node.reviews.nodes].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  )
  for (const review of sorted) {
    if (!review.author?.login) continue
    map.set(review.author.login, {
      id:          review.author.login,
      displayName: review.author.login,
      avatarUrl:   review.author.avatarUrl,
      state:       mapReviewerState(review.state)
    })
  }

  return Array.from(map.values())
}

function mapReviewerState(
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING"
): ReviewerState {
  switch (state) {
    case "APPROVED":           return "approved"
    case "CHANGES_REQUESTED":  return "changes_requested"
    case "COMMENTED":          return "commented"
    case "DISMISSED":          return "dismissed"
    case "PENDING":            return "pending"
  }
}

function mapReviewDecision(
  gql: "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | null
): ReviewDecision {
  switch (gql) {
    case "APPROVED":          return "approved"
    case "CHANGES_REQUESTED": return "changes_requested"
    case "REVIEW_REQUIRED":   return "review_required"
    case null:                return "none"
  }
}

function mapCiState(node: GqlPr): CiState {
  const rollup = node.commits.nodes[0]?.commit?.statusCheckRollup
  if (!rollup) return "none"
  switch (rollup.state) {
    case "SUCCESS":              return "success"
    case "FAILURE": case "ERROR": return "failure"
    case "PENDING": case "EXPECTED": return "pending"
    default:                     return "neutral"
  }
}

function countChecks(node: GqlPr): { failingChecks: number; totalChecks: number } {
  const contexts = node.commits.nodes[0]?.commit?.statusCheckRollup?.contexts
  if (!contexts) return { failingChecks: 0, totalChecks: 0 }

  let failingChecks = 0
  for (const ctx of contexts.nodes) {
    if (ctx.__typename === "CheckRun") {
      if (
        ctx.conclusion === "FAILURE" ||
        ctx.conclusion === "TIMED_OUT" ||
        ctx.conclusion === "CANCELLED" ||
        ctx.conclusion === "ACTION_REQUIRED"
      ) {
        failingChecks++
      }
    } else if (ctx.__typename === "StatusContext") {
      if (ctx.state === "ERROR" || ctx.state === "FAILURE") {
        failingChecks++
      }
    }
  }
  return { failingChecks, totalChecks: contexts.totalCount }
}

function mapMergeable(
  gql: "MERGEABLE" | "CONFLICTING" | "UNKNOWN" | null
): MergeState {
  switch (gql) {
    case "MERGEABLE":    return "clean"
    case "CONFLICTING":  return "conflicting"
    case "UNKNOWN":      return "unknown"
    case null:           return "unknown"
  }
}
