// Bitbucket Cloud REST 2.0 endpoint URL builders. Single source of truth so
// query encoding lives in one place.
//
// Reference: https://developer.atlassian.com/cloud/bitbucket/rest/intro/

export const BB_BASE = "https://api.bitbucket.org/2.0"

export const userUrl = (): string => `${BB_BASE}/user`

/**
 * Both `/2.0/workspaces` and `/2.0/user/permissions/workspaces` were retired
 * by Atlassian after the App Password sunset (return 410 Gone with scoped
 * API tokens). We no longer enumerate workspaces — the user declares one
 * workspace via the Options form, and we hit `/2.0/repositories/{workspace}`
 * directly. Helper kept to URL the single declared workspace if needed.
 */
export const workspaceUrl = (workspace: string): string =>
  `${BB_BASE}/workspaces/${encodeURIComponent(workspace)}`

export const reposUrl = (workspace: string, page = 1): string =>
  `${BB_BASE}/repositories/${encodeURIComponent(workspace)}` +
  `?role=member&page=${page}&pagelen=100`

/**
 * Per-repo combined "Mine + Review" query.
 *
 * `/2.0/pullrequests/{accountId}` (the cross-workspace authored-by-me endpoint)
 * was retired by Atlassian alongside App Passwords — it now returns 404. There
 * is no global "PRs for me" endpoint anymore. We iterate enabled repos in the
 * declared workspace with a single OR-combined `q` filter, so each repo costs
 * one request whether the PR is authored by us, requested for review by us,
 * or both. Mapper derives `fromTab` per PR by inspecting which side matched.
 */
export const prsForRepoUrl = (
  workspace: string,
  repo: string,
  accountId: string,
  page = 1
): string => {
  const q =
    `state="OPEN" AND ` +
    `(author.account_id="${accountId}" OR reviewers.account_id="${accountId}")`
  return (
    `${BB_BASE}/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repo)}/pullrequests` +
    `?q=${encodeURIComponent(q)}&page=${page}&pagelen=50`
  )
}

/** CI / status rollup for a single PR (Bitbucket Pipelines + 3rd-party). */
export const statusesUrl = (
  workspace: string,
  repo: string,
  prNumber: number
): string =>
  `${BB_BASE}/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(repo)}/pullrequests/${prNumber}/statuses?pagelen=50`
