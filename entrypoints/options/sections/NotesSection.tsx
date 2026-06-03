import { useRef, useState } from "react"

import { COLOR_LABELS } from "~/lib/notes/colors"
import { NOTE_LIMITS } from "~/lib/notes/limits"
import { COLOR_TOKENS, type ColorToken, type LabelMeta, type Note } from "~/lib/notes/types"
import { uid } from "~/lib/uid"
import { labelsItem, notesItem, notesUiItem } from "~/lib/storage"
import { useStorageItem } from "~/entrypoints/glimpse.content/hooks/useStorageItem"

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Coerce an unknown import payload into valid Note[] + LabelMeta[]. */
function parseImport(
  raw: unknown
): { notes: Note[]; labels: LabelMeta[] } | null {
  const obj = raw as { notes?: unknown; labels?: unknown }
  const rawNotes = Array.isArray(raw) ? raw : obj?.notes
  if (!Array.isArray(rawNotes)) return null
  const now = Date.now()

  const notes: Note[] = rawNotes
    .filter((n): n is Record<string, unknown> => Boolean(n) && typeof n === "object")
    .map((n) => ({
      id: typeof n.id === "string" ? n.id : uid(),
      title: typeof n.title === "string" ? n.title.slice(0, NOTE_LIMITS.TITLE_MAX) : "",
      body: typeof n.body === "string" ? n.body.slice(0, NOTE_LIMITS.BODY_MAX) : "",
      color: (COLOR_TOKENS as readonly string[]).includes(n.color as string)
        ? (n.color as ColorToken)
        : "default",
      labels: Array.isArray(n.labels) ? (n.labels.filter((l) => typeof l === "string") as string[]) : [],
      pinned: Boolean(n.pinned),
      archived: Boolean(n.archived),
      checklist: Array.isArray(n.checklist) ? (n.checklist as Note["checklist"]) : undefined,
      createdAt: typeof n.createdAt === "number" ? n.createdAt : now,
      updatedAt: typeof n.updatedAt === "number" ? n.updatedAt : now
    }))

  const rawLabels = Array.isArray(obj?.labels) ? obj.labels : []
  const labels: LabelMeta[] = rawLabels
    .filter((l): l is Record<string, unknown> => Boolean(l) && typeof l === "object")
    .map((l) => ({
      id: typeof l.id === "string" ? l.id : uid(),
      name: typeof l.name === "string" ? l.name : "Label",
      createdAt: typeof l.createdAt === "number" ? l.createdAt : now
    }))

  return { notes, labels }
}

export function NotesSection() {
  const [notes, setNotes] = useStorageItem(notesItem)
  const [labels, setLabels] = useStorageItem(labelsItem)
  const [notesUi, setNotesUi] = useStorageItem(notesUiItem)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const count = notes.length
  const overWarn = count >= NOTE_LIMITS.TOTAL_NOTES_WARN

  function handleExport() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      notes,
      labels
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `glimpse-notes-${todayStamp()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(file: File) {
    try {
      const parsed = parseImport(JSON.parse(await file.text()))
      if (!parsed) {
        setStatus("Import failed: unrecognized file shape.")
        return
      }
      // Merge labels by name; remap imported label ids onto existing/new ones.
      const byName = new Map(labels.map((l) => [l.name.toLowerCase(), l] as const))
      const nextLabels = [...labels]
      const idRemap = new Map<string, string>()
      for (const imp of parsed.labels) {
        const existing = byName.get(imp.name.toLowerCase())
        if (existing) {
          idRemap.set(imp.id, existing.id)
        } else {
          const fresh: LabelMeta = { ...imp, id: uid() }
          nextLabels.push(fresh)
          byName.set(fresh.name.toLowerCase(), fresh)
          idRemap.set(imp.id, fresh.id)
        }
      }

      // Merge notes; mint fresh ids on collision; remap label refs.
      const existingIds = new Set(notes.map((n) => n.id))
      const knownLabelIds = new Set(nextLabels.map((l) => l.id))
      const room = NOTE_LIMITS.TOTAL_NOTES_MAX - notes.length
      const incoming = parsed.notes.slice(0, Math.max(0, room)).map((n) => ({
        ...n,
        id: existingIds.has(n.id) ? uid() : n.id,
        labels: n.labels
          .map((l) => idRemap.get(l) ?? l)
          .filter((l) => knownLabelIds.has(l))
      }))

      await setLabels(nextLabels)
      await setNotes([...notes, ...incoming])
      const dropped = parsed.notes.length - incoming.length
      setStatus(
        `Imported ${incoming.length} note${incoming.length === 1 ? "" : "s"}.` +
          (dropped > 0 ? ` ${dropped} skipped (100-note cap).` : "")
      )
    } catch {
      setStatus("Import failed: could not parse JSON.")
    }
  }

  return (
    <section>
      <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Notes
      </h2>
      <p className="mb-3 text-xs text-neutral-400 dark:text-neutral-500">
        Local notes stored on this device. Back them up with Export.
      </p>

      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-medium">Stored notes</span>
        <span
          className={
            "tabular-nums " +
            (overWarn
              ? "font-semibold text-amber-600 dark:text-amber-400"
              : "text-neutral-500 dark:text-neutral-400")
          }>
          {count} / {NOTE_LIMITS.TOTAL_NOTES_MAX}
        </span>
      </div>

      <label className="mb-4 block">
        <div className="mb-1 text-sm font-medium">Default color for new notes</div>
        <select
          value={notesUi.defaultColor}
          onChange={(e) =>
            void setNotesUi({ ...notesUi, defaultColor: e.target.value as ColorToken })
          }
          className="w-full max-w-xs rounded border border-black/[0.12] bg-white px-2 py-1.5 text-sm dark:border-white/[0.12] dark:bg-neutral-900">
          {COLOR_TOKENS.map((token) => (
            <option key={token} value={token}>
              {COLOR_LABELS[token]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Applied to notes created via the composer, right-click capture, and the
          bar quick-note.
        </p>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="rounded border border-black/[0.12] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:border-white/[0.12] dark:hover:bg-white/[0.06]">
          Export notes as JSON
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded border border-black/[0.12] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:border-white/[0.12] dark:hover:bg-white/[0.06]">
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImportFile(file)
            e.target.value = ""
          }}
        />
      </div>

      {status ? (
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{status}</p>
      ) : null}
    </section>
  )
}
