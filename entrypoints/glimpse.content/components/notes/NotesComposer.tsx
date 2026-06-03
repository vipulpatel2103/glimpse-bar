import { Plus } from "lucide-react"
import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent
} from "react"

import { NOTE_LIMITS } from "~/lib/notes/limits"

interface NotesComposerProps {
  theme: "light" | "dark"
  /** Returns false when the note was rejected (e.g. note limit reached). */
  onSubmit: (input: { title: string; body: string }) => boolean
  /** Inline error to surface under the composer (e.g. limit reached). */
  error?: string | null
}

/**
 * `+ Take a note…` composer. Collapsed it's a single row; focusing expands it
 * into a title + body editor. Enter on the title hops to the body;
 * Cmd/Ctrl+Enter commits; Esc collapses and clears.
 */
export function NotesComposer({ theme, onSubmit, error }: NotesComposerProps) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)

  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const border =
    theme === "dark"
      ? "1px solid rgba(255,255,255,0.06)"
      : "1px solid rgba(0,0,0,0.06)"

  const reset = useCallback(() => {
    setTitle("")
    setBody("")
    setExpanded(false)
  }, [])

  const commit = useCallback(() => {
    const t = title.trim()
    const b = body.trim()
    if (!t && !b) {
      reset()
      return
    }
    const ok = onSubmit({ title: t, body: b })
    if (ok) reset()
  }, [title, body, onSubmit, reset])

  const handleTitleKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        bodyRef.current?.focus()
      } else if (e.key === "Escape") {
        e.preventDefault()
        reset()
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        commit()
      }
    },
    [commit, reset]
  )

  const handleBodyKey = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        commit()
      } else if (e.key === "Escape") {
        e.preventDefault()
        reset()
      }
    },
    [commit, reset]
  )

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex h-9 w-full shrink-0 items-center gap-2 px-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        style={{ borderBottom: border }}>
        <Plus size={14} strokeWidth={2} aria-hidden="true" style={{ color: muted }} />
        <span className="text-[13px]" style={{ color: muted }}>
          Take a note…
        </span>
      </button>
    )
  }

  return (
    <div
      className="flex shrink-0 flex-col gap-2 px-3 py-3"
      style={{ borderBottom: border }}>
      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleTitleKey}
        maxLength={NOTE_LIMITS.TITLE_MAX}
        placeholder="Title"
        aria-label="Note title"
        className="bg-transparent text-[14px] font-semibold leading-tight placeholder:text-neutral-500 focus:outline-none"
      />
      <textarea
        ref={bodyRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleBodyKey}
        maxLength={NOTE_LIMITS.BODY_MAX}
        placeholder="Take a note…  (Markdown supported)"
        aria-label="Note body"
        rows={3}
        className="resize-none bg-transparent text-[13px] leading-relaxed placeholder:text-neutral-500 focus:outline-none"
      />
      {error ? (
        <p className="text-[11px]" style={{ color: "#dc2626" }}>
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded px-2 py-1 text-[12px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          style={{ color: muted }}>
          Cancel
        </button>
        <button
          type="button"
          onClick={commit}
          className="rounded bg-blue-500 px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          Save
        </button>
      </div>
    </div>
  )
}
