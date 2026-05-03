import { KeyRound } from "lucide-react"

import { initialsOf } from "~/lib/github/format"
import type { GitHubAuthState } from "~/lib/github/types"

interface Props {
  auth: GitHubAuthState
  theme: "light" | "dark"
}

function openOptionsGithub() {
  try {
    chrome.runtime?.sendMessage?.({ type: "openOptionsPage", hash: "github" })
  } catch {
    // silent — options page will open on next attempt
  }
}

export function PrViewerHeader({ auth, theme }: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const divider = theme === "dark"
    ? "rgba(255,255,255,0.06)"
    : "rgba(0,0,0,0.06)"

  if (!auth.login) return null

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderBottom: `1px solid ${divider}`,
        flexShrink: 0
      }}
    >
      {/* Avatar */}
      <ViewerAvatar login={auth.login} avatarUrl={auth.avatarUrl} theme={theme} />

      {/* @login */}
      <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
        @{auth.login}
      </span>

      {/* Change PAT link */}
      <button
        type="button"
        onClick={openOptionsGithub}
        title="Change Personal Access Token"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          fontSize: 11,
          fontWeight: 500,
          color: muted,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          textDecoration: "none",
          flexShrink: 0
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = theme === "dark" ? "#fafafa" : "#171717")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = muted)}
      >
        <KeyRound size={11} strokeWidth={2} aria-hidden="true" />
        Change PAT
      </button>
    </div>
  )
}

function ViewerAvatar({
  login,
  avatarUrl,
  theme
}: {
  login: string
  avatarUrl?: string
  theme: "light" | "dark"
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`@${login}`}
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0
        }}
        onError={(e) => {
          // Swap to initials span on failure.
          const span = document.createElement("span")
          span.textContent = initialsOf(login)
          span.style.cssText = (e.currentTarget as HTMLElement).style.cssText
          span.style.display = "inline-flex"
          span.style.alignItems = "center"
          span.style.justifyContent = "center"
          span.style.fontSize = "9px"
          span.style.fontWeight = "600"
          span.style.backgroundColor = theme === "dark" ? "#262626" : "#e5e5e5"
          span.style.color = theme === "dark" ? "#a3a3a3" : "#525252"
          ;(e.currentTarget as HTMLElement).replaceWith(span)
        }}
      />
    )
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: "50%",
        backgroundColor: theme === "dark" ? "#262626" : "#e5e5e5",
        fontSize: 9,
        fontWeight: 600,
        color: theme === "dark" ? "#a3a3a3" : "#525252",
        flexShrink: 0
      }}
    >
      {initialsOf(login)}
    </span>
  )
}
