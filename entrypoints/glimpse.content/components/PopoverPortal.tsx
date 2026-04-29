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
      <div
        ref={(el) => setHost(el)}
        // Layout-free anchor; popovers render with position:fixed.
        style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
        aria-hidden="true"
      />
      {children}
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
