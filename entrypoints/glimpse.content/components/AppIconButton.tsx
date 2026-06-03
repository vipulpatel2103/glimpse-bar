import type { LucideIcon } from "lucide-react"
import {
  forwardRef,
  type ForwardedRef,
  type KeyboardEvent,
  type MouseEvent
} from "react"

interface AppIconButtonProps {
  /** Lucide icon — used when `iconUrl` is not set. */
  Icon?: LucideIcon
  /** Raster/SVG image URL for brand-mark icons. Takes precedence over `Icon`. */
  iconUrl?: string
  label: string
  isActive?: boolean
  theme: "light" | "dark"
  badgeDot?: boolean
  onActivate: () => void
  /**
   * Shift+click handler. When set and the user holds Shift, this fires with the
   * tile element (for popover anchoring) instead of `onActivate`. Used by Notes
   * for the bar quick-compose surface.
   */
  onShiftActivate?: (anchor: HTMLElement) => void
  onArrowKey?: (dir: "up" | "down") => void
}

function AppIconButtonInner(
  {
    Icon,
    iconUrl,
    label,
    isActive = false,
    theme,
    badgeDot = false,
    onActivate,
    onShiftActivate,
    onArrowKey
  }: AppIconButtonProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.shiftKey && onShiftActivate) {
      e.preventDefault()
      onShiftActivate(e.currentTarget)
      return
    }
    onActivate()
  }
  const handleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onActivate()
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      onArrowKey?.("down")
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      onArrowKey?.("up")
    }
  }

  const tileBg =
    theme === "dark"
      ? "rgba(255, 255, 255, 0.10)"
      : "rgba(255, 255, 255, 0.95)"
  const tileBorder =
    theme === "dark"
      ? "rgba(255, 255, 255, 0.14)"
      : "rgba(0, 0, 0, 0.08)"
  const iconColor = theme === "dark" ? "#fafafa" : "#171717"

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-pressed={isActive}
        onClick={handleClick}
        onKeyDown={handleKey}
        style={{
          backgroundColor: tileBg,
          border: `1px solid ${tileBorder}`,
          color: iconColor,
          boxShadow: isActive
            ? "0 0 0 2px #3b82f6, 0 1px 3px rgba(0,0,0,0.2)"
            : "0 1px 3px rgba(0,0,0,0.2)"
        }}
        className={
          "flex h-9 w-9 items-center justify-center rounded-full " +
          "transition-transform duration-100 " +
          "hover:brightness-110 active:scale-[0.94] " +
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-900"
        }>
        {iconUrl ? (
          <img
            src={iconUrl}
            alt=""
            aria-hidden="true"
            style={{
              width: 18,
              height: 18,
              objectFit: "contain",
              pointerEvents: "none"
            }}
          />
        ) : Icon ? (
          <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
        ) : null}
      </button>

      {badgeDot && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 1,
            right: 1,
            width: 9,
            height: 9,
            borderRadius: "50%",
            backgroundColor: "#3b82f6",
            border: "2px solid rgba(15,15,15,0.9)",
            pointerEvents: "none",
            zIndex: 1
          }}
        />
      )}
    </div>
  )
}

export const AppIconButton = forwardRef(AppIconButtonInner)
