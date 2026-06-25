'use client'

import { useContext } from 'react'
import { NicknameContext } from '@/components/layout/NicknameGate'
import type { NicknameContextValue } from '@/types'

/**
 * Returns the current user's nickname and the triggerSwitch function.
 * Must be called inside a NicknameProvider ancestor.
 */
export function useNickname(): NicknameContextValue {
  const ctx = useContext(NicknameContext)
  if (!ctx) {
    throw new Error('useNickname must be used inside <NicknameProvider>')
  }
  return ctx
}
