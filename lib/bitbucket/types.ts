// Bitbucket-specific state shapes.
// PR data itself lives in `lib/pr/types.ts` as the shared NormalizedPr.

export type BbWorkspaceSlug = string

/** `workspace/repo` */
export type BbRepoKey = string

export interface BbWorkspaceMeta {
  slug: BbWorkspaceSlug
  name: string
  /** Explicit opt-in. Newly-discovered workspaces start `false`. */
  enabled: boolean
  discoveredAt: number
}

export interface BbRepoMeta {
  key: BbRepoKey
  workspace: BbWorkspaceSlug
  enabled: boolean
  discoveredAt: number
}

export interface BbAuthState {
  /** Workspace slug declared in the Options form. */
  workspace?: BbWorkspaceSlug
  /** Bitbucket username (URL slug). */
  username?: string
  /** App Password or Workspace/Repo Access Token. Stored in `sync:` namespace. */
  token?: string
  /** Resolved on Test connection — stable identifier used by the API. */
  accountId?: string
  /** Public username — preferred for display + initials fallback. */
  nickname?: string
  displayName?: string
  avatarUrl?: string
}
