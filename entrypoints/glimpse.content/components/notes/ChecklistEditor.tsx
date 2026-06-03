import { CheckSquare, Plus, Square, X } from "lucide-react"
import { useCallback, useState, type KeyboardEvent } from "react"

import { NOTE_LIMITS } from "~/lib/notes/limits"
import type { ChecklistItem } from "~/lib/notes/types"

interface ChecklistEditorProps {
  theme: "light" | "dark"
  items: ChecklistItem[]
  onToggle: (ciId: string) => void
  onUpdate: (ciId: string, text: string) => void
  onRemove: (ciId: string) => void
  onAdd: (text: string) => void
}

export function ChecklistEditor({
  theme,
  items,
  onToggle,
  onUpdate,
  onRemove,
  onAdd
}: ChecklistEditorProps) {
  const [draft, setDraft] = useState("")
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const text = theme === "dark" ? "#fafafa" : "#171717"
  const atLimit = items.length >= NOTE_LIMITS.CHECKLIST_PER_NOTE

  const sorted = [...items].sort((a, b) => a.order - b.order)

  const commitDraft = useCallback(() => {
    const t = draft.trim()
    if (!t) return
    onAdd(t)
    setDraft("")
  }, [draft, onAdd])

  const handleDraftKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        commitDraft()
      }
    },
    [commitDraft]
  )

  return (
    <div className="flex flex-col gap-0.5">
      {sorted.map((c) => (
        <div key={c.id} className="group/ci flex items-center gap-2">
          <button
            type="button"
            aria-label={c.done ? "Mark incomplete" : "Mark complete"}
            aria-pressed={c.done}
            onClick={() => onToggle(c.id)}
            className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            style={{ color: c.done ? muted : text }}>
            {c.done ? (
              <CheckSquare size={15} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Square size={15} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
          <input
            type="text"
            value={c.text}
            onChange={(e) => onUpdate(c.id, e.target.value)}
            maxLength={NOTE_LIMITS.CHECKLIST_ITEM_MAX}
            aria-label="Checklist item"
            className={
              "flex-1 bg-transparent text-[13px] leading-snug focus:outline-none " +
              (c.done ? "line-through" : "")
            }
            style={{ color: c.done ? muted : text }}
          />
          <button
            type="button"
            aria-label="Remove item"
            onClick={() => onRemove(c.id)}
            className="shrink-0 opacity-0 transition-opacity duration-100 group-hover/ci:opacity-60 hover:!opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            style={{ color: muted }}>
            <X size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2 pt-0.5">
        <Plus size={15} strokeWidth={2} aria-hidden="true" style={{ color: muted }} />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleDraftKey}
          onBlur={commitDraft}
          disabled={atLimit}
          maxLength={NOTE_LIMITS.CHECKLIST_ITEM_MAX}
          placeholder={
            atLimit ? `Limit reached (${NOTE_LIMITS.CHECKLIST_PER_NOTE})` : "Add item"
          }
          aria-label="Add checklist item"
          className="flex-1 bg-transparent text-[13px] leading-snug placeholder:text-neutral-500 focus:outline-none disabled:opacity-50"
          style={{ color: text }}
        />
      </div>
    </div>
  )
}
