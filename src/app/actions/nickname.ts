'use server'

import { createClient } from '@/lib/supabase/server'
import { getAvatar } from '@/lib/identity'
import type { NicknameResolveResult, LocalUser } from '@/types'

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
