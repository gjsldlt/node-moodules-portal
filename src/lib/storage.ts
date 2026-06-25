// All localStorage keys as constants. tp_admin_token is intentionally absent —
// it lives in an httpOnly cookie, never in localStorage.
export const STORAGE_KEYS = {
  NICKNAME:    'tp_nickname',
  THEME:       'tp_theme',
  MOOD:        (nick: string) => `tp_mood_${nick}`,
  REMINDERS:   (nick: string) => `tp_rem_${nick}`,
  TEAM_DIST:   'tp_team_dist',
  KNOWN_USERS: 'tp_known_users',
} as const

const isClient = typeof window !== 'undefined'

/**
 * Read and JSON-parse a value from localStorage.
 * Returns null on SSR, parse failure, or missing key.
 */
export function storageGet<T>(key: string): T | null {
  if (!isClient) return null
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * JSON-serialize and write a value to localStorage.
 * No-op on SSR.
 */
export function storageSet<T>(key: string, value: T): void {
  if (!isClient) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore write errors (private browsing quota, etc.)
  }
}

/**
 * Remove a single key from localStorage.
 * No-op on SSR.
 */
export function storageRemove(key: string): void {
  if (!isClient) return
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore
  }
}

/**
 * Clear all tp_* keys from localStorage (used on user switch).
 * No-op on SSR.
 */
export function storageClear(): void {
  if (!isClient) return
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('tp_')) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }
  } catch {
    // Ignore
  }
}
