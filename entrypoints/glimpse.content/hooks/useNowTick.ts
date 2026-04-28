import { useEffect, useState } from "react"

/**
 * Returns a `now` timestamp that re-renders on a fixed interval. Used by
 * the TODO panel so day-boundary rollovers (overdue → Today, Today →
 * Upcoming) become visible without user interaction. Defaults to 60s —
 * good enough for date buckets, cheap enough to ignore.
 */
export function useNowTick(intervalMs: number = 60_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
