import {
  Archive,
  Pin,
  SearchX,
  StickyNote,
  Tag,
  type LucideIcon
} from "lucide-react"
import { useCallback, useDeferredValue, useMemo, useState } from "react"

import { labelsItem, notesItem, notesUiItem } from "~/lib/storage"
import {
  addLabel,
  addNote,
  removeLabel,
  removeNote,
  renameLabel,
  setColor,
  setLabels as setNoteLabels,
  toggleArchive,
  togglePin,
  updateNote
} from "~/lib/notes/mutations"
import {
  countByView,
  searchNotes,
  selectByView
} from "~/lib/notes/selectors"
import {
  isSystemView,
  type ChecklistItem,
  type ColorToken,
  type LabelId,
  type SystemView
} from "~/lib/notes/types"

import { useNowTick } from "../../hooks/useNowTick"
import { useStorageItem } from "../../hooks/useStorageItem"
import { useViewportWidth } from "../../hooks/useViewportWidth"

import { NoteEditor } from "./NoteEditor"
import { NotesComposer } from "./NotesComposer"
import { NotesGrid } from "./NotesGrid"
import { NotesHeader } from "./NotesHeader"
import { NotesSidebar } from "./NotesSidebar"

const EXPAND_BREAKPOINT = 720

interface NotesAppProps {
  theme: "light" | "dark"
}

const SYSTEM_TITLE: Record<SystemView, string> = {
  all: "All",
  pinned: "Pinned",
  archived: "Archived"
}

const SYSTEM_EMPTY: Record<SystemView, { hint: string; Icon: LucideIcon }> = {
  all: {
    hint: "No notes yet. Take a note above or right-click on any page.",
    Icon: StickyNote
  },
  pinned: {
    hint: "No pinned notes. Pin one to keep it on top.",
    Icon: Pin
  },
  archived: {
    hint: "Archive is empty.",
    Icon: Archive
  }
}

