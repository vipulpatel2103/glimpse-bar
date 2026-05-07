// GitHub-specific state shapes.
// PR data itself lives in `lib/pr/types.ts` as the shared NormalizedPr.

/** `owner/repo` */
export type RepoKey = string

export interface RepoMeta {
  key: RepoKey
  enabled: boolean
  discoveredAt: number
}

export interface GitHubAuthState {
  /** PAT stored in sync: namespace. Never logged or echoed back to UI. */
  pat?: string
  login?: string
  avatarUrl?: string
  scopes?: string[]
}
