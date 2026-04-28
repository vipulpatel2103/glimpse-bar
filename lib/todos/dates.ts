// Tiny date helpers for the TODO phase. Avoids pulling date-fns/dayjs.
// All functions operate on local time. `now` is a parameter so selectors
// can be tested deterministically and so the rollover ticker can pin time.

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function endOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

export function addDays(ts: number, n: number): number {
  // Use Date arithmetic (not raw ms) to handle DST transitions correctly.
  const d = new Date(ts)
  d.setDate(d.getDate() + n)
  return d.getTime()
}

/** `YYYY-MM-DD` for the local day containing `ts`. Suitable as a group key. */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function isSameDay(a: number, b: number): boolean {
  return dayKey(a) === dayKey(b)
}

export function isOverdue(dueAt: number, now: number): boolean {
  return dueAt < startOfDay(now)
}

/** Days between start-of-day(`a`) and start-of-day(`b`). Sign indicates direction. */
export function diffInDays(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / MS_PER_DAY)
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

/**
 * Per ui-spec.md §4.4:
 * - same calendar day as `now` → "Today"
 * - next day → "Tomorrow"
 * - within next 6 days → 3-letter weekday (Mon..Sun)
 * - past or beyond 7 days → "MMM D"
 */
export function formatDayLabel(ts: number, now: number): string {
  const delta = diffInDays(now, ts)
  if (delta === 0) return "Today"
  if (delta === 1) return "Tomorrow"
  if (delta > 1 && delta <= 6) return SHORT_DAY[new Date(ts).getDay()]
  const d = new Date(ts)
  return `${SHORT_MONTH[d.getMonth()]} ${d.getDate()}`
}

/** Verbose tooltip: "Due Thu" / "Due Apr 30" / "Overdue — was due Apr 25". */
export function formatDueTooltip(ts: number, now: number): string {
  if (isOverdue(ts, now)) {
    return `Overdue — was due ${formatDayLabel(ts, now)}`
  }
  return `Due ${formatDayLabel(ts, now)}`
}

/**
 * Day index in JS `Date#getDay`: 0 = Sunday … 6 = Saturday.
 * Returns the next start-of-day matching `targetDow` strictly after `now`'s day.
 * If today already matches, returns 7 days out (next occurrence).
 */
export function nextDayOfWeek(now: number, targetDow: number): number {
  const today = startOfDay(now)
  const todayDow = new Date(today).getDay()
  let delta = targetDow - todayDow
  if (delta <= 0) delta += 7
  return addDays(today, delta)
}

/** Quick-chip helpers — return a `dueAt` value (start-of-day local). */
export const chipToday = (now: number) => startOfDay(now)
export const chipTomorrow = (now: number) => addDays(startOfDay(now), 1)
/** Next Saturday. If today is Saturday, jumps to next Saturday (7 days). */
export const chipThisWeekend = (now: number) => nextDayOfWeek(now, 6)
/** Next Monday. */
export const chipNextWeek = (now: number) => nextDayOfWeek(now, 1)
