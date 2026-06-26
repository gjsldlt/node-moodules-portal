'use server'

// All Moood page mutations go through these Server Actions.
// The service role key is never exposed to the client.
// Authorization: nickname-equality check (same model as node-ifications).
// Date guard: only current-week dates (>= ISO Monday) are writable.

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getISOWeekStart, getISODateStr, isEditableDate } from '@/lib/moood'
import type { Database } from '@/lib/supabase/types'

export type MoodEntry = Database['public']['Tables']['mood_entries']['Row']
export type DailyWord  = Database['public']['Tables']['daily_words']['Row']

// ─── submitMoodEntry ──────────────────────────────────────────────────────────

export async function submitMoodEntry(data: {
  nickname: string
  entry_date: string
  score: number
  mood_key: string
}): Promise<{ error?: string }> {
  const { nickname, entry_date, score, mood_key } = data

  // Validate
  if (!nickname || nickname.trim().length < 2) return { error: 'Invalid nickname.' }
  if (!['great', 'good', 'okay', 'meh', 'rough'].includes(mood_key)) {
    return { error: 'Invalid mood key.' }
  }
  if (score < 1 || score > 5 || !Number.isInteger(score)) {
    return { error: 'Score must be 1–5.' }
  }
  if (!isEditableDate(entry_date)) {
    return { error: 'Past-week entries cannot be edited.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('mood_entries')
    .upsert(
      {
        nickname: nickname.trim(),
        entry_date,
        score,
        mood_key,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'nickname,entry_date' },
    )

  if (error) return { error: error.message }

  revalidatePath('/moood')
  return {}
}

// ─── submitDailyWord ──────────────────────────────────────────────────────────

export async function submitDailyWord(data: {
  nickname: string
  entry_date: string
  word: string
}): Promise<{ error?: string }> {
  const { nickname, entry_date, word } = data

  // Validate
  if (!nickname || nickname.trim().length < 2) return { error: 'Invalid nickname.' }
  const trimmedWord = word.trim()
  if (!trimmedWord || trimmedWord.length < 1 || trimmedWord.length > 20) {
    return { error: 'Word must be 1–20 characters.' }
  }
  if (/\s/.test(trimmedWord)) {
    return { error: 'Word must be a single token (no spaces).' }
  }
  if (!isEditableDate(entry_date)) {
    return { error: 'Past-week entries cannot be edited.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('daily_words')
    .upsert(
      {
        nickname: nickname.trim(),
        word: trimmedWord,
        entry_date,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'nickname,entry_date' },
    )

  if (error) return { error: error.message }

  revalidatePath('/moood')
  return {}
}

// ─── getMoodEntries ───────────────────────────────────────────────────────────

export async function getMoodEntries(params: {
  from: string
  to: string
}): Promise<MoodEntry[]> {
  const { from, to } = params
  const supabase = await createClient()
  const { data } = await supabase
    .from('mood_entries')
    .select('*')
    .gte('entry_date', from)
    .lte('entry_date', to)
    .order('entry_date', { ascending: true })
  return data ?? []
}

// ─── getDailyWords ────────────────────────────────────────────────────────────

export async function getDailyWords(params: {
  from: string
  to: string
}): Promise<DailyWord[]> {
  const { from, to } = params
  const supabase = await createClient()
  const { data } = await supabase
    .from('daily_words')
    .select('*')
    .gte('entry_date', from)
    .lte('entry_date', to)
    .order('entry_date', { ascending: true })
  return data ?? []
}

// ─── getTrendEntries ─────────────────────────────────────────────────────────
// Returns mood_entries for the last 6 weeks (used for trend bars).

export async function getTrendEntries(): Promise<MoodEntry[]> {
  const sixWeeksAgo = new Date()
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)
  const from = getISODateStr(sixWeeksAgo)
  const to   = getISODateStr(new Date())

  const supabase = await createClient()
  const { data } = await supabase
    .from('mood_entries')
    .select('*')
    .gte('entry_date', from)
    .lte('entry_date', to)
    .order('entry_date', { ascending: true })
  return data ?? []
}

// Helper re-exported so page.tsx can call it without a second import
export { getISODateStr, getISOWeekStart }
