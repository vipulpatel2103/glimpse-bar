// Tiny date helpers for the Notes phase. Avoids pulling date-fns/dayjs.
// All functions operate on local time. `now` is a parameter so the formatter
// stays deterministic / testable.

const MS_PER_MIN = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MIN

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
const SHORT_MONTH = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
] as const

function clock(ts: number): string {
  const d = new Date(ts)
  let h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, "0")
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m} ${ampm}`
}

/**
 * Per ui-spec.md §4.5:
 * - < 1 min ago → "Just now"
 * - < 60 min ago → "Nm ago"
 * - same calendar day → "h:mm a"
 * - previous calendar day → "Yesterday"
 * - within current calendar week (last 6 days) → 3-letter weekday
 * - beyond → "MMM D" (+ ", YYYY" if not the current year)
 */
export function formatNoteDate(updatedAt: number, now: number): string {
  const diff = now - updatedAt
  if (diff < MS_PER_MIN) return "Just now"
  if (diff < MS_PER_HOUR) return `${Math.floor(diff / MS_PER_MIN)}m ago`

  const today = startOfDay(now)
  const noteDay = startOfDay(updatedAt)
  const dayDelta = Math.round((today - noteDay) / (24 * MS_PER_HOUR))

  if (dayDelta === 0) return clock(updatedAt)
  if (dayDelta === 1) return "Yesterday"
  if (dayDelta > 1 && dayDelta <= 6) return SHORT_DAY[new Date(updatedAt).getDay()]

  const d = new Date(updatedAt)
  const base = `${SHORT_MONTH[d.getMonth()]} ${d.getDate()}`
  return d.getFullYear() === new Date(now).getFullYear()
    ? base
    : `${base}, ${d.getFullYear()}`
}
