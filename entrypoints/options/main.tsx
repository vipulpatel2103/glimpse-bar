import "./style.css"

import { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"

import { transparencyItem } from "~/lib/storage"
import { AppVisibilitySection } from "./sections/AppVisibilitySection"
import { GitHubSection } from "./sections/GitHubSection"

function useTheme(): "light" | "dark" {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const m = window.matchMedia("(prefers-color-scheme: dark)")
    const fn = (e: MediaQueryListEvent) => setIsDark(e.matches)
    m.addEventListener("change", fn)
    return () => m.removeEventListener("change", fn)
  }, [])
  return isDark ? "dark" : "light"
}

function useTransparency() {
  const [value, setValue] = useState<number>(transparencyItem.fallback as number)

  useEffect(() => {
    let cancelled = false
    transparencyItem.getValue().then((v) => {
      if (!cancelled) setValue(v as number)
    })
    const unwatch = transparencyItem.watch((next) => {
      setValue(next as number)
    })
    return () => {
      cancelled = true
      unwatch()
    }
  }, [])

  const set = async (next: number) => {
    setValue(next)
    await transparencyItem.setValue(next)
  }
  return [value, set] as const
}

function Options() {
  const theme = useTheme()
  const [transparency, setTransparency] = useTransparency()
  const pct = Math.round((transparency ?? 0.6) * 100)

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <main className="min-h-screen bg-white p-6 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-semibold">Glimpse Bar — Options</h1>
          <hr className="my-4 border-black/[0.08] dark:border-white/[0.08]" />

          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Appearance
          </h2>

          <label className="block">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">Transparency</span>
              <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
                {pct}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={pct}
              onChange={(e) =>
                void setTransparency(Number(e.target.value) / 100)
              }
              aria-label="Glimpse Bar transparency"
              className="w-full max-w-md accent-blue-500"
            />
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              How see-through the Glimpse Bar background is. 0% = invisible
              background, 100% = fully opaque.
            </p>
          </label>

          <hr className="my-6 border-black/[0.08] dark:border-white/[0.08]" />
          <AppVisibilitySection />

          <hr className="my-6 border-black/[0.08] dark:border-white/[0.08]" />
          <GitHubSection />
        </div>
      </main>
    </div>
  )
}

const rootEl = document.getElementById("root")
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<Options />)
}
