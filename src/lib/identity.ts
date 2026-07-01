// Deterministic avatar generation from nickname.
// Hash + modulo — same input always produces the same color and emoji.

export const AVATAR_PALETTE = [
  // Brand colors
  '#86bc25', '#0097a9', '#62b5e5', '#da291c', '#ed8b00', '#009a44',
  // Extended palette
  '#7c3aed', '#a855f7', '#ec4899', '#e11d48', '#4f46e5', '#06b6d4',
  '#0891b2', '#65a30d', '#d97706', '#b45309', '#475569', '#0f766e',
] as const

export const AVATAR_EMOJIS = [
  '🦊', '🐼', '🐯', '🦄', '🐙', '🐵',
  '🦁', '🐨', '🐸', '🐳', '🦉', '🐝',
  '🐺', '🦋', '🦈', '🐬', '🦅', '🦇',
  '🐰', '🐻', '🐱', '🐶', '🦝', '🦙',
  '🦘', '🦔', '🦦', '🦥', '🐧', '🦭',
  '🦚', '🦜', '🦩', '🦢', '🐢', '🦎',
  '🦕', '🦖', '🐡', '🦑', '🦀', '🦞',
  '🐞', '🦂', '🐿️', '🦃', '🦆', '🦛',
  '🦒', '🐊',
] as const

export type AvatarBadge =
  | { id: string; label: string; variant: 'none' }
  | { id: string; label: string; variant: 'solid'; color: string }
  | { id: string; label: string; variant: 'gradient'; gradient: string }
  | { id: string; label: string; variant: 'glow'; color: string }

export const AVATAR_BADGES: AvatarBadge[] = [
  { id: 'none',    label: 'None',    variant: 'none' },
  { id: 'ring',    label: 'Match',   variant: 'solid',    color: 'auto' },
  { id: 'gold',    label: 'Gold',    variant: 'solid',    color: '#fbbf24' },
  { id: 'pearl',   label: 'Pearl',   variant: 'solid',    color: '#f3f2ee' },
  { id: 'rainbow', label: 'Rainbow', variant: 'gradient', gradient: 'conic-gradient(from 0deg, #ec4899, #ed8b00, #86bc25, #0097a9, #4f46e5, #a855f7, #ec4899)' },
  { id: 'sunset',  label: 'Sunset',  variant: 'gradient', gradient: 'linear-gradient(135deg, #f43f5e, #ed8b00, #fbbf24)' },
  { id: 'ocean',   label: 'Ocean',   variant: 'gradient', gradient: 'linear-gradient(135deg, #4f46e5, #0097a9, #62b5e5)' },
  { id: 'neon',    label: 'Neon',    variant: 'glow',     color: '#0097a9' },
]

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

export function getAnnouncementAccentColor(emoji: string | null | undefined): string {
  if (!emoji) return '#0097a9'
  return AVATAR_PALETTE[hashNickname(emoji) % AVATAR_PALETTE.length]
}
