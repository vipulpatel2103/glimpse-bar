import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react"
import { createPortal } from "react-dom"

const PopoverPortalContext = createContext<HTMLElement | null>(null)

interface PopoverPortalProviderProps {
  /** Portal host element. Render this somewhere outside any transformed
   *  / overflow-hidden ancestor so position:fixed popovers can escape
   *  the panel's clip box. */
  children: ReactNode
}

/**
 * Provider that exposes a single portal target shared by all popovers
 * (DatePopover, ListConfigMenu, etc.). The target itself is just a
 * `<div>` rendered as a sibling of the Glimpse Panel — it has no layout
 * footprint of its own.
 */
export function PopoverPortalProvider({
  children
}: PopoverPortalProviderProps) {
  const [host, setHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    return () => setHost(null)
  }, [])

  return (
    <PopoverPortalContext.Provider value={host}>
      {children}
      {/* Host renders AFTER children so portaled popovers paint above the
          panel when both share the same z-index (panel + popover both pin
          to 2147483647; same z-index → DOM order decides; later wins). */}
      <div
        ref={(el) => setHost(el)}
        // The data attribute tags this element as "logically part of the
        // panel" for outside-click handlers — anything portaled into here
        // (DatePopover, ContextMenu, ListConfigMenu) is a child of this
        // host in DOM but a peer of the panel in DOM order. Without this
        // marker, GlimpsePanel.onPointer would treat clicks on portaled
        // popovers as "outside" and dismiss the panel mid-interaction.
        data-glimpse-popover-host="true"
        // Layout-free anchor; popovers render with position:fixed.
        style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
        aria-hidden="true"
      />
    </PopoverPortalContext.Provider>
  )
}

/**
 * Render `children` into the shared popover portal. Falls back to
 * inline rendering if the provider hasn't mounted yet (first paint).
 */
export function PopoverPortal({ children }: { children: ReactNode }) {
  const host = useContext(PopoverPortalContext)
  if (!host) return <>{children}</>
  return createPortal(children, host)
}
