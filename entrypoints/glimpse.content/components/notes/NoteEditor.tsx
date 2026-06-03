import {
  Archive,
  ArchiveRestore,
  ChevronLeft,
  Eye,
  ListChecks,
  Pencil,
  Pin,
  PinOff,
  Trash2
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

import { NOTE_LIMITS } from "~/lib/notes/limits"
import { bodyToChecklist, checklistToBody } from "~/lib/notes/mutations"
import { renderMarkdown } from "~/lib/notes/markdown"
import { uid } from "~/lib/uid"
import type {
  ChecklistItem,
  ColorToken,
  LabelId,
  LabelMeta,
  Note
} from "~/lib/notes/types"

import { ChecklistEditor } from "./ChecklistEditor"
import { ColorSwatchRow } from "./ColorSwatchRow"
import { NoteLabelsBar } from "./NoteLabelsBar"

interface NoteEditorProps {
  note: Note
  theme: "light" | "dark"
  allLabels: LabelMeta[]
  /** Persist title/body/checklist (debounced by the editor). */
  onPatch: (
    id: string,
    patch: { title: string; body: string; checklist?: ChecklistItem[] }
  ) => void
  onSetColor: (id: string, color: ColorToken) => void
  onToggleLabel: (id: string, labelId: LabelId) => void
  /** Create + assign a label; returns its id or null (duplicate/empty/full). */
  onCreateLabel: (id: string, name: string) => LabelId | null
  onTogglePin: (id: string) => void
  onToggleArchive: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

const PERSIST_MS = 400

export function NoteEditor({
  note,
  theme,
  allLabels,
  onPatch,
  onSetColor,
  onToggleLabel,
  onCreateLabel,
  onTogglePin,
  onToggleArchive,
  onDelete,
  onClose
}: NoteEditorProps) {
  // Local working copy. Seeded once per note (the parent keys this component by
  // note.id so a different note remounts with fresh state). All text + checklist
  // edits mutate local state and flush to storage on a debounce.
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [checklist, setChecklist] = useState<ChecklistItem[] | null>(
    note.checklist ?? null
  )
  const [mode, setMode] = useState<"edit" | "view">(
    note.body.trim() ? "view" : "edit"
  )
  const [html, setHtml] = useState("")

  const text = theme === "dark" ? "#fafafa" : "#171717"
  const muted = theme === "dark" ? "#a3a3a3" : "#737373"
  const bg = theme === "dark" ? "#0a0a0a" : "#ffffff"
  const border =
    theme === "dark"
      ? "1px solid rgba(255,255,255,0.06)"
      : "1px solid rgba(0,0,0,0.06)"

  // ── Debounced persist ──
  const latest = useRef({ title, body, checklist })
  latest.current = { title, body, checklist }
  useEffect(() => {
    const h = window.setTimeout(() => {
      onPatch(note.id, {
        title,
        body,
        checklist: checklist ?? undefined
      })
    }, PERSIST_MS)
    return () => window.clearTimeout(h)
  }, [title, body, checklist, note.id, onPatch])
  // Flush on unmount so a quick close doesn't drop the last keystrokes.
  useEffect(() => {
    return () => {
      const cur = latest.current
      onPatch(note.id, {
        title: cur.title,
        body: cur.body,
        checklist: cur.checklist ?? undefined
      })
    }
  }, [note.id, onPatch])

  // ── Markdown render (lazy) ──
  useEffect(() => {
    if (mode !== "view" || checklist) return
    let cancelled = false
    if (!body.trim()) {
      setHtml("")
      return
    }
    void renderMarkdown(body).then((out) => {
      if (!cancelled) setHtml(out)
    })
    return () => {
      cancelled = true
    }
  }, [mode, body, checklist])

  // ── Checklist mode toggle ──
  const toggleChecklistMode = useCallback(() => {
    if (checklist) {
      // Off → serialize back to Markdown body.
      setBody(checklistToBody(checklist))
      setChecklist(null)
      setMode("edit")
    } else {
      // On → parse current body into items.
      setChecklist(bodyToChecklist(body))
      setBody("")
    }
  }, [checklist, body])

  // ── Checklist item ops (local) ──
  const addItem = useCallback((t: string) => {
    setChecklist((prev) => {
      const list = prev ?? []
      if (list.length >= NOTE_LIMITS.CHECKLIST_PER_NOTE) return list
      const order = list.length ? Math.max(...list.map((c) => c.order)) + 1 : 0
      return [...list, { id: uid(), text: t, done: false, order }]
    })
  }, [])
  const toggleItem = useCallback((ciId: string) => {
    setChecklist((prev) =>
      prev
        ? prev.map((c) => (c.id === ciId ? { ...c, done: !c.done } : c))
        : prev
    )
  }, [])
  const updateItem = useCallback((ciId: string, t: string) => {
    setChecklist((prev) =>
      prev ? prev.map((c) => (c.id === ciId ? { ...c, text: t } : c)) : prev
    )
  }, [])
  const removeItem = useCallback((ciId: string) => {
    setChecklist((prev) => (prev ? prev.filter((c) => c.id !== ciId) : prev))
  }, [])

  // ── Counter ──
  const counterColor = useMemo(() => {
    if (body.length >= NOTE_LIMITS.BODY_MAX)
      return theme === "dark" ? "#ef4444" : "#dc2626"
    if (body.length >= NOTE_LIMITS.BODY_WARN)
      return theme === "dark" ? "#fbbf24" : "#d97706"
    return muted
  }, [body.length, muted, theme])

  const headBtn =
    "flex h-7 w-7 items-center justify-center rounded transition-colors " +
    "hover:bg-black/[0.06] dark:hover:bg-white/[0.10] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col"
      style={{ backgroundColor: bg, color: text }}
      role="article"
      aria-label="Note editor"
      onKeyDown={(e) => {
        // Esc closes the editor. stopPropagation so the panel's window-level
        // Esc handler (GlimpsePanel) doesn't also dismiss the whole panel.
        // Child popovers (label picker) stop their own Esc before it reaches
        // here, so this only fires for "plain" Esc inside the editor.
        if (e.key === "Escape") {
          e.stopPropagation()
          onClose()
        }
      }}>
      {/* Toolbar */}
      <header
        className="flex h-11 shrink-0 items-center gap-1 px-2"
        style={{ borderBottom: border }}>
        <button
          type="button"
          aria-label="Back to notes"
          onClick={onClose}
          className={headBtn + " w-auto gap-1 px-2"}
          style={{ color: muted }}>
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
          <span className="text-[12px]">Done</span>
        </button>
        <div className="flex-1" />
        <button
          type="button"
          aria-label="Toggle checklist mode"
          aria-pressed={Boolean(checklist)}
          title={checklist ? "Switch to text" : "Switch to checklist"}
          onClick={toggleChecklistMode}
          className={headBtn}
          style={{ color: checklist ? "#3b82f6" : muted }}>
          <ListChecks size={16} strokeWidth={2} aria-hidden="true" />
        </button>
        {!checklist ? (
          <button
            type="button"
            aria-label={mode === "edit" ? "Preview" : "Edit"}
            title={mode === "edit" ? "Preview" : "Edit"}
            onClick={() => setMode((m) => (m === "edit" ? "view" : "edit"))}
            className={headBtn}
            style={{ color: muted }}>
            {mode === "edit" ? (
              <Eye size={16} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Pencil size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        ) : null}
        <button
          type="button"
          aria-label={note.pinned ? "Unpin note" : "Pin note"}
          title={note.pinned ? "Unpin" : "Pin"}
          onClick={() => onTogglePin(note.id)}
          className={headBtn}
          style={{ color: note.pinned ? "#3b82f6" : muted }}>
          {note.pinned ? (
            <PinOff size={16} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Pin size={16} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          aria-label={note.archived ? "Restore note" : "Archive note"}
          title={note.archived ? "Restore" : "Archive"}
          onClick={() => {
            onToggleArchive(note.id)
            onClose()
          }}
          className={headBtn}
          style={{ color: muted }}>
          {note.archived ? (
            <ArchiveRestore size={16} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Archive size={16} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          aria-label="Delete note"
          title="Delete"
          onClick={() => {
            onDelete(note.id)
            onClose()
          }}
          className={headBtn}
          style={{ color: muted }}>
          <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      {/* Scrollable editor body */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={NOTE_LIMITS.TITLE_MAX}
          placeholder="Title"
          aria-label="Note title"
          className="bg-transparent text-[16px] font-semibold leading-tight placeholder:text-neutral-500 focus:outline-none"
        />

        {checklist ? (
          <ChecklistEditor
            theme={theme}
            items={checklist}
            onToggle={toggleItem}
            onUpdate={updateItem}
            onRemove={removeItem}
            onAdd={addItem}
          />
        ) : mode === "edit" ? (
          <>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={NOTE_LIMITS.BODY_MAX}
              placeholder="Take a note…  (Markdown supported)"
              aria-label="Note body"
              className="min-h-[160px] flex-1 resize-none bg-transparent text-[13px] leading-relaxed placeholder:text-neutral-500 focus:outline-none"
            />
            <div className="flex justify-end">
              <span className="text-[11px] tabular-nums" style={{ color: counterColor }}>
                {body.length.toLocaleString()} / {NOTE_LIMITS.BODY_MAX.toLocaleString()}
              </span>
            </div>
          </>
        ) : html ? (
          <div className="gb-prose flex-1" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="flex-1 text-[13px]" style={{ color: muted }}>
            Nothing here yet. Tap the pencil to edit.
          </p>
        )}

        {/* Footer controls */}
        <div className="mt-1 flex flex-col gap-2 pt-2" style={{ borderTop: border }}>
          <NoteLabelsBar
            theme={theme}
            allLabels={allLabels}
            assigned={note.labels}
            onToggle={(labelId) => onToggleLabel(note.id, labelId)}
            onCreate={(name) => onCreateLabel(note.id, name)}
          />
          <ColorSwatchRow
            theme={theme}
            value={note.color}
            onChange={(c) => onSetColor(note.id, c)}
          />
        </div>
      </div>
    </div>
  )
}
