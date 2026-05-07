import { useEffect, useMemo, useRef, useState } from "react"

import {
  bitbucketAuthItem,
  bitbucketReposItem,
  bitbucketUiItem
} from "~/lib/storage"
import { initialsOf } from "~/lib/pr/format"
import type { PrUiState } from "~/lib/pr/types"
import type { BbAuthState, BbRepoMeta } from "~/lib/bitbucket/types"
import { useStorageItem } from "~/entrypoints/glimpse.content/hooks/useStorageItem"

// ── Types ──────────────────────────────────────────────────────────────────

type ConnectionMode = "connected" | "connecting"

interface TestResult {
  ok: boolean
  accountId?: string
  uuid?: string
  nickname?: string
  displayName?: string
  avatarUrl?: string
  missing?: string[]
  error?: string
}

type BbMessage =
  | { type: "bb:testCreds"; workspace: string; username: string; token: string }
  | { type: "bb:seedWorkspace" }
  | { type: "bb:listRepos"; workspace: string }
  | { type: "bb:sync"; manual?: boolean }
  | { type: "bb:disconnect" }

function sendBbMessage(msg: BbMessage): Promise<Record<string, unknown>> {
  return chrome.runtime.sendMessage(msg) as Promise<Record<string, unknown>>
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Avatar({
  url,
  nickname,
  size = 28
}: {
  url?: string
  nickname: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  const style = { width: size, height: size }

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={`@${nickname}`}
        title={`@${nickname}`}
        style={style}
        className="rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span
      style={style}
      className="inline-flex items-center justify-center rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
    >
      {initialsOf(nickname)}
    </span>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
      {label}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function BitbucketSection() {
  const [auth, setAuth] = useStorageItem(bitbucketAuthItem)
  const [repos, setRepos] = useStorageItem(bitbucketReposItem)
  const [ui, setUi] = useStorageItem(bitbucketUiItem)

  const [mode, setMode] = useState<ConnectionMode>("connecting")
  const wasConnectedRef = useRef(false)

  useEffect(() => {
    if (auth.token) {
      setMode("connected")
      wasConnectedRef.current = true
    }
  }, [auth.token])

  // Local form state
  const [workspaceInput, setWorkspaceInput] = useState("")
  const [usernameInput, setUsernameInput] = useState("")
  const [tokenInput, setTokenInput] = useState("")
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Pre-populate workspace + username when entering Change credentials mode.
  useEffect(() => {
    if (mode === "connecting" && wasConnectedRef.current) {
      setWorkspaceInput(auth.workspace ?? "")
      setUsernameInput(auth.username ?? "")
      setTokenInput("")
    }
  }, [mode, auth.workspace, auth.username])

  // Scroll into view when deep-linked via #bitbucket hash.
  const sectionRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (window.location.hash === "#bitbucket") {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  // ── Handlers ────────────────────────────────────────────────────────────

  async function handleTest() {
    if (!workspaceInput.trim() || !usernameInput.trim() || !tokenInput.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await sendBbMessage({
        type:      "bb:testCreds",
        workspace: workspaceInput.trim(),
        username:  usernameInput.trim(),
        token:     tokenInput.trim()
      })
      setTestResult(res as unknown as TestResult)
    } catch {
      setTestResult({ ok: false, error: "Could not reach the background service worker" })
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    if (!testResult?.ok || !testResult.accountId) return
    setSaving(true)
    try {
      const next: BbAuthState = {
        workspace:   workspaceInput.trim(),
        username:    usernameInput.trim(),
        token:       tokenInput.trim(),
        accountId:   testResult.accountId,
        nickname:    testResult.nickname,
        displayName: testResult.displayName,
        avatarUrl:   testResult.avatarUrl
      }
      await setAuth(next)
      // Seed the single declared workspace + auto-enumerate its repos.
      // No discovery — Atlassian retired /2.0/workspaces (410 Gone).
      await sendBbMessage({ type: "bb:seedWorkspace" })
      setTokenInput("")
      setTestResult(null)
      setMode("connected")
      wasConnectedRef.current = true
    } finally {
      setSaving(false)
    }
  }

  function handleChangeCreds() {
    setTokenInput("")
    setTestResult(null)
    setMode("connecting")
  }

  function handleCancelChange() {
    setTokenInput("")
    setTestResult(null)
    setMode("connected")
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await sendBbMessage({ type: "bb:disconnect" })
      await setAuth({})
      setMode("connecting")
      wasConnectedRef.current = false
      setShowConfirm(false)
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleSyncNow() {
    setSyncing(true)
    await sendBbMessage({ type: "bb:sync", manual: true })
    setTimeout(() => setSyncing(false), 2000)
  }

  async function handleIntervalChange(minutes: number) {
    await setUi({ ...(ui as PrUiState), refreshIntervalMin: minutes })
  }

  async function handleRepoToggle(key: string) {
    await setRepos(
      (repos as BbRepoMeta[]).map((r) =>
        r.key === key ? { ...r, enabled: !r.enabled } : r
      )
    )
  }

  async function handleSelectAllRepos(enabled: boolean) {
    await setRepos(
      (repos as BbRepoMeta[]).map((r) => ({ ...r, enabled }))
    )
  }

  async function handleRefreshRepos() {
    // Re-enumerate repos for the connected workspace.
    await sendBbMessage({ type: "bb:seedWorkspace" })
  }

  // ── Derived state ───────────────────────────────────────────────────────

  const uiState = ui as PrUiState
  const authState = auth as BbAuthState
  const repoList = repos as BbRepoMeta[]

  const enabledRepoCount = useMemo(
    () => repoList.filter((r) => r.enabled).length,
    [repoList]
  )

  // Heavy-budget warning: ~2 requests per repo per sync (review + statuses) +
  // 2 fixed (viewer + mine). Approximation good enough for the user-facing hint.
  const projectedReqPerHour = useMemo(() => {
    const intervalsPerHour = 60 / Math.max(1, uiState.refreshIntervalMin ?? 5)
    return Math.round((enabledRepoCount * 2 + 2) * intervalsPerHour)
  }, [enabledRepoCount, uiState.refreshIntervalMin])

  const lastSyncText = uiState.lastSyncAt
    ? new Date(uiState.lastSyncAt).toLocaleString()
    : null

  return (
    <section ref={sectionRef} id="bitbucket">
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Bitbucket
      </h2>

      {/* ── Connection ─────────────────────────────────────────────────── */}
      {mode === "connected" && authState.nickname ? (
        <ConnectedRow
          nickname={authState.nickname}
          avatarUrl={authState.avatarUrl}
          workspace={authState.workspace ?? ""}
          username={authState.username ?? ""}
          onChangeCreds={handleChangeCreds}
          onDisconnect={() => setShowConfirm(true)}
        />
      ) : (
        <ConnectingForm
          workspaceInput={workspaceInput}
          onWorkspaceChange={setWorkspaceInput}
          usernameInput={usernameInput}
          onUsernameChange={setUsernameInput}
          tokenInput={tokenInput}
          onTokenChange={setTokenInput}
          testing={testing}
          onTest={handleTest}
          testResult={testResult}
          saving={saving}
          onSave={handleSave}
          showCancel={wasConnectedRef.current}
          onCancel={handleCancelChange}
        />
      )}

      {/* ── Disconnect confirm ─────────────────────────────────────────── */}
      {showConfirm && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-red-700 dark:text-red-300">
            This will clear your credentials, all cached PRs, workspaces, and repo settings.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              onClick={() => void handleDisconnect()}
              disabled={disconnecting}
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
            <button
              className="rounded-md border border-neutral-200 px-3 py-1 text-xs font-medium dark:border-neutral-700"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "connected" && authState.nickname && (
        <>
          {/* ── Refresh interval ───────────────────────────────────────── */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm font-medium">Refresh every</span>
            <select
              value={uiState.refreshIntervalMin ?? 5}
              onChange={(e) => void handleIntervalChange(Number(e.target.value))}
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              {[1, 5, 15, 30, 60].map((m) => (
                <option key={m} value={m}>
                  {m} {m === 1 ? "minute" : "minutes"}
                </option>
              ))}
            </select>
          </div>
          {projectedReqPerHour > 800 && (
            <p className="mt-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
              ⚠ Heavy: ~{projectedReqPerHour.toLocaleString()} req/hr · consider a longer interval (limit is 1,000/hr per user).
            </p>
          )}

          {/* ── Repos (auto-discovered for connected workspace) ────────── */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[13px] font-medium text-neutral-600 dark:text-neutral-400">
                Repositories (select to start syncing)
              </p>
              <div className="flex items-center gap-3">
                {repoList.length > 0 && (
                  <>
                    <button
                      onClick={() => void handleSelectAllRepos(true)}
                      className="text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
                    >
                      Select all
                    </button>
                    <button
                      onClick={() => void handleSelectAllRepos(false)}
                      className="text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
                    >
                      Select none
                    </button>
                  </>
                )}
                <button
                  onClick={() => void handleRefreshRepos()}
                  className="text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
                >
                  Refresh
                </button>
              </div>
            </div>
            {repoList.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                No repos discovered yet — click Refresh, or run Sync now.
              </p>
            ) : (
              <>
                <p className="mb-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                  Newly-discovered repos default to off. Tick the ones you want
                  to track ({enabledRepoCount} of {repoList.length} selected).
                </p>
                <ul className="max-h-60 space-y-1 overflow-y-auto">
                  {repoList.map((r) => (
                    <li key={r.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        id={`bb-repo-${r.key}`}
                        checked={r.enabled}
                        onChange={() => void handleRepoToggle(r.key)}
                        className="accent-blue-500"
                      />
                      <label
                        htmlFor={`bb-repo-${r.key}`}
                        className="flex-1 cursor-pointer font-mono text-[12px]"
                      >
                        {r.key}
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* ── Sync status ────────────────────────────────────────────── */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 dark:text-neutral-500">
            {lastSyncText ? (
              <span>Last sync: {lastSyncText}</span>
            ) : (
              <span>Not synced yet</span>
            )}
            {uiState.lastSyncError && (
              <span className="text-red-500 dark:text-red-400" title={uiState.lastSyncError}>
                ✗ {uiState.lastSyncError}
              </span>
            )}
            <button
              onClick={() => void handleSyncNow()}
              disabled={syncing}
              className="rounded-md border border-neutral-200 px-2 py-0.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {syncing ? "Syncing…" : "Sync now"}
            </button>
          </div>
        </>
      )}

      <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
        Bitbucket Cloud only. Bitbucket Server / Data Center is not supported.
      </p>
    </section>
  )
}

// ── Connected row ──────────────────────────────────────────────────────────

function ConnectedRow({
  nickname,
  avatarUrl,
  workspace,
  username,
  onChangeCreds,
  onDisconnect
}: {
  nickname: string
  avatarUrl?: string
  workspace: string
  username: string
  onChangeCreds: () => void
  onDisconnect: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
      <Avatar url={avatarUrl} nickname={nickname} size={28} />
      <span className="text-sm font-medium">@{nickname}</span>
      <div className="flex flex-wrap gap-1">
        {workspace && <Chip label={`workspace: ${workspace}`} />}
        {username && <Chip label={username} />}
      </div>
      <div className="ml-auto flex gap-3">
        <button
          onClick={onChangeCreds}
          className="text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
        >
          Change credentials
        </button>
        <button
          onClick={onDisconnect}
          className="text-xs text-red-500 underline-offset-2 hover:underline dark:text-red-400"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}

// ── Connecting form ────────────────────────────────────────────────────────

function ConnectingForm({
  workspaceInput,
  onWorkspaceChange,
  usernameInput,
  onUsernameChange,
  tokenInput,
  onTokenChange,
  testing,
  onTest,
  testResult,
  saving,
  onSave,
  showCancel,
  onCancel
}: {
  workspaceInput: string
  onWorkspaceChange: (v: string) => void
  usernameInput: string
  onUsernameChange: (v: string) => void
  tokenInput: string
  onTokenChange: (v: string) => void
  testing: boolean
  onTest: () => void
  testResult: TestResult | null
  saving: boolean
  onSave: () => void
  showCancel: boolean
  onCancel: () => void
}) {
  const ready =
    workspaceInput.trim() !== "" &&
    usernameInput.trim() !== "" &&
    tokenInput.trim() !== ""

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-[13px] font-medium">Workspace</label>
        <input
          type="text"
          placeholder="e.g. acme-corp"
          value={workspaceInput}
          onChange={(e) => onWorkspaceChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-[13px] font-medium">Email</label>
        <input
          type="email"
          placeholder="your Atlassian account email"
          value={usernameInput}
          onChange={(e) => onUsernameChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-[13px] font-medium">
          API Token{" "}
          <span className="font-normal text-neutral-400 dark:text-neutral-500">
            (with Bitbucket scopes)
          </span>
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="ATATT…"
            value={tokenInput}
            onChange={(e) => onTokenChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ready && !testing && void onTest()}
            autoComplete="off"
            spellCheck={false}
            className="flex-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            onClick={() => void onTest()}
            disabled={!ready || testing}
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          >
            {testing ? "Testing…" : "Test connection"}
          </button>
        </div>
      </div>

      {testResult && <TestResultRow result={testResult} />}

      <div className="flex gap-2">
        <button
          onClick={() => void onSave()}
          disabled={!testResult?.ok || saving}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save & sync"}
        </button>
        {showCancel && (
          <button
            onClick={onCancel}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium dark:border-neutral-700"
          >
            Cancel
          </button>
        )}
      </div>

      <p className="text-xs text-neutral-400 dark:text-neutral-500">
        Create a scoped API token at{" "}
        <a
          href="https://id.atlassian.com/manage-profile/security/api-tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          id.atlassian.com/manage-profile/security/api-tokens
        </a>{" "}
        with these Bitbucket scopes:{" "}
        <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">read:user:bitbucket</code>,{" "}
        <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">read:workspace:bitbucket</code>,{" "}
        <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">read:repository:bitbucket</code>,{" "}
        <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">read:pullrequest:bitbucket</code>.
        Atlassian retired App Passwords on 2025-09-09; existing ones are disabled on 2026-06-09.
      </p>
    </div>
  )
}

function TestResultRow({ result }: { result: TestResult }) {
  if (!result.ok) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        ✗ {result.error}
      </p>
    )
  }
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
        ✓ Connected as @{result.nickname}
      </p>
      {result.missing && result.missing.length > 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          ⚠ Token missing scope:{" "}
          <code className="rounded bg-amber-50 px-1 dark:bg-amber-950/20">
            {result.missing.join(", ")}
          </code>
        </p>
      )}
    </div>
  )
}

