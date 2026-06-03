// Single source of truth for Notes phase caps. Imported by the editor (counter
// + maxLength), the mutations layer (truncation + rejection), the background SW
// (capture truncation), and the options page (count banner).

export const NOTE_LIMITS = {
  /** Max characters in a note title. */
  TITLE_MAX: 200,
  /** Max characters in a note body (Markdown source). */
  BODY_MAX: 10_000,
  /** Counter turns amber at/above this body length. */
  BODY_WARN: 9_000,
  /** Max characters per checklist item. */
  CHECKLIST_ITEM_MAX: 280,
  /** Max checklist items in a single note. */
  CHECKLIST_PER_NOTE: 200,
  /** Max labels assigned to a single note. */
  LABELS_PER_NOTE: 20,
  /** Hard cap on total notes (archived included). */
  TOTAL_NOTES_MAX: 100,
  /** Options page count row turns amber at/above this. */
  TOTAL_NOTES_WARN: 90
} as const

export type NoteLimits = typeof NOTE_LIMITS

/** Clamp a string to a max length. Returns the (possibly truncated) value. */
export function clampLen(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value
}
