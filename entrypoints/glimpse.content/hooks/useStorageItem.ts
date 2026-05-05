import { useEffect, useState } from "react"
import type { WxtStorageItem } from "@wxt-dev/storage"

function isContextInvalidated(err: unknown): boolean {
  return (
    err instanceof Error &&
    err.message.toLowerCase().includes("extension context invalidated")
  )
}

export function useStorageItem<T>(item: WxtStorageItem<T, Record<string, unknown>>) {
  const [value, setValue] = useState<T>(item.fallback as T)

  useEffect(() => {
    let cancelled = false

    item.getValue().then((v) => {
      if (!cancelled) setValue(v as T)
    }).catch((err) => {
      // Silently ignore when extension reloads mid-session (orphaned content script).
      if (!isContextInvalidated(err)) throw err
    })

    let unwatch: (() => void) | undefined
    try {
      unwatch = item.watch((next) => {
        if (!cancelled) setValue(next as T)
      })
    } catch (err) {
      if (!isContextInvalidated(err)) throw err
    }

    return () => {
      cancelled = true
      try {
        unwatch?.()
      } catch (err) {
        if (!isContextInvalidated(err)) throw err
      }
    }
  }, [item])

  const set = async (next: T) => {
    setValue(next)
    try {
      await item.setValue(next)
    } catch (err) {
      if (!isContextInvalidated(err)) throw err
    }
  }

  return [value, set] as const
}
