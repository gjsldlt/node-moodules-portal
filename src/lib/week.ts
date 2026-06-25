// ISO 8601 week number utilities — pure arithmetic, no external date library.
// ISO week: week 1 is the week containing the first Thursday of January.
// The week-year may differ from the calendar year near year boundaries.

/**
 * Returns the ISO week number (1–53) and ISO week-year for a given date.
 * Defaults to today if no date is supplied.
 */
export function getISOWeek(date: Date = new Date()): { week: number; year: number } {
  // Copy so we don't mutate the caller's date
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

  // Set to nearest Thursday: current date + 4 - current day number (Monday = 1)
  const dayNum = d.getUTCDay() || 7 // Sunday → 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)

  // ISO week year is the year of the Thursday we just calculated
  const year = d.getUTCFullYear()

  // ISO week 1 starts on the Monday of the week containing Jan 4
  // (Jan 4 is always in week 1 per ISO 8601)
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1))

  const week = Math.round((d.getTime() - week1Monday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1

  return { week, year }
}

/**
 * Returns a stable string key for a user's mood submission for a given week.
 * Format: `{nickname}_{year}_W{week}` e.g. "alice_2026_W26"
 */
export function getMoodWeekKey(nickname: string, date: Date = new Date()): string {
  const { week, year } = getISOWeek(date)
  return `${nickname}_${year}_W${week}`
}
