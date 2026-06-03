import { Plus, Tag, X } from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent
} from "react"

import { NOTE_LIMITS } from "~/lib/notes/limits"
import type { LabelId, LabelMeta } from "~/lib/notes/types"

interface NoteLabelsBarProps {
  theme: "light" | "dark"
  /** All labels in the system. */
  allLabels: LabelMeta[]
  /** Label ids assigned to this note. */
  assigned: LabelId[]
  onToggle: (labelId: LabelId) => void
  /** Create a label by name; returns its id (or null if duplicate/empty). */
  onCreate: (name: string) => LabelId | null
}

/**
 * Label chips for a note + an inline `+` picker. The picker renders inside the
 * editor overlay (a positioned ancestor), so a plain `position: absolute`
 * dropdown suffices — no portal / transform compensation needed here.
 */
export function NoteLabelsBar({
  theme,
  allLabels,
  assigned,
  onToggle,
  onCreate
}: NoteLabelsBarProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const rootRef = useRef<HTMLDivElement | null>(null)

  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const chipBg =
    theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"
  const popBg = theme === "dark" ? "#0a0a0a" : "#ffffff"
  const popBorder =
    theme === "dark"
      ? "1px solid rgba(255,255,255,0.10)"
      : "1px solid rgba(0,0,0,0.10)"

  const assignedSet = new Set(assigned)
  const assignedLabels = allLabels.filter((l) => assignedSet.has(l.id))

  const q = query.trim().toLowerCase()
  const matches = allLabels.filter((l) => l.name.toLowerCase().includes(q))
  const exactExists = allLabels.some((l) => l.name.toLowerCase() === q)
  const canCreate = q.length > 0 && !exactExists && assigned.length < NOTE_LIMITS.LABELS_PER_NOTE

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const path = e.composedPath()
      if (rootRef.current && path.includes(rootRef.current)) return
      setOpen(false)
    }
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
  }, [open])

  const handleCreate = useCallback(() => {
    const id = onCreate(query.trim())
    if (id) {
      setQuery("")
    }
  }, [onCreate, query])

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        if (canCreate) handleCreate()
        else if (matches.length === 1) onToggle(matches[0].id)
      } else if (e.key === "Escape") {
        e.preventDefault()
        // Keep Esc local to the picker so it doesn't bubble to the editor's
        // Esc-to-close handler.
        e.stopPropagation()
        setOpen(false)
      }
    },
    [canCreate, handleCreate, matches, onToggle]
  )

  return (
    <div ref={rootRef} className="relative flex flex-wrap items-center gap-1">
      {assignedLabels.map((l) => (
        <span
          key={l.id}
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ backgroundColor: chipBg, color: muted }}>
          <Tag size={10} strokeWidth={2} aria-hidden="true" />
          {l.name}
          <button
            type="button"
            aria-label={`Remove label ${l.name}`}
            onClick={() => onToggle(l.id)}
            className="opacity-60 hover:opacity-100">
            <X size={10} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </span>
      ))}

      <button
        type="button"
        aria-label="Add label"
        onClick={() => setOpen((v) => !v)}
        className="flex h-5 items-center gap-1 rounded-full px-1.5 text-[11px] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        style={{ color: muted }}>
        <Plus size={12} strokeWidth={2} aria-hidden="true" />
        Label
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Choose labels"
          className="absolute left-0 top-full z-[9999] mt-1 w-56 rounded-lg p-1"
          style={{ backgroundColor: popBg, border: popBorder, boxShadow:
            theme === "dark"
              ? "0 8px 24px rgba(0,0,0,0.6)"
              : "0 8px 24px rgba(0,0,0,0.18)" }}>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search or create…"
            aria-label="Search or create a label"
            className="mb-1 h-7 w-full rounded bg-transparent px-2 text-[12px] focus:outline-none"
            style={{
              border:
                theme === "dark"
                  ? "1px solid rgba(255,255,255,0.10)"
                  : "1px solid rgba(0,0,0,0.10)"
            }}
          />
          <div className="max-h-48 overflow-y-auto">
            {matches.map((l) => {
              const on = assignedSet.has(l.id)
              return (
                <button
                  key={l.id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => onToggle(l.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
                  <span
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-sm"
                    style={{
                      border: `1px solid ${on ? "#3b82f6" : muted}`,
                      backgroundColor: on ? "#3b82f6" : "transparent"
                    }}>
                    {on ? (
                      <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden="true">
                        <path
                          d="M2 6l3 3 5-6"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <span className="flex-1 truncate">{l.name}</span>
                </button>
              )
            })}
            {canCreate ? (
              <button
                type="button"
                onClick={handleCreate}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                style={{ color: muted }}>
                <Plus size={12} strokeWidth={2} aria-hidden="true" />
                Create “{query.trim()}”
              </button>
            ) : null}
            {matches.length === 0 && !canCreate ? (
              <p className="px-2 py-1.5 text-[12px]" style={{ color: muted }}>
                {assigned.length >= NOTE_LIMITS.LABELS_PER_NOTE
                  ? `Up to ${NOTE_LIMITS.LABELS_PER_NOTE} labels per note`
                  : "No labels yet"}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