export function NotesApp({ theme }: NotesAppProps) {
  const [notes, setNotes] = useStorageItem(notesItem)
  const [labels, setLabelsStore] = useStorageItem(labelsItem)
  const [notesUi, setNotesUi] = useStorageItem(notesUiItem)
  const now = useNowTick(60_000)
  const vw = useViewportWidth()
  const canExpand = vw >= EXPAND_BREAKPOINT
  const expanded = notesUi.expanded && canExpand

  const [composerError, setComposerError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)

  // Resolve the active view; fall back to "all" if a stale label id is gone.
  const view: SystemView | LabelId = isSystemView(notesUi.activeView)
    ? notesUi.activeView
    : labels.some((l) => l.id === notesUi.activeView)
      ? notesUi.activeView
      : "all"

  const visible = useMemo(() => selectByView(notes, view), [notes, view])
  const counts = useMemo(() => countByView(notes, labels), [notes, labels])

  // Search filters within the active view's set (searching Archived searches
  // only archived notes). Deferred so typing stays smooth on large sets.
  const searching = searchOpen && query.trim().length > 0
  const displayed = useMemo(
    () => (searching ? searchNotes(visible, deferredQuery, labels) : visible),
    [searching, visible, deferredQuery, labels]
  )

  const title = isSystemView(view)
    ? SYSTEM_TITLE[view]
    : (labels.find((l) => l.id === view)?.name ?? "All")

  const baseEmpty = isSystemView(view)
    ? SYSTEM_EMPTY[view]
    : { hint: `No notes in “${title}” yet.`, Icon: Tag }
  const empty =
    searching && displayed.length === 0
      ? { hint: `No notes match “${query.trim()}”.`, Icon: SearchX }
      : baseEmpty

  const editingNote = editingId
    ? (notes.find((n) => n.id === editingId) ?? null)
    : null

  const handleSubmit = useCallback(
    (input: { title: string; body: string }) => {
      const result = addNote(notes, { ...input, color: notesUi.defaultColor })
      if ("error" in result) {
        setComposerError(
          "Note limit reached (100). Archive or delete old notes."
        )
        return false
      }
      setComposerError(null)
      void setNotes(result.items)
      return true
    },
    [notes, notesUi.defaultColor, setNotes]
  )

  const handleTogglePin = useCallback(
    (id: string) => void setNotes(togglePin(notes, id)),
    [notes, setNotes]
  )

  const handleToggleArchive = useCallback(
    (id: string) => void setNotes(toggleArchive(notes, id)),
    [notes, setNotes]
  )

  const handleDelete = useCallback(
    (id: string) => void setNotes(removeNote(notes, id)),
    [notes, setNotes]
  )

  // ── View + label nav ──
  const handleChangeView = useCallback(
    (next: SystemView | LabelId) =>
      void setNotesUi({ ...notesUi, activeView: next }),
    [notesUi, setNotesUi]
  )

  const handleCreateLabelStandalone = useCallback(
    (name: string) => {
      const res = addLabel(labels, name)
      if ("error" in res) return
      void setLabelsStore(res.labels)
    },
    [labels, setLabelsStore]
  )

  const handleRenameLabel = useCallback(
    (id: LabelId, name: string) =>
      void setLabelsStore(renameLabel(labels, id, name)),
    [labels, setLabelsStore]
  )

  const handleRemoveLabel = useCallback(
    (id: LabelId) => {
      const { labels: nextLabels, items } = removeLabel(labels, notes, id)
      void setLabelsStore(nextLabels)
      void setNotes(items)
      if (notesUi.activeView === id) {
        void setNotesUi({ ...notesUi, activeView: "all" })
      }
    },
    [labels, notes, notesUi, setLabelsStore, setNotes, setNotesUi]
  )

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false)
    setQuery("")
  }, [])

  const handleToggleExpanded = useCallback(
    () => void setNotesUi({ ...notesUi, expanded: !notesUi.expanded }),
    [notesUi, setNotesUi]
  )

  const handleToggleLayout = useCallback(
    () =>
      void setNotesUi({
        ...notesUi,
        layout: notesUi.layout === "grid" ? "list" : "grid"
      }),
    [notesUi, setNotesUi]
  )

  // ── Editor handlers ──
  const handlePatch = useCallback(
    (
      id: string,
      patch: { title: string; body: string; checklist?: ChecklistItem[] }
    ) => {
      void setNotes(updateNote(notes, id, patch).items)
    },
    [notes, setNotes]
  )

  const handleSetColor = useCallback(
    (id: string, color: ColorToken) => void setNotes(setColor(notes, id, color)),
    [notes, setNotes]
  )

  const handleToggleLabel = useCallback(
    (id: string, labelId: LabelId) => {
      const note = notes.find((n) => n.id === id)
      if (!note) return
      const next = note.labels.includes(labelId)
        ? note.labels.filter((l) => l !== labelId)
        : [...note.labels, labelId]
      void setNotes(setNoteLabels(notes, id, next))
    },
    [notes, setNotes]
  )

  const handleCreateLabel = useCallback(
    (id: string, name: string): LabelId | null => {
      const trimmed = name.trim()
      if (!trimmed) return null
      const note = notes.find((n) => n.id === id)
      if (!note) return null

      const res = addLabel(labels, trimmed)
      if ("error" in res) {
        // Duplicate name — assign the existing label instead of failing.
        const existing = labels.find(
          (l) => l.name.toLowerCase() === trimmed.toLowerCase()
        )
        if (!existing) return null
        if (!note.labels.includes(existing.id)) {
          void setNotes(setNoteLabels(notes, id, [...note.labels, existing.id]))
        }
        return existing.id
      }

      void setLabelsStore(res.labels)
      void setNotes(setNoteLabels(notes, id, [...note.labels, res.label.id]))
      return res.label.id
    },
    [labels, notes, setLabelsStore, setNotes]
  )

  return (
    <div className="relative flex h-full">
      {expanded ? (
        <NotesSidebar
          theme={theme}
          activeView={view}
          labels={labels}
          counts={counts}
          onChangeView={handleChangeView}
          onCreateLabel={handleCreateLabelStandalone}
          onRenameLabel={handleRenameLabel}
          onRemoveLabel={handleRemoveLabel}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <NotesHeader
          theme={theme}
          activeView={view}
          labels={labels}
          counts={counts}
          onChangeView={handleChangeView}
          onCreateLabel={handleCreateLabelStandalone}
          onRenameLabel={handleRenameLabel}
          onRemoveLabel={handleRemoveLabel}
          searchOpen={searchOpen}
          query={query}
          onToggleSearch={() => setSearchOpen(true)}
          onQueryChange={setQuery}
          onCloseSearch={handleCloseSearch}
          expanded={expanded}
          canExpand={canExpand}
          layout={notesUi.layout}
          onToggleExpanded={handleToggleExpanded}
          onToggleLayout={handleToggleLayout}
        />
        <NotesComposer theme={theme} onSubmit={handleSubmit} error={composerError} />
        <NotesGrid
          notes={displayed}
          now={now}
          theme={theme}
          labels={labels}
          columns={expanded && notesUi.layout === "grid" ? 2 : 1}
          groupPinned={view === "all" && !searching}
          emptyHint={empty.hint}
          EmptyIcon={empty.Icon}
          onTogglePin={handleTogglePin}
          onToggleArchive={handleToggleArchive}
          onDelete={handleDelete}
          showDeleteAction={view === "archived"}
          onOpen={setEditingId}
        />
      </div>

      {editingNote ? (
        <NoteEditor
          key={editingNote.id}
          note={editingNote}
          theme={theme}
          allLabels={labels}
          onPatch={handlePatch}
          onSetColor={handleSetColor}
          onToggleLabel={handleToggleLabel}
          onCreateLabel={handleCreateLabel}
          onTogglePin={handleTogglePin}
          onToggleArchive={handleToggleArchive}
          onDelete={handleDelete}
          onClose={() => setEditingId(null)}
        />
      ) : null}
    </div>
  )
}
