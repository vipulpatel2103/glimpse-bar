// Raw Bitbucket Cloud REST 2.0 response types. Only api.ts should import these.
// Reference: https://developer.atlassian.com/cloud/bitbucket/rest/intro/

/** Standard paginated envelope. */
export interface BbPage<T> {
  values: T[]
  next?: string
  previous?: string
  page?: number
  pagelen?: number
  size?: number
}

export interface BbLink {
  href: string
  name?: string
}

export interface BbLinks {
  self?: BbLink
  html?: BbLink
  avatar?: BbLink
}

export interface BbAccount {
  type?: "user" | "team"
  account_id?: string
  uuid?: string
  username?: string
  nickname?: string
  display_name?: string
  links?: BbLinks
}

export interface BbViewer {
  account_id: string
  uuid: string
  nickname: string
  display_name: string
  links?: BbLinks
}

export interface BbWorkspaceRef {
  slug: string
  name: string
  uuid?: string
  type?: "workspace"
}

/**
 * Item in the /2.0/workspaces response. Each item IS the workspace —
 * not a membership wrapper like the deprecated /user/permissions/workspaces
 * endpoint returned.
 */
export type BbWorkspaceItem = BbWorkspaceRef

export interface BbRepoRef {
  type?: "repository"
  full_name: string  // workspace/repo
  name: string
  slug?: string
  workspace?: BbWorkspaceRef
  links?: BbLinks
}

export interface BbBranch {
  name: string
  type?: string
}

export interface BbCommitRef {
  hash: string
  type?: "commit"
  links?: BbLinks
}

export interface BbPrEndpoint {
  branch?: BbBranch
  commit?: BbCommitRef
  repository?: BbRepoRef
}

export interface BbParticipant {
  user: BbAccount
  role: "PARTICIPANT" | "REVIEWER"
  approved: boolean
  state: "approved" | "changes_requested" | null
  participated_on?: string
}

export interface BbPullRequestRaw {
  type?: "pullrequest"
  id: number
  title: string
  /** "OPEN" | "MERGED" | "DECLINED" | "SUPERSEDED" */
  state: string
  /** Bitbucket added `draft` field in 2024; absent on older PRs. */
  draft?: boolean
  created_on: string
  updated_on: string
  comment_count?: number
  task_count?: number
  links?: BbLinks
  source?: BbPrEndpoint
  destination?: BbPrEndpoint
  author?: BbAccount
  reviewers?: BbAccount[]
  participants?: BbParticipant[]
}

/** Per-PR /statuses response item. */
export interface BbStatusRaw {
  type?: "build"
  /** Bitbucket Pipelines or 3rd-party build state. */
  state: "INPROGRESS" | "SUCCESSFUL" | "FAILED" | "STOPPED"
  key?: string
  name?: string
  url?: string
  description?: string
  created_on?: string
  updated_on?: string
}
