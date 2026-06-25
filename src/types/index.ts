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
  triggerSwitch: () => void
}

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

import type { Database } from '@/lib/supabase/types'

export type AnnouncementRow = Database['public']['Tables']['announcements']['Row']
export type ReminderRow = Database['public']['Tables']['reminders']['Row']
export type CompletionRow = Database['public']['Tables']['reminder_completions']['Row']
