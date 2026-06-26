'use server'

// Authorization is nickname-equality only — no session tokens exist.
// This is an accepted limitation of the nickname-only identity model.
// The service role key is used server-side; the client never sees it.

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkIsAdmin } from '@/lib/admin'
import type { AnnouncementRow, ReminderRow } from '@/types'

export async function addAnnouncement(input: {
  title: string
  body?: string | null
  emoji?: string | null
  nickname: string
}): Promise<{ data: AnnouncementRow } | { error: string }> {
  const { title, body, emoji, nickname } = input

  if (!title || title.trim().length < 1 || title.trim().length > 80) {
    return { error: 'Title must be 1–80 characters.' }
  }
  if (!nickname || nickname.trim().length < 2) {
    return { error: 'Invalid nickname.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('announcements')
    .insert({ title: title.trim(), body: body ?? null, emoji: emoji ?? null, created_by: nickname, pinned: false })
    .select()
    .single()

  if (error || !data) return { error: error?.message ?? 'Insert failed.' }

  revalidatePath('/node-ifications')
  return { data }
}

export async function deleteAnnouncement(input: {
  id: string
  nickname: string
}): Promise<{ success: true } | { error: string }> {
  const { id, nickname } = input

  const supabase = await createClient()
  const [{ data: row, error: fetchError }, isAdmin] = await Promise.all([
    supabase.from('announcements').select('created_by').eq('id', id).single(),
    checkIsAdmin(),
  ])

  if (fetchError || !row) return { error: 'Announcement not found.' }
  if (!isAdmin && row.created_by.toLowerCase() !== nickname.toLowerCase()) return { error: 'Forbidden' }

  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/node-ifications')
  return { success: true }
}

export async function addReminder(input: {
  title: string
  content?: string | null
  dueDate?: string | null
  dueTime?: string | null
  nickname: string
  type?: 'personal' | 'team'
}): Promise<{ data: ReminderRow } | { error: string }> {
  const { title, content, dueDate, dueTime, nickname, type = 'team' } = input

  if (!title || title.trim().length < 1 || title.trim().length > 120) {
    return { error: 'Title must be 1–120 characters.' }
  }
  if (!nickname || nickname.trim().length < 2) {
    return { error: 'Invalid nickname.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reminders')
    .insert({ title: title.trim(), content: content ?? null, created_by: nickname, resolved: false, due_date: dueDate ?? null, due_time: dueTime ?? null, type })
    .select()
    .single()

  if (error || !data) return { error: error?.message ?? 'Insert failed.' }

  revalidatePath('/node-ifications')
  return { data }
}

export async function toggleReminderCompletion(input: {
  reminderId: string
  nickname: string
  done: boolean
}): Promise<{ success: true } | { error: string }> {
  const { reminderId, nickname, done } = input

  const supabase = await createClient()

  if (done) {
    const { error } = await supabase
      .from('reminder_completions')
      .upsert(
        { reminder_id: reminderId, nickname, completed_at: new Date().toISOString() },
        { onConflict: 'reminder_id,nickname' },
      )
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('reminder_completions')
      .delete()
      .eq('reminder_id', reminderId)
      .eq('nickname', nickname)
    if (error) return { error: error.message }
  }

  return { success: true }
}

export async function resolveReminder(input: {
  id: string
  nickname: string
}): Promise<{ success: true } | { error: string }> {
  const { id, nickname } = input

  const supabase = await createClient()
  const [{ data: row, error: fetchError }, isAdmin] = await Promise.all([
    supabase.from('reminders').select('created_by').eq('id', id).single(),
    checkIsAdmin(),
  ])

  if (fetchError || !row) return { error: 'Reminder not found.' }
  if (!isAdmin && row.created_by.toLowerCase() !== nickname.toLowerCase()) return { error: 'Forbidden' }

  const { error } = await supabase.from('reminders').update({ resolved: true }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/node-ifications')
  return { success: true }
}
