// Static GraphQL query + raw response types for the PR snapshot.
// Only api.ts should import from this file.

export const PR_SNAPSHOT_QUERY = /* GraphQL */ `
  query GlimpsePrSnapshot($mineQ: String!, $reviewQ: String!) {
    viewer { login avatarUrl }
    mine:   search(first: 50, type: ISSUE, query: $mineQ)   { nodes { ...Pr } }
    review: search(first: 50, type: ISSUE, query: $reviewQ) { nodes { ...Pr } }
    rateLimit { remaining cost resetAt }
  }
  fragment Pr on PullRequest {
    id
    databaseId
    number
    title
    url
    isDraft
    updatedAt
    createdAt
    author        { login ... on User { avatarUrl } }
    baseRefName
    headRefName
    repository    { nameWithOwner }
    comments      { totalCount }
    mergeable
    reviewDecision
    reviewRequests(first: 10) {
      nodes {
        requestedReviewer {
          ... on User { login avatarUrl }
        }
      }
    }
    reviews(last: 30) {
      nodes {
        author  { login ... on User { avatarUrl } }
        state
        submittedAt
      }
    }
    commits(last: 1) {
      nodes {
        commit {
          statusCheckRollup {
            state
            contexts(first: 50) {
              totalCount
              nodes {
                __typename
                ... on CheckRun      { conclusion status name }
                ... on StatusContext { state context }
              }
            }
          }
        }
      }
    }
  }
`

export const VIEWER_QUERY = /* GraphQL */ `
  query GlimpseViewer { viewer { login avatarUrl } }
`

export const RECHECK_MERGEABLE_QUERY = /* GraphQL */ `
  query GlimpseRecheckMergeable($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on PullRequest { id mergeable }
    }
  }
`

// ── Raw response types ─────────────────────────────────────────────────────
// These mirror the GraphQL schema exactly and are only used for parsing.

export interface GqlActor {
  login: string
  avatarUrl?: string
}

export interface GqlPr {
  id: string           // opaque node ID
  databaseId: number
  number: number
  title: string
  url: string
  isDraft: boolean
  updatedAt: string    // ISO-8601
  createdAt: string
  author: GqlActor | null
  baseRefName: string
  headRefName: string
  repository: { nameWithOwner: string }
  comments: { totalCount: number }
  mergeable: "MERGEABLE" | "CONFLICTING" | "UNKNOWN" | null
  reviewDecision:
    | "APPROVED"
    | "CHANGES_REQUESTED"
    | "REVIEW_REQUIRED"
    | null
  reviewRequests: {
    nodes: Array<{
      requestedReviewer: { login: string; avatarUrl?: string } | null
    }>
  }
  reviews: {
    nodes: Array<{
      author: GqlActor | null
      state:
        | "APPROVED"
        | "CHANGES_REQUESTED"
        | "COMMENTED"
        | "DISMISSED"
        | "PENDING"
      submittedAt: string
    }>
  }
  commits: {
    nodes: Array<{
      commit: {
        statusCheckRollup: {
          state: "SUCCESS" | "FAILURE" | "PENDING" | "EXPECTED" | "ERROR" | null
          contexts: {
            totalCount: number
            nodes: Array<
              | {
                  __typename: "CheckRun"
                  conclusion:
                    | "SUCCESS"
                    | "FAILURE"
                    | "NEUTRAL"
                    | "CANCELLED"
                    | "TIMED_OUT"
                    | "ACTION_REQUIRED"
                    | "SKIPPED"
                    | "STALE"
                    | null
                  status: string
                  name: string
                }
              | {
                  __typename: "StatusContext"
                  state: "EXPECTED" | "ERROR" | "FAILURE" | "PENDING" | "SUCCESS"
                  context: string
                }
            >
          }
        } | null
      }
    }>
  }
}

export interface GqlSnapshotResponse {
  viewer: { login: string; avatarUrl: string }
  mine:   { nodes: Array<GqlPr | null> }
  review: { nodes: Array<GqlPr | null> }
  rateLimit: { remaining: number; cost: number; resetAt: string }
}

export interface GqlViewerResponse {
  viewer: { login: string; avatarUrl: string }
}

export interface GqlRecheckResponse {
  nodes: Array<{
    id: string
    mergeable: "MERGEABLE" | "CONFLICTING" | "UNKNOWN" | null
  } | null>
}
