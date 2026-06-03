import { AnimatePresence, motion } from "framer-motion"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent
} from "react"

import { addNote } from "~/lib/notes/mutations"
import { NOTE_LIMITS } from "~/lib/notes/limits"
import { notesItem, notesUiItem, type Edge } from "~/lib/storage"

import { useStorageItem } from "../../hooks/useStorageItem"
import { usePrefersReducedMotion } from "../../hooks/useTheme"

interface NotesQuickComposeProps {
  /** Bounding rect of the Notes bar tile (viewport coords). */
  anchorRect: DOMRect
  /** Bar edge — popover opens on the side away from it. */
  edge: Edge
  theme: "light" | "dark"
  onClose: () => void
}

const W = 240
const GAP = 8
const EST_H = 168

/**
 * Floating quick-note composer anchored beside the bar's Notes tile. Saves to
 * the All view without opening the panel. Mounted by `App` (not `NotesApp`) so
 * it survives regardless of panel state.
 *
 * App's root carries no transform, so `position: fixed` resolves against the
 * viewport directly — no transformed-ancestor compensation needed here (unlike
 * popovers rendered *inside* the panel; see CLAUDE.md).
 */
export function NotesQuickCompose({
  anchorRect,
  edge,
  theme,
  onClose
}: NotesQuickComposeProps) {
  const reduced = usePrefersReducedMotion()
  const [notes, setNotes] = useStorageItem(notesItem)
  const [notesUi] = useStorageItem(notesUiItem)
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    // Layout viewport (excludes scrollbar) per CLAUDE.md — never window.inner*.
    const vw = document.documentElement.clientWidth
    const vh = document.documentElement.clientHeight
    let left =
      edge === "right" ? anchorRect.left - W - GAP : anchorRect.right + GAP
    left = Math.max(8, Math.min(left, vw - W - 8))
    let top = anchorRect.top
    top = Math.max(8, Math.min(top, vh - EST_H - 8))
    setCoords({ top, left })
  }, [anchorRect, edge])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const path = e.composedPath()
      if (rootRef.current && path.includes(rootRef.current)) return
      onClose()
    }
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
  }, [onClose])

  const save = useCallback(() => {
    const body = text.trim()
    if (!body) {
      onClose()
      return
    }
    const result = addNote(notes, { body, color: notesUi.defaultColor })
    if ("error" in result) {
      setError(`Note limit reached (${NOTE_LIMITS.TOTAL_NOTES_MAX}).`)
      return
    }
    void setNotes(result.items)
    onClose()
  }, [text, notes, notesUi.defaultColor, setNotes, onClose])

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        save()
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    },
    [save, onClose]
  )

  const bg = theme === "dark" ? "#0a0a0a" : "#ffffff"
  const text0 = theme === "dark" ? "#fafafa" : "#171717"
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const border =
    theme === "dark"
      ? "1px solid rgba(255,255,255,0.10)"
      : "1px solid rgba(0,0,0,0.10)"

  return (
    <AnimatePresence>
      <motion.div
        ref={rootRef}
        role="dialog"
        aria-label="Quick note"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: reduced ? { duration: 0 } : { duration: 0.16, ease: [0.32, 0.72, 0, 1] }
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
          transition: reduced ? { duration: 0 } : { duration: 0.12, ease: [0.4, 0, 1, 1] }
        }}
        style={{
          position: "fixed",
          top: coords.top,
          left: coords.left,
          width: W,
          zIndex: 2147483647,
          backgroundColor: bg,
          color: text0,
          border,
          borderRadius: 10,
          boxShadow:
            theme === "dark"
              ? "0 16px 40px rgba(0,0,0,0.6)"
              : "0 16px 40px rgba(0,0,0,0.22)",
          padding: 10,
          pointerEvents: "auto",
          transformOrigin: edge === "right" ? "top right" : "top left"
        }}>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: muted }}>
          Quick note
        </div>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={handleKey}
          maxLength={NOTE_LIMITS.BODY_MAX}
          rows={4}
          placeholder="Type a note…  (Enter to save)"
          aria-label="Quick note text"
          className="w-full resize-none bg-transparent text-[13px] leading-relaxed placeholder:text-neutral-500 focus:outline-none"
        />
        {error ? (
          <p className="mt-1 text-[11px]" style={{ color: "#dc2626" }}>
            {error}
          </p>
        ) : null}
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-[12px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            style={{ color: muted }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={Boolean(error)}
            className="rounded bg-blue-500 px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            Save
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
