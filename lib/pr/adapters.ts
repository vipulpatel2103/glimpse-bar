// Adapter registry indexed by ProviderId. Adding GitLab / Azure later =
// import their adapter here and assign the slot. Zero touches to
// components/pr/.

import { bitbucketAdapter } from "../bitbucket/adapter"
import { githubAdapter } from "../github/adapter"
import type { ProviderAdapter } from "./adapter"
import type { ProviderId } from "./types"

export const ADAPTERS: Record<ProviderId, ProviderAdapter | undefined> = {
  github:    githubAdapter,
  bitbucket: bitbucketAdapter,
  gitlab:    undefined, // Phase 02.3
  azure:     undefined  // Phase 02.4
}
