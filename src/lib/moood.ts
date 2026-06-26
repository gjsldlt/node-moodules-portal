// Shared constants and date utilities for the Moood page.
// Pure functions — no side effects, safe to import on server and client.

export interface MoodOption {
  key: 'great' | 'good' | 'okay' | 'meh' | 'rough'
  emoji: string
  label: string
  /** Hex color — used for bars, chips, and graph bars. Data-driven so inline style is acceptable. */
  color: string
  score: number
}

export const MOODS: MoodOption[] = [
  { key: 'great', emoji: '😄', label: 'Great', color: '#86bc25', score: 5 },
  { key: 'good',  emoji: '🙂', label: 'Good',  color: '#0097a9', score: 4 },
  { key: 'okay',  emoji: '😐', label: 'Okay',  color: '#ffcd00', score: 3 },
  { key: 'meh',   emoji: '😕', label: 'Meh',   color: '#ed8b00', score: 2 },
  { key: 'rough', emoji: '😣', label: 'Rough', color: '#da291c', score: 1 },
]

export const CONFETTI_COLORS = [
  '#86bc25',
  '#0097a9',
  '#62b5e5',
  '#da291c',
  '#ed8b00',
  '#ffcd00',
]

/** Brand palette for the word cloud — same 6 as confetti */
export const BRAND_PALETTE = [
  '#86bc25',
  '#0097a9',
  '#62b5e5',
  '#da291c',
  '#ed8b00',
  '#ffcd00',
]

// ─── ISO week helpers ─────────────────────────────────────────────────────────

/**
 * Returns the Monday 00:00:00 (local midnight) of the ISO week containing `date`.
 * ISO 8601: week starts on Monday.
 */
export function getISOWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  // getDay() → 0=Sun … 6=Sat; convert to Mon=0 … Sun=6
  const day = (d.getDay() + 6) % 7 // 0=Mon, 6=Sun
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Format a Date as "YYYY-MM-DD" using local time. */
export function getISODateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Returns an array of Mon–Fri Date objects for the week starting at `weekStart`. */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

/**
 * Returns true if `dateStr` (YYYY-MM-DD) is on or after the current ISO Monday.
 * Used to gate edits — only current-week entries are editable.
 */
export function isEditableDate(dateStr: string): boolean {
  const weekStart = getISOWeekStart(new Date())
  const weekStartStr = getISODateStr(weekStart)
  return dateStr >= weekStartStr
}

/** Returns true if `dateStr` is in the future (strictly after today). */
export function isFutureDate(dateStr: string): boolean {
  return dateStr > getISODateStr(new Date())
}

/** Returns today's date string "YYYY-MM-DD" in local time. */
export function getTodayStr(): string {
  return getISODateStr(new Date())
}

/** Look up a MoodOption by its key. */
export function getMoodByKey(key: string): MoodOption | undefined {
  return MOODS.find((m) => m.key === key)
}

/** Simple djb2-style hash for a string → non-negative integer. */
export function hashStr(s: string): number {
  let hash = 5381
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) ^ s.charCodeAt(i)
  }
  return hash >>> 0
}

/** Assign a brand palette color to a word deterministically. */
export function wordColor(word: string): string {
  return BRAND_PALETTE[hashStr(word.toLowerCase()) % BRAND_PALETTE.length]
}

/** Assign a rotation in [-8, +8] degrees to a word, seeded by the word itself. */
export function wordRotation(word: string): number {
  const h = hashStr(word.toLowerCase())
  // Map 0–0xFFFFFFFF → -8 … +8
  return ((h % 17) - 8)
}
