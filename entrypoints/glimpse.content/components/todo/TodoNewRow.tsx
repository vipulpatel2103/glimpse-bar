import { Plus } from "lucide-react"
import { useCallback, useState, type KeyboardEvent } from "react"

interface TodoNewRowProps {
  theme: "light" | "dark"
  /** Optional placeholder override (e.g. "+ New subtask"). */
  placeholder?: string
  onSubmit: (text: string) => void
  /** When true, suppress the row's own borderTop (caller owns the border). */
  borderless?: boolean
}

export function TodoNewRow({
  theme,
  placeholder = "New task",
  onSubmit,
  borderless = false
}: TodoNewRowProps) {
  const [value, setValue] = useState("")

  const commit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue("")
  }, [value, onSubmit])

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        commit()
      } else if (e.key === "Escape") {
        e.preventDefault()
        setValue("")
        ;(e.target as HTMLInputElement).blur()
      }
    },
    [commit]
  )

  return (
    <div
      className="flex h-9 shrink-0 items-center gap-2 px-3"
      style={{
        borderTop: borderless
          ? undefined
          : theme === "dark"
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(0,0,0,0.06)"
      }}>
      <Plus
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        style={{ color: theme === "dark" ? "#a3a3a3" : "#737373" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        onBlur={commit}
        placeholder={placeholder}
        aria-label={placeholder}
        className={
          "h-full flex-1 bg-transparent text-[13px] leading-tight " +
          "placeholder:text-neutral-500 dark:placeholder:text-neutral-500 " +
          "focus:outline-none"
        }
      />
    </div>
  )
}
