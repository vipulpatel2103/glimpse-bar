import { storage } from "@wxt-dev/storage"

import type { AppId } from "./apps/types"

export type Position = { x: number; y: number }
export type Edge = "left" | "right"

export const BAR_WIDTH = 44
export const BAR_HEIGHT = 220
export const PANEL_WIDTH = 360
export const PANEL_GAP = 4

export const positionItem = storage.defineItem<Position>("local:gb-position", {
  fallback: { x: 0, y: 0 }
})

export const edgeItem = storage.defineItem<Edge>("local:gb-edge", {
  fallback: "right"
})

export const transparencyItem = storage.defineItem<number>(
  "local:gb-transparency",
  { fallback: 0.6 }
)

export const activeAppItem = storage.defineItem<AppId | null>(
  "local:gb-active-app",
  { fallback: null }
)
