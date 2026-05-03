import { useEffect, useRef, useState } from "react"

import {
  githubAuthItem,
  githubReposItem,
  githubUiItem
} from "~/lib/storage"
import { initialsOf } from "~/lib/github/format"
import type { GitHubAuthState, GitHubUiState, RepoMeta } from "~/lib/github/types"
import { useStorageItem } from "~/entrypoints/glimpse.content/hooks/useStorageItem"

// ── Types ──────────────────────────────────────────────────────────────────

type ConnectionMode = "connected" | "connecting"

interface TestResult {
  ok: boolean
  login?: string
  avatarUrl?: string
  scopes?: string[]
  missing?: string[]
  isFinegrained?: boolean
  error?: string
}

type GhMessage =
  | { type: "gh:testPat"; pat: string }
  | { type: "gh:sync"; manual?: boolean }
  | { type: "gh:disconnect" }

function sendGhMessage(msg: GhMessage): Promise<Record<string, unknown>> {
  return chrome.runtime.sendMessage(msg) as Promise<Record<string, unknown>>
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Avatar({
  url,
  login,
  size = 28
}: {
  url?: string
  login: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  const style = { width: size, height: size }

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={`@${login}`}
        title={`@${login}`}
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
      {initialsOf(login)}
    </span>
  )
}

function ScopeChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
      {label}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function GitHubSection() {
  const [auth, setAuth] = useStorageItem(githubAuthItem)
  const [repos, setRepos] = useStorageItem(githubReposItem)
  const [ui, setUi] = useStorageItem(githubUiItem)

  // Determine initial mode based on whether a PAT is stored.
  // Start as 'connecting' — switches to 'connected' once auth loads (see effect).
  const [mode, setMode] = useState<ConnectionMode>("connecting")
  const wasConnectedRef = useRef(false)

  useEffect(() => {
    if (auth.pat) {
      setMode("connected")
      wasConnectedRef.current = true
    }
  }, [auth.pat])

  // Local form state
  const [patInput, setPatInput] = useState("")
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Scroll into view when deep-linked via #github hash.
  const sectionRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (window.location.hash === "#github") {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  // ── Handlers ────────────────────────────────────────────────────────────

  async function handleTest() {
    if (!patInput.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await sendGhMessage({ type: "gh:testPat", pat: patInput.trim() })
      setTestResult(res as unknown as TestResult)
    } catch {
      setTestResult({ ok: false, error: "Could not reach the background service worker" })
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    if (!testResult?.ok || !testResult.login) return
    setSaving(true)
    try {
      const next: GitHubAuthState = {
        pat:      patInput.trim(),
        login:    testResult.login,
        avatarUrl: testResult.avatarUrl,
        scopes:   testResult.scopes ?? []
      }
      await setAuth(next)
      await sendGhMessage({ type: "gh:sync", manual: true })
      setPatInput("")
      setTestResult(null)
      setMode("connected")
      wasConnectedRef.current = true
    } finally {
      setSaving(false)
    }
  }

  function handleChangePat() {
    setPatInput("")
    setTestResult(null)
    setMode("connecting")
  }

  function handleCancelChange() {
    setPatInput("")
    setTestResult(null)
    setMode("connected")
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await sendGhMessage({ type: "gh:disconnect" })
      // Clear local auth — storage watcher will fire, but update immediately.
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
    await sendGhMessage({ type: "gh:sync", manual: true })
    // Re-enable after 2 s regardless (the actual sync updates lastSyncAt via storage).
    setTimeout(() => setSyncing(false), 2000)
  }

  async function handleIntervalChange(minutes: number) {
    await setUi({ ...(ui as GitHubUiState), refreshIntervalMin: minutes })
  }

  async function handleRepoToggle(key: string) {
    await setRepos(
      (repos as RepoMeta[]).map((r) =>
        r.key === key ? { ...r, enabled: !r.enabled } : r
      )
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const uiState = ui as GitHubUiState
  const authState = auth as GitHubAuthState
  const repoList = repos as RepoMeta[]

  const lastSyncText = uiState.lastSyncAt
    ? new Date(uiState.lastSyncAt).toLocaleString()
    : null

  return (
    <section ref={sectionRef} id="github">
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        GitHub
      </h2>

      {/* ── Connection ─────────────────────────────────────────────────── */}
      {mode === "connected" && authState.login ? (
        <ConnectedRow
          login={authState.login}
          avatarUrl={authState.avatarUrl}
          scopes={authState.scopes ?? []}
          onChangePat={handleChangePat}
          onDisconnect={() => setShowConfirm(true)}
        />
      ) : (
        <ConnectingForm
          patInput={patInput}
          onPatChange={setPatInput}
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
            This will clear your PAT, all cached PRs, and repo settings.
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

      {/* ── Refresh interval ───────────────────────────────────────────── */}
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

      {/* ── Repos ─────────────────────────────────────────────────────── */}
      <div className="mt-4">
        <p className="mb-1.5 text-[13px] font-medium text-neutral-600 dark:text-neutral-400">
          Repositories (auto-discovered)
        </p>
        {repoList.length === 0 ? (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            No repos discovered yet — sync to populate.
          </p>
        ) : (
          <ul className="max-h-60 overflow-y-auto space-y-1">
            {repoList.map((r) => (
              <li key={r.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  id={`repo-${r.key}`}
                  checked={r.enabled}
                  onChange={() => void handleRepoToggle(r.key)}
                  className="accent-blue-500"
                />
                <label
                  htmlFor={`repo-${r.key}`}
                  className="flex-1 cursor-pointer font-mono text-[12px]"
                >
                  {r.key}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Sync status ────────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 dark:text-neutral-500">
        {lastSyncText ? (
          <span>Last sync: {lastSyncText}</span>
        ) : (
          <span>Not synced yet</span>
        )}
        {uiState.lastSyncError && (
          <span className="text-red-500 dark:text-red-400" title={uiState.lastSyncError}>
            ✗ Sync error
          </span>
        )}
        {authState.pat && (
          <button
            onClick={() => void handleSyncNow()}
            disabled={syncing}
            className="rounded-md border border-neutral-200 px-2 py-0.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        )}
      </div>
    </section>
  )
}

// ── Connected row ──────────────────────────────────────────────────────────

function ConnectedRow({
  login,
  avatarUrl,
  scopes,
  onChangePat,
  onDisconnect
}: {
  login: string
  avatarUrl?: string
  scopes: string[]
  onChangePat: () => void
  onDisconnect: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
      <Avatar url={avatarUrl} login={login} size={28} />
      <span className="flex-1 text-sm font-medium">@{login}</span>
      <div className="flex flex-wrap gap-1">
        {scopes.length > 0
          ? scopes.map((s) => <ScopeChip key={s} label={s} />)
          : <ScopeChip label="fine-grained" />}
      </div>
      <button
        onClick={onChangePat}
        className="text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
      >
        Change PAT
      </button>
      <button
        onClick={onDisconnect}
        className="text-xs text-red-500 underline-offset-2 hover:underline dark:text-red-400"
      >
        Disconnect
      </button>
    </div>
  )
}

// ── Connecting form ────────────────────────────────────────────────────────

function ConnectingForm({
  patInput,
  onPatChange,
  testing,
  onTest,
  testResult,
  saving,
  onSave,
  showCancel,
  onCancel
}: {
  patInput: string
  onPatChange: (v: string) => void
  testing: boolean
  onTest: () => void
  testResult: TestResult | null
  saving: boolean
  onSave: () => void
  showCancel: boolean
  onCancel: () => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-[13px] font-medium">
          Personal Access Token
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="ghp_…"
            value={patInput}
            onChange={(e) => onPatChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !testing && void onTest()}
            autoComplete="off"
            spellCheck={false}
            className="flex-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            onClick={() => void onTest()}
            disabled={!patInput.trim() || testing}
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          >
            {testing ? "Testing…" : "Test connection"}
          </button>
        </div>
      </div>

      {/* Test result status */}
      {testResult && (
        <TestResultRow result={testResult} />
      )}

      {/* Actions */}
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
        Create a token at{" "}
        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          github.com/settings/tokens
        </a>
        {" "}with <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">repo</code> scope (or <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">public_repo</code> for public repos only).
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
        ✓ Connected as @{result.login}
      </p>
      {result.missing && result.missing.length > 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          ⚠ Missing scope:{" "}
          <code className="rounded bg-amber-50 px-1 dark:bg-amber-950/20">
            {result.missing.join(", ")}
          </code>
        </p>
      )}
      {result.isFinegrained && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Fine-grained token detected. Ensure read access to <em>Pull requests</em>, <em>Contents</em>, and <em>Metadata</em>.
        </p>
      )}
    </div>
  )
}
