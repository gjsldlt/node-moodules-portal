'use server'

import { createClient } from '@/lib/supabase/server'
import { getAvatar, AVATAR_PALETTE, AVATAR_EMOJIS, AVATAR_BADGES } from '@/lib/identity'
import type { NicknameResolveResult, UpdateProfileResult, LocalUser } from '@/types'

const NICKNAME_REGEX = /^[a-zA-Z0-9 \-]+$/

function rowToLocalUser(row: {
  nickname: string
  avatar_color: string
  avatar_emoji: string
  avatar_badge: string
}): LocalUser {
  return {
    nickname: row.nickname,
    color: row.avatar_color,
    emoji: row.avatar_emoji,
    badge: row.avatar_badge ?? 'none',
  }
}

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
      const avatar = getAvatar(trimmed)

      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({
          nickname: trimmed,
          avatar_color: avatar.color,
          avatar_emoji: avatar.emoji,
          avatar_badge: 'none',
        })
        .select('*')
        .single()

      if (insertError || !inserted) {
        console.error('[resolveNickname] insert error:', insertError)
        return { status: 'error', message: 'Something went wrong. Try again.' }
      }

      return { status: 'created', user: rowToLocalUser(inserted) }
    }

    // Existing user — update last_seen_at in background
    supabase
      .from('users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id)
      .then(() => {}, () => {})

    return { status: 'exists', user: rowToLocalUser(existing) }
  } catch (err) {
    console.error('[resolveNickname] unexpected error:', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }
}

/**
 * Validate an existing session on page load.
 *
 * - Nickname found in DB → update last_seen_at, return { status: 'valid', user }
 * - Nickname NOT found   → account was deleted, return { status: 'deleted' }
 * - DB/network error     → return { status: 'valid', user: null } (fail-safe: don't lock out on transient errors)
 *
 * Never creates a new row — that is resolveNickname's job.
 * Returns fresh user data so callers can sync avatar state from DB on every load.
 */
export async function validateSession(
  nickname: string,
): Promise<{ status: 'valid'; user: LocalUser } | { status: 'deleted' }> {
  const trimmed = nickname.trim()
  if (!trimmed) return { status: 'deleted' }

  try {
    const supabase = await createClient()

    const { data: existing, error } = await supabase
      .from('users')
      .select('*')
      .eq('nickname', trimmed)
      .maybeSingle()

    if (error) {
      console.error('[validateSession] select error:', error)
      // Fail-safe: treat as valid with locally-stored data
      return { status: 'valid', user: { nickname: trimmed, color: '', emoji: '', badge: 'none' } }
    }

    if (!existing) return { status: 'deleted' }

    // Background last_seen_at update — ignore errors
    supabase
      .from('users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id)
      .then(() => {}, () => {})

    return { status: 'valid', user: rowToLocalUser(existing) }
  } catch {
    // Fail-safe on network error — return with empty avatar so caller keeps localStorage values
    return { status: 'valid', user: { nickname: trimmed, color: '', emoji: '', badge: 'none' } }
  }
}

/**
 * Update a user's nickname, avatar color, emoji, and badge.
 * Identified by their current nickname (service role bypasses RLS).
 * Never throws. All paths return UpdateProfileResult.
 */
export async function updateUserProfile(
  currentNickname: string,
  updates: { nickname: string; avatarColor: string; avatarEmoji: string; avatarBadge: string },
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
  if (!AVATAR_BADGES.some((b) => b.id === updates.avatarBadge)) {
    return { status: 'error', message: 'Invalid badge.' }
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
        avatar_badge: updates.avatarBadge,
        last_seen_at: new Date().toISOString(),
      })
      .eq('nickname', trimmedCurrent)
      .select('*')
      .single()

    if (error || !updated) {
      console.error('[updateUserProfile] update error:', error)
      return { status: 'error', message: 'Something went wrong. Try again.' }
    }

    return { status: 'ok', user: rowToLocalUser(updated) }
  } catch (err) {
    console.error('[updateUserProfile] unexpected error:', err)
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }
}
