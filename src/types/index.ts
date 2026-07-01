export interface LocalUser {
  nickname: string
  color: string
  emoji: string
}

export type NicknameResolveResult =
  | { status: 'created'; user: LocalUser }
  | { status: 'exists';  user: LocalUser }
  | { status: 'error';   message: string }

export interface NicknameContextValue {
  nickname: string | null
  avatar: { color: string; emoji: string; badge?: string } | null
  triggerSwitch: () => void
  triggerEdit: () => void
}

export type UpdateProfileResult =
  | { status: 'ok'; user: LocalUser }
  | { status: 'error'; field?: 'nickname'; message: string }

export interface LocalMoodEntry {
  key: 'great' | 'good' | 'okay' | 'meh' | 'rough'
  word: string | null
  week: number
  year: number
}

export type LocalReminderState = Record<string, boolean> // reminderId → ticked

export interface LocalTeamDist {
  dist: Record<string, number> // mood key → count
  base: number                  // week number this was fetched for
}

export interface QotdQuestion {
  id: string
  text: string
}

export interface QotdSuitcase {
  number: number
  questionId: string
  opened: boolean
}

import type { Database } from '@/lib/supabase/types'

export type UserRow = Database['public']['Tables']['users']['Row']
export type AnnouncementRow = Database['public']['Tables']['announcements']['Row']
export type ReminderRow = Database['public']['Tables']['reminders']['Row']
export type CompletionRow = Database['public']['Tables']['reminder_completions']['Row']
