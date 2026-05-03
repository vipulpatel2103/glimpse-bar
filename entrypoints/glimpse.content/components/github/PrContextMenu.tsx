import { Copy, ExternalLink, Eye, EyeOff, GitBranch } from "lucide-react"

import type { PullRequest } from "~/lib/github/types"
import {
  ContextMenu,
  type ContextMenuAnchor,
  type ContextMenuItem
} from "../todo/ContextMenu"

interface Props {
  pr: PullRequest | null
  open: boolean
  anchor: ContextMenuAnchor | null
  isHidden: boolean
  theme: "light" | "dark"
  onClose: () => void
  onHide: () => void
  onUnhide: () => void
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for http pages where clipboard API requires secure context.
    const el = document.createElement("textarea")
    el.value = text
    el.style.cssText = "position:fixed;opacity:0;pointer-events:none"
    document.body.appendChild(el)
    el.select()
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand("copy")
    document.body.removeChild(el)
  }
}

export function PrContextMenu({
  pr,
  open,
  anchor,
  isHidden,
  theme,
  onClose,
  onHide,
  onUnhide
}: Props) {
  if (!pr) return null

  const items: ContextMenuItem[] = [
    {
      id: "open",
      label: "Open in GitHub",
      Icon: ExternalLink,
      onClick: () => {
        window.open(pr.url, "_blank", "noopener,noreferrer")
        onClose()
      }
    },
    {
      id: "copy-link",
      label: "Copy PR link",
      Icon: Copy,
      onClick: () => {
        void copyText(pr.url)
        onClose()
      }
    },
    {
      id: "copy-branch",
      label: "Copy branch name",
      Icon: GitBranch,
      onClick: () => {
        void copyText(pr.headRef)
        onClose()
      }
    },
    {
      id: "hide",
      label: isHidden ? "Unhide PR" : "Hide PR",
      Icon: isHidden ? Eye : EyeOff,
      separatorBefore: true,
      onClick: () => {
        if (isHidden) onUnhide()
        else onHide()
        onClose()
      }
    }
  ]

  return (
    <ContextMenu
      open={open}
      onClose={onClose}
      anchor={anchor}
      items={items}
      theme={theme}
    />
  )
}
