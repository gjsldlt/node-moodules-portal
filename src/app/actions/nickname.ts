'use server'

import { createClient } from '@/lib/supabase/server'
import { getAvatar, AVATAR_PALETTE, AVATAR_EMOJIS } from '@/lib/identity'
import type { NicknameResolveResult, UpdateProfileResult, LocalUser } from '@/types'

const NICKNAME_REGEX = /^[a-zA-Z0-9 \-]+$/

/**
 * Resolve a nickname against the users table.
 *
 * - New nickname → INSERT row, return status: 'created'
 * - Existing nickname → UPDATE last_seen_at, return status: 'exists'
 * - Validation failure or DB error → return status: 'error'
 *
 * Never throws. All paths return NicknameResolveResult.
 */
export async function resolveNickname(nickname: string): Promise<NicknameResolveResult> {
  const trimmed = nickname.trim()

  // Validation
  if (trimmed.length < 2) {
    return { status: 'error', message: 'Nickname must be at least 2 characters.' }
  }
  if (trimmed.length > 30) {
    return { status: 'error', message: 'Nickname must be 30 characters or fewer.' }
  }
  if (!NICKNAME_REGEX.test(trimmed)) {
    return { status: 'error', message: 'Only letters, numbers, spaces, and hyphens allowed.' }
  }

  try {
    const supabase = await createClient()

    // citext column handles case-insensitive equality automatically
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('nickname', trimmed)
      .maybeSingle()

    if (selectError) {
      console.error('[resolveNickname] select error:', selectError)
      return { status: 'error', message: 'Something went wrong. Try again.' }
    }

    if (!existing) {
      // New user — compute avatar and insert
      const avatar = getAvatar(trimmed)

      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({
          nickname: trimmed,
          avatar_color: avatar.color,
          avatar_emoji: avatar.emoji,
        })
        .select('*')
        .single()

      if (insertError || !inserted) {
        console.error('[resolveNickname] insert error:', insertError)
        return { status: 'error', message: 'Something went wrong. Try again.' }
      }

      const user: LocalUser = {
        nickname: inserted.nickname,
        color: inserted.avatar_color,
        emoji: inserted.avatar_emoji,
      }
      return { status: 'created', user }
    }

    // Existing user — update last_seen_at
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id)

    if (updateError) {
      // Non-fatal — still treat as exists; log and continue
      console.error('[resolveNickname] update error:', updateError)
    }

    const user: LocalUser = {
      nickname: existing.nickname,
      color: existing.avatar_color,
      emoji: existing.avatar_emoji,
    }
    return { status: 'exists', user }
  } catch (err) {
    console.error('[resolveNickname] unexpected error:', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }
}

/**
 * Validate an existing session on page load.
 *
 * - Nickname found in DB → update last_seen_at, return 'valid'
 * - Nickname NOT found   → account was deleted, return 'deleted'
 * - DB/network error     → return 'valid' (fail-safe: don't lock out on transient errors)
 *
 * Never creates a new row — that is resolveNickname's job.
 */
export async function validateSession(nickname: string): Promise<'valid' | 'deleted'> {
  const trimmed = nickname.trim()
  if (!trimmed) return 'deleted'

  try {
    const supabase = await createClient()

    const { data: existing, error } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', trimmed)
      .maybeSingle()

    if (error) {
      console.error('[validateSession] select error:', error)
      return 'valid' // fail-safe
    }

    if (!existing) return 'deleted'

    // Background last_seen_at update — ignore errors
    supabase
      .from('users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id)
      .then(() => {}, () => {})

    return 'valid'
  } catch {
    return 'valid' // fail-safe on network error
  }
}

/**
 * Update a user's nickname, avatar color, and/or emoji.
 * Identified by their current nickname (service role bypasses RLS).
 * Never throws. All paths return UpdateProfileResult.
 */
export async function updateUserProfile(
  currentNickname: string,
  updates: { nickname: string; avatarColor: string; avatarEmoji: string },
): Promise<UpdateProfileResult> {
  const trimmedNew = updates.nickname.trim()
  const trimmedCurrent = currentNickname.trim()

  if (trimmedNew.length < 2) {
    return { status: 'error', field: 'nickname', message: 'Nickname must be at least 2 characters.' }
  }
  if (trimmedNew.length > 30) {
    return { status: 'error', field: 'nickname', message: 'Nickname must be 30 characters or fewer.' }
  }
  if (!NICKNAME_REGEX.test(trimmedNew)) {
    return { status: 'error', field: 'nickname', message: 'Only letters, numbers, spaces, and hyphens allowed.' }
  }
  if (!(AVATAR_PALETTE as readonly string[]).includes(updates.avatarColor)) {
    return { status: 'error', message: 'Invalid avatar color.' }
  }
  if (!(AVATAR_EMOJIS as readonly string[]).includes(updates.avatarEmoji)) {
    return { status: 'error', message: 'Invalid avatar emoji.' }
  }

  try {
    const supabase = await createClient()

    const nicknameChanged = trimmedNew.toLowerCase() !== trimmedCurrent.toLowerCase()

    if (nicknameChanged) {
      const { data: taken } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', trimmedNew)
        .maybeSingle()

      if (taken) {
        return { status: 'error', field: 'nickname', message: "That nickname's already taken." }
      }
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update({
        nickname: trimmedNew,
        avatar_color: updates.avatarColor,
        avatar_emoji: updates.avatarEmoji,
        last_seen_at: new Date().toISOString(),
      })
      .eq('nickname', trimmedCurrent)
      .select('*')
      .single()

    if (error || !updated) {
      console.error('[updateUserProfile] update error:', error)
      return { status: 'error', message: 'Something went wrong. Try again.' }
    }

    return {
      status: 'ok',
      user: {
        nickname: updated.nickname,
        color: updated.avatar_color,
        emoji: updated.avatar_emoji,
      },
    }
  } catch (err) {
    console.error('[updateUserProfile] unexpected error:', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }
}
