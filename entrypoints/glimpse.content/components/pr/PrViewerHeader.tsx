import { KeyRound } from "lucide-react"

import type { ProviderAdapter, ViewerInfo } from "~/lib/pr/adapter"
import { initialsOf } from "~/lib/pr/format"

interface Props {
  adapter: ProviderAdapter
  viewer: ViewerInfo | null
  theme: "light" | "dark"
}

export function PrViewerHeader({ adapter, viewer, theme }: Props) {
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const divider = theme === "dark"
    ? "rgba(255,255,255,0.06)"
    : "rgba(0,0,0,0.06)"

  if (!viewer) return null

  const onChangeCreds = () => {
    try {
      chrome.runtime?.sendMessage?.({
        type: "openOptionsPage",
        hash: adapter.optionsHash
      })
    } catch {
      // silent
    }
  }

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
      <ViewerAvatar
        displayName={viewer.displayName}
        avatarUrl={viewer.avatarUrl}
        theme={theme}
      />

      <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
        @{viewer.displayName}
      </span>

      <button
        type="button"
        onClick={onChangeCreds}
        title={adapter.changeCredsLabel}
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
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.color =
            theme === "dark" ? "#fafafa" : "#171717")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.color = muted)
        }
      >
        <KeyRound size={11} strokeWidth={2} aria-hidden="true" />
        {adapter.changeCredsLabel}
      </button>
    </div>
  )
}

function ViewerAvatar({
  displayName,
  avatarUrl,
  theme
}: {
  displayName: string
  avatarUrl?: string
  theme: "light" | "dark"
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`@${displayName}`}
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0
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
      {initialsOf(displayName)}
    </span>
  )
}
