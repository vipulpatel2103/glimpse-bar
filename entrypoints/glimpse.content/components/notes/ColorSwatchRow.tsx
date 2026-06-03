import { Check } from "lucide-react"

import { COLOR_LABELS, NOTE_TINTS } from "~/lib/notes/colors"
import { COLOR_TOKENS, type ColorToken } from "~/lib/notes/types"

interface ColorSwatchRowProps {
  theme: "light" | "dark"
  value: ColorToken
  onChange: (color: ColorToken) => void
}

export function ColorSwatchRow({ theme, value, onChange }: ColorSwatchRowProps) {
  const ring = theme === "dark" ? "#fafafa" : "#171717"
  const swatchBorder =
    theme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)"

  return (
    <div role="radiogroup" aria-label="Note color" className="flex flex-wrap gap-1.5">
      {COLOR_TOKENS.map((token) => {
        const selected = token === value
        return (
          <button
            key={token}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={COLOR_LABELS[token]}
            title={COLOR_LABELS[token]}
            onClick={() => onChange(token)}
            className="flex h-[22px] w-[22px] items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            style={{
              backgroundColor: NOTE_TINTS[token].bg[theme],
              border: `1px solid ${selected ? ring : swatchBorder}`,
              boxShadow: selected ? `0 0 0 1px ${ring}` : undefined
            }}>
            {selected ? (
              <Check size={12} strokeWidth={3} aria-hidden="true" style={{ color: ring }} />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
