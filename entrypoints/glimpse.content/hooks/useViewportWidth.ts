import { useEffect, useState } from "react"

/**
 * Returns the current document layout viewport width and re-renders on
 * resize. Uses `document.documentElement.clientWidth` (excludes the page
 * scrollbar on Windows Chrome — see CLAUDE.md "Viewport math").
 */
export function useViewportWidth(): number {
  const [vw, setVw] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.clientWidth
      : 1024
  )
  useEffect(() => {
    const onResize = () => setVw(document.documentElement.clientWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  return vw
}
