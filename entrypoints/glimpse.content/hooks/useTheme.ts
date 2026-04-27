import { useEffect, useState } from "react"

const prefersDark = () => {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function useTheme(): "light" | "dark" {
  const [isDark, setIsDark] = useState<boolean>(prefersDark())

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const m = window.matchMedia("(prefers-color-scheme: dark)")
    const fn = (e: MediaQueryListEvent) => setIsDark(e.matches)
    m.addEventListener("change", fn)
    return () => m.removeEventListener("change", fn)
  }, [])

  return isDark ? "dark" : "light"
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  })

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const m = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches)
    m.addEventListener("change", fn)
    return () => m.removeEventListener("change", fn)
  }, [])

  return reduced
}
