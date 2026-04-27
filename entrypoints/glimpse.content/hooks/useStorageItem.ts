import { useEffect, useState } from "react"
import type { WxtStorageItem } from "@wxt-dev/storage"

export function useStorageItem<T>(item: WxtStorageItem<T, Record<string, unknown>>) {
  const [value, setValue] = useState<T>(item.fallback as T)

  useEffect(() => {
    let cancelled = false
    item.getValue().then((v) => {
      if (!cancelled) setValue(v as T)
    })
    const unwatch = item.watch((next) => {
      setValue(next as T)
    })
    return () => {
      cancelled = true
      unwatch()
    }
  }, [item])

  const set = async (next: T) => {
    setValue(next)
    await item.setValue(next)
  }

  return [value, set] as const
}
