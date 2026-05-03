// Background-SW sync orchestrator. Runs in the service worker only.
// Reads/writes storage; calls api.ts for network.

import { RateLimitError, fetchPrSnapshot, recheckMergeableWithMap } from "./api"
import { mergePrs, patchMergeState } from "./mutations"
import { discoverRepos } from "./selectors"
import {
  githubAuthItem,
  githubHiddenItem,
  githubPrsItem,
  githubReposItem,
  githubUiItem
} from "../storage"
import type { PrId } from "./types"

export interface SyncOptions {
  manual: boolean
}

/**
 * Full PR sync. Designed to be called from the background SW — either by a
 * `chrome.alarms` tick or by a `gh:sync` message from content/options.
 *
 * - No-ops silently if no PAT is stored.
 * - On success: updates `githubPrsItem`, `githubReposItem`, `githubAuthItem`,
 *   `githubUiItem.lastSyncAt`, clears `lastSyncError` / `rateLimitResetAt`.
 * - On error: persists `lastSyncError` (and `rateLimitResetAt` for rate limits).
 *   Never clobbers the existing PR cache.
 */
export async function runSync(_opts: SyncOptions): Promise<void> {
  const auth = await githubAuthItem.getValue()
  if (!auth.pat) return

  try {
    const { viewer, prs, unknownMergeableNodeIds } =
      await fetchPrSnapshot(auth.pat)

    const existing = await githubPrsItem.getValue()
    const merged   = mergePrs(existing, prs)
    await githubPrsItem.setValue(merged)

    const existingRepos = await githubReposItem.getValue()
    await githubReposItem.setValue(discoverRepos(merged, existingRepos))

    // Refresh viewer info in case display name / avatar changed.
    await githubAuthItem.setValue({
      ...auth,
      login:     viewer.login,
      avatarUrl: viewer.avatarUrl
    })

    await githubUiItem.setValue({
      ...(await githubUiItem.getValue()),
      lastSyncAt:        Date.now(),
      lastSyncError:     undefined,
      rateLimitResetAt:  undefined
    })

    // Resolve UNKNOWN mergeability after a short delay.
    if (unknownMergeableNodeIds.length > 0) {
      void recheckUnknown(auth.pat, unknownMergeableNodeIds)
    }
  } catch (err) {
    const ui = await githubUiItem.getValue()
    if (err instanceof RateLimitError) {
      await githubUiItem.setValue({
        ...ui,
        lastSyncError:    "Rate limited by GitHub",
        rateLimitResetAt: err.resetAt
      })
    } else {
      await githubUiItem.setValue({
        ...ui,
        lastSyncError: err instanceof Error ? err.message : String(err)
      })
    }
    // PR cache intentionally untouched on failure.
  }
}

async function recheckUnknown(pat: string, nodeIds: string[]): Promise<void> {
  await delay(8_000)

  try {
    const prs = await githubPrsItem.getValue()

    // Build a nodeId → PrId map.
    // We stored the PrId as `repo#number` in api.ts. The nodeIds were collected
    // from the same sync pass — we can match them back by looking for PRs that
    // currently have mergeState === 'unknown'.
    // For a more precise match we build the map from the snapshot's unknownNodeIds
    // order: the fetchPrSnapshot function emits nodeIds in allNodes order, which
    // corresponds to the prs array order at the time of the snapshot.
    // Since `prs` may have been updated by a concurrent sync, we match conservatively
    // by finding PRs with mergeState 'unknown' and mapping them to their computed
    // PrIds — the nodeId→PrId relationship is stable for the life of a PR.
    //
    // Because we don't store nodeIds, we rely on a lightweight secondary query:
    // recheckMergeableWithMap uses a map built here. We can't build a perfect map
    // without storing nodeIds, so we accept that some UNKNOWN states may persist
    // until the next full sync (once per refreshInterval), which is acceptable.
    const unknownPrs = prs.filter((p) => p.mergeState === "unknown")
    if (unknownPrs.length === 0) return

    // Build a best-effort nodeId → PrId map. We pass the nodeIds in the same
    // order they were collected; try to match by position to unknown PRs.
    const nodeIdToPrId = new Map<string, PrId>()
    for (let i = 0; i < nodeIds.length && i < unknownPrs.length; i++) {
      nodeIdToPrId.set(nodeIds[i], unknownPrs[i].id)
    }

    const patches = await recheckMergeableWithMap(pat, nodeIds, nodeIdToPrId)
    if (patches.length === 0) return

    const current = await githubPrsItem.getValue()
    await githubPrsItem.setValue(patchMergeState(current, patches))
  } catch {
    // Non-critical: if this fails the user sees UNKNOWN until the next full sync.
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
