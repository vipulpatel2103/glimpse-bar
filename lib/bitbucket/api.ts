// Bitbucket Cloud REST 2.0 transport + response mapping to NormalizedPr.
//
// Auth: Authorization: Basic base64(username:token).
// Bitbucket Cloud accepts this scheme for both classic App Passwords and
// modern Workspace/Repo Access Tokens.

import { deriveOverallState } from "../pr/format"
import type {
  CiState,
  NormalizedPr,
  Reviewer,
  ReviewDecision,
  ReviewerState
} from "../pr/types"
import {
  prsForRepoUrl,
  reposUrl,
  statusesUrl,
  userUrl
} from "./endpoints"
import type {
  BbAccount,
  BbPage,
  BbParticipant,
  BbPullRequestRaw,
  BbStatusRaw,
  BbViewer
} from "./raw"
import type { BbAuthState, BbWorkspaceSlug } from "./types"

// ── Error types ─────────────────────────────────────────────────────────────

export class BitbucketApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BitbucketApiError"
  }
}

export class BitbucketRateLimitError extends BitbucketApiError {
  /** ms epoch when the rate limit resets. */
  readonly resetAt: number
  constructor(resetAt: number) {
    super("Bitbucket rate limit reached")
    this.name = "BitbucketRateLimitError"
    this.resetAt = resetAt
  }
}

// ── Credentials helper ──────────────────────────────────────────────────────

export interface BbCreds {
  username: string
  token: string
}

function authHeader(creds: BbCreds): string {
  return `Basic ${btoa(`${creds.username}:${creds.token}`)}`
}

export function credsFromAuth(auth: BbAuthState): BbCreds | null {
  if (!auth.username || !auth.token) return null
  return { username: auth.username, token: auth.token }
}

// ── Core transport ──────────────────────────────────────────────────────────

interface RequestResult<T> {
  data: T
  headers: Headers
}

async function bbRequest<T>(
  creds: BbCreds,
  url: string
): Promise<RequestResult<T>> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: authHeader(creds),
      Accept: "application/json"
    }
  })

  if (res.status === 401) {
    throw new BitbucketApiError("Bad credentials — check workspace, username, token")
  }
  if (res.status === 403) {
    throw new BitbucketApiError("Forbidden — token missing required scope")
  }
  if (res.status === 404) {
    throw new BitbucketApiError("Not found")
  }
  if (res.status === 410) {
    // Bitbucket retired endpoints with 410 Gone (e.g. /user/permissions/workspaces).
    throw new BitbucketApiError(`Endpoint retired by Bitbucket (${url})`)
  }
  if (res.status === 429) {
    throw new BitbucketRateLimitError(parseRateLimitReset(res.headers))
  }
  if (res.status >= 500) {
    throw new BitbucketApiError(`Bitbucket ${res.status}`)
  }
  if (!res.ok) {
    throw new BitbucketApiError(`Bitbucket ${res.status}: ${res.statusText}`)
  }

  const data = (await res.json()) as T
  return { data, headers: res.headers }
}

function parseRateLimitReset(headers: Headers): number {
  const reset = headers.get("X-RateLimit-Reset")
  if (reset) {
    const ts = Number(reset)
    if (Number.isFinite(ts)) return ts * 1000
  }
  return Date.now() + 60_000
}

const MAX_PAGES = 10

