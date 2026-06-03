// Card tint lookup. Tokens map to a {light, dark} surface pair (ui-spec.md §1).
// Components read these via inline styles — the project keeps runtime visual
// values out of Tailwind (only the few inline-style cases per CLAUDE.md).

import type { ColorToken } from "./types"

interface Tint {
  /** Card surface background. */
  bg: { light: string; dark: string }
}

export const NOTE_TINTS: Record<ColorToken, Tint> = {
  default: { bg: { light: "#ffffff", dark: "#1f1f1f" } },
  red: { bg: { light: "#fef2f2", dark: "#3f1f1f" } },
  orange: { bg: { light: "#fff7ed", dark: "#3f2a1f" } },
  yellow: { bg: { light: "#fefce8", dark: "#3a361f" } },
  green: { bg: { light: "#f0fdf4", dark: "#1f3a2a" } },
  teal: { bg: { light: "#f0fdfa", dark: "#1f3a38" } },
  blue: { bg: { light: "#eff6ff", dark: "#1f2c3f" } },
  purple: { bg: { light: "#faf5ff", dark: "#2f1f3f" } },
  pink: { bg: { light: "#fdf2f8", dark: "#3a1f30" } }
}

/** Human label for each token — used as swatch tooltips. */
export const COLOR_LABELS: Record<ColorToken, string> = {
  default: "Default",
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  teal: "Teal",
  blue: "Blue",
  purple: "Purple",
  pink: "Pink"
}

export function noteBg(color: ColorToken, theme: "light" | "dark"): string {
  return NOTE_TINTS[color].bg[theme]
}
