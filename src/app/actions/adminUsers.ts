'use server'

import { checkIsAdmin } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'
import { AVATAR_PALETTE, AVATAR_EMOJIS } from '@/lib/identity'
import type { UserRow } from '@/types'

const NICKNAME_REGEX = /^[a-zA-Z0-9 \-]+$/

type UserResult = { status: 'ok'; user: UserRow } | { status: 'error'; message: string }
type DeleteResult = { status: 'ok' } | { status: 'error'; message: string }

function validateNickname(nickname: string): string | null {
  const t = nickname.trim()
  if (t.length < 2)  return 'Nickname must be at least 2 characters.'
  if (t.length > 30) return 'Nickname must be 30 characters or fewer.'
  if (!NICKNAME_REGEX.test(t)) return 'Only letters, numbers, spaces, and hyphens allowed.'
  return null
}

export async function adminCreateUser(
  nickname: string,
  avatarColor: string,
  avatarEmoji: string,
): Promise<UserResult> {
  if (!(await checkIsAdmin())) return { status: 'error', message: 'Unauthorized.' }

  const trimmed = nickname.trim()
  const nicknameError = validateNickname(trimmed)
  if (nicknameError) return { status: 'error', message: nicknameError }
  if (!(AVATAR_PALETTE as readonly string[]).includes(avatarColor))
    return { status: 'error', message: 'Invalid avatar color.' }
  if (!(AVATAR_EMOJIS as readonly string[]).includes(avatarEmoji))
    return { status: 'error', message: 'Invalid avatar emoji.' }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('users').select('id').eq('nickname', trimmed).maybeSingle()
  if (existing) return { status: 'error', message: 'That nickname is already taken.' }

  const { data: created, error } = await supabase
    .from('users')
    .insert({ nickname: trimmed, avatar_color: avatarColor, avatar_emoji: avatarEmoji })
    .select('*')
    .single()

  if (error || !created) {
    console.error('[adminCreateUser]', error)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  return { status: 'ok', user: created }
}

export async function adminUpdateUser(
  id: string,
  nickname: string,
  avatarColor: string,
  avatarEmoji: string,
): Promise<UserResult> {
  if (!(await checkIsAdmin())) return { status: 'error', message: 'Unauthorized.' }

  const trimmed = nickname.trim()
  const nicknameError = validateNickname(trimmed)
  if (nicknameError) return { status: 'error', message: nicknameError }
  if (!(AVATAR_PALETTE as readonly string[]).includes(avatarColor))
    return { status: 'error', message: 'Invalid avatar color.' }
  if (!(AVATAR_EMOJIS as readonly string[]).includes(avatarEmoji))
    return { status: 'error', message: 'Invalid avatar emoji.' }

  const supabase = await createClient()

  const { data: current } = await supabase
    .from('users').select('nickname').eq('id', id).single()
  if (!current) return { status: 'error', message: 'User not found.' }

  if (current.nickname.toLowerCase() !== trimmed.toLowerCase()) {
    const { data: taken } = await supabase
      .from('users').select('id').eq('nickname', trimmed).maybeSingle()
    if (taken) return { status: 'error', message: "That nickname's already taken." }
  }

  const { data: updated, error } = await supabase
    .from('users')
    .update({ nickname: trimmed, avatar_color: avatarColor, avatar_emoji: avatarEmoji })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !updated) {
    console.error('[adminUpdateUser]', error)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  return { status: 'ok', user: updated }
}

export async function adminDeleteUser(id: string): Promise<DeleteResult> {
  if (!(await checkIsAdmin())) return { status: 'error', message: 'Unauthorized.' }

  const supabase = await createClient()

  const { error } = await supabase.from('users').delete().eq('id', id)

  if (error) {
    console.error('[adminDeleteUser]', error)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  return { status: 'ok' }
}