async function bbPaginate<T>(
  creds: BbCreds,
  firstUrl: string
): Promise<T[]> {
  const all: T[] = []
  let url: string | undefined = firstUrl
  let pages = 0
  while (url && pages < MAX_PAGES) {
    const result: RequestResult<BbPage<T>> = await bbRequest<BbPage<T>>(creds, url)
    const page = result.data
    if (Array.isArray(page.values)) all.push(...page.values)
    url = page.next
    pages++
  }
  return all
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface ViewerResult {
  accountId: string
  uuid: string
  nickname: string
  displayName: string
  avatarUrl?: string
}

export async function getViewer(creds: BbCreds): Promise<ViewerResult> {
  const { data } = await bbRequest<BbViewer>(creds, userUrl())
  return {
    accountId:    data.account_id,
    uuid:         data.uuid,
    nickname:     data.nickname,
    displayName:  data.display_name,
    avatarUrl:    data.links?.avatar?.href
  }
}

export interface MissingScopes {
  missing: string[]
}

/**
 * Probes scope presence by hitting `/2.0/repositories/{workspace}?pagelen=1`.
 * - 200 → token has `read:repository:bitbucket` for this workspace.
 * - 403 → missing scope (named in the response body when present).
 * - 404 → workspace slug doesn't exist or token can't see it.
 *
 * `/2.0/workspaces` is no longer probed (Atlassian returned 410 Gone for it
 * post-App-Password sunset). The single declared workspace is now the only
 * workspace we care about.
 */
export async function probeScopes(
  creds: BbCreds,
  workspace: BbWorkspaceSlug
): Promise<MissingScopes> {
  try {
    await bbRequest(creds, `${reposUrl(workspace)}`)
    return { missing: [] }
  } catch (err) {
    if (err instanceof BitbucketApiError) {
      if (/Forbidden/i.test(err.message)) {
        return { missing: ["read:repository:bitbucket"] }
      }
      if (/Not found/i.test(err.message)) {
        return { missing: [`workspace "${workspace}" not visible`] }
      }
    }
    // Inconclusive — getViewer already proved basic auth works.
    return { missing: [] }
  }
}

export async function listReposInWorkspace(
  creds: BbCreds,
  workspace: BbWorkspaceSlug
): Promise<string[]> {
  const items = await bbPaginate<{ full_name?: string; slug?: string; name: string }>(
    creds,
    reposUrl(workspace)
  )
  const out: string[] = []
  for (const r of items) {
    const fullName = r.full_name ?? `${workspace}/${r.slug ?? r.name}`
    out.push(fullName)
  }
  return out
}

/**
 * Per-repo combined "Mine + Review" fetch. Single REST call covers both
 * roles via a `q=...OR...` filter; mapper derives `fromTab` per PR by
 * checking whose account_id matched.
 */
export async function fetchPrsForRepo(
  creds: BbCreds,
  workspace: BbWorkspaceSlug,
  repoSlug: string,
  accountId: string
): Promise<NormalizedPr[]> {
  const raws = await bbPaginate<BbPullRequestRaw>(
    creds,
    prsForRepoUrl(workspace, repoSlug, accountId)
  )
  return raws.map((r) => mapBbPr(r, deriveFromTab(r, accountId)))
}

function deriveFromTab(
  raw: BbPullRequestRaw,
  accountId: string
): Array<"mine" | "review"> {
  const tabs: Array<"mine" | "review"> = []
  if (raw.author?.account_id === accountId) tabs.push("mine")
  const isReviewer =
    (raw.reviewers ?? []).some((r) => r.account_id === accountId) ||
    (raw.participants ?? []).some(
      (p) => p.role === "REVIEWER" && p.user.account_id === accountId
    )
  if (isReviewer) tabs.push("review")
  // Defensive fallback — if neither side matched (shouldn't happen given the
  // `q` filter but Bitbucket's filter semantics aren't always exact), tag
  // "review" so the PR still surfaces somewhere.
  if (tabs.length === 0) tabs.push("review")
  return tabs
}

export interface CiPatch {
  ciState: CiState
  failingChecks: number
  totalChecks: number
}

export async function fetchPrStatuses(
  creds: BbCreds,
  workspace: BbWorkspaceSlug,
  repoSlug: string,
  prNumber: number
): Promise<CiPatch> {
  const items = await bbPaginate<BbStatusRaw>(
    creds,
    statusesUrl(workspace, repoSlug, prNumber)
  )

  // Roll up per status `key`: the latest entry wins.
  // Fallback chain `key → name → url → idx`: deterministic identifier so two
  // reports of the same anonymous status (INPROGRESS → SUCCESSFUL) collapse
  // to one entry. `Math.random()` previously gave each report a unique key,
  // inflating totalChecks and breaking dedup for status integrations that
  // omit `key`/`name` (some 3rd-party CIs do).
  const latestByKey = new Map<string, BbStatusRaw>()
  items.forEach((s, idx) => {
    const k = s.key ?? s.name ?? s.url ?? `__anon:${idx}`
    const prev = latestByKey.get(k)
    if (!prev) {
      latestByKey.set(k, s)
      return
    }
    const prevTs = new Date(prev.updated_on ?? prev.created_on ?? 0).getTime()
    const nextTs = new Date(s.updated_on ?? s.created_on ?? 0).getTime()
    if (nextTs >= prevTs) latestByKey.set(k, s)
  })

  let failing = 0
  let pending = 0
  let success = 0
  let total = 0
  for (const s of latestByKey.values()) {
    total++
    if (s.state === "FAILED" || s.state === "STOPPED") failing++
    else if (s.state === "INPROGRESS") pending++
    else if (s.state === "SUCCESSFUL") success++
  }

  let ciState: CiState = "none"
  if (total > 0) {
    if (failing > 0) ciState = "failure"
    else if (pending > 0) ciState = "pending"
    else if (success > 0) ciState = "success"
    else ciState = "neutral"
  }

  return { ciState, failingChecks: failing, totalChecks: total }
}

// ── Mapping helpers ─────────────────────────────────────────────────────────

function mapBbPr(
  raw: BbPullRequestRaw,
  fromTab: Array<"mine" | "review">
): NormalizedPr {
  const repoFullName =
    raw.destination?.repository?.full_name ??
    raw.source?.repository?.full_name ??
    "unknown/unknown"

  const [workspace = "unknown"] = repoFullName.split("/")
  const repo = repoFullName
  const id = `bitbucket:${repo}#${raw.id}`

  const author = pickName(raw.author) ?? "ghost"
  const authorAvatarUrl = raw.author?.links?.avatar?.href

  const reviewers = buildReviewers(raw)
  const reviewDecision = deriveReviewDecision(raw, reviewers)

  const pr: NormalizedPr = {
    id,
    providerId:    "bitbucket",
    displayNumber: `#${raw.id}`,
    number:        raw.id,
    title:         raw.title,
    url:           raw.links?.html?.href ?? "",
    repo,
    parent:        workspace,
    author: {
      displayName: author,
      avatarUrl:   authorAvatarUrl
    },
    isDraft:       raw.draft === true,
    state:         mapPrState(raw.state),
    headRef:       raw.source?.branch?.name ?? "",
    baseRef:       raw.destination?.branch?.name ?? "",
    createdAt:     new Date(raw.created_on).getTime(),
    updatedAt:     new Date(raw.updated_on).getTime(),
    commentsCount: raw.comment_count ?? 0,
    reviewDecision,
    reviewers,
    // CI defaults to neutral; sync.ts patches via fetchPrStatuses.
    ciState:        "none",
    failingChecks:  0,
    totalChecks:    0,
    // Mergeability isn't cheap on REST 2.0 — see scope.md.
    mergeState:     "unknown",
    overallState:   "neutral",
    fromTab
  }
  pr.overallState = deriveOverallState(pr)
  return pr
}

function pickName(acc: BbAccount | undefined): string | undefined {
  if (!acc) return undefined
  return acc.nickname ?? acc.username ?? acc.display_name ?? undefined
}

function buildReviewers(raw: BbPullRequestRaw): Reviewer[] {
  const map = new Map<string, Reviewer>()

  for (const r of raw.reviewers ?? []) {
    const key = reviewerKey(r)
    if (!key) continue
    map.set(key, {
      id:          r.account_id ?? r.uuid ?? key,
      displayName: pickName(r) ?? "user",
      avatarUrl:   r.links?.avatar?.href,
      state:       "pending"
    })
  }

  for (const p of raw.participants ?? []) {
    if (p.role !== "REVIEWER") continue
    const key = reviewerKey(p.user)
    if (!key) continue
    const existing = map.get(key)
    const state = mapParticipantState(p)
    map.set(key, {
      id:          p.user.account_id ?? p.user.uuid ?? key,
      displayName: pickName(p.user) ?? existing?.displayName ?? "user",
      avatarUrl:   p.user.links?.avatar?.href ?? existing?.avatarUrl,
      state
    })
  }

  return Array.from(map.values())
}

function reviewerKey(acc: BbAccount): string | null {
  return acc.account_id ?? acc.uuid ?? acc.nickname ?? acc.username ?? null
}

function mapParticipantState(p: BbParticipant): ReviewerState {
  if (p.approved) return "approved"
  if (p.state === "changes_requested") return "changes_requested"
  if (p.state === "approved") return "approved"
  if (p.participated_on) return "commented"
  return "pending"
}

function deriveReviewDecision(
  raw: BbPullRequestRaw,
  reviewers: Reviewer[]
): ReviewDecision {
  const hasReviewers = (raw.reviewers?.length ?? 0) > 0 || reviewers.length > 0
  if (!hasReviewers) return "none"

  if (reviewers.some((r) => r.state === "changes_requested")) {
    return "changes_requested"
  }

  const anyApproved = reviewers.some((r) => r.state === "approved")
  const anyPending  = reviewers.some((r) => r.state === "pending")
  if (anyApproved && !anyPending) return "approved"

  if (anyPending) return "review_required"
  if (reviewers.some((r) => r.state === "commented")) return "commented"
  return "none"
}

function mapPrState(s: string): NormalizedPr["state"] {
  switch (s) {
    case "OPEN":       return "open"
    case "MERGED":     return "merged"
    case "DECLINED":   return "declined"
    case "SUPERSEDED": return "superseded"
    default:           return "open"
  }
}
