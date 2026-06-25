// Deterministic avatar generation from nickname.
// Hash + modulo — same input always produces the same color and emoji.

export const AVATAR_PALETTE = [
  '#86bc25',
  '#0097a9',
  '#62b5e5',
  '#da291c',
  '#ed8b00',
  '#009a44',
] as const

export const AVATAR_EMOJIS = [
  '🦊', '🐼', '🐯', '🦄', '🐙', '🐵', '🦁', '🐨', '🐸', '🐳', '🦉', '🐝',
] as const

/**
 * djb2 hash — deterministic, non-negative integer from a string.
 */
export function hashNickname(nickname: string): number {
  let hash = 5381
  for (let i = 0; i < nickname.length; i++) {
    hash = ((hash << 5) + hash) ^ nickname.charCodeAt(i)
  }
  // Force positive via unsigned right-shift
  return hash >>> 0
}

export function getAvatarColor(nickname: string): string {
  return AVATAR_PALETTE[hashNickname(nickname) % AVATAR_PALETTE.length]
}

export function getAvatarEmoji(nickname: string): string {
  return AVATAR_EMOJIS[hashNickname(nickname) % AVATAR_EMOJIS.length]
}

export function getAvatar(nickname: string): { color: string; emoji: string } {
  return {
    color: getAvatarColor(nickname),
    emoji: getAvatarEmoji(nickname),
  }
}

/**
 * Lowercase + trim — for case-insensitive nickname comparison.
 */
export function normalizeNickname(nickname: string): string {
  return nickname.trim().toLowerCase()
}
