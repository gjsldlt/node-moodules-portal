'use server'

import crypto from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Admin login Server Action.
 *
 * Contract:
 * - Compares submitted password to ADMIN_PASSWORD with timing-safe comparison.
 * - On success: sets httpOnly tp_admin_token cookie containing ADMIN_SESSION_TOKEN.
 * - On failure: returns an error message string.
 *
 * ADMIN_PASSWORD never leaves this server-only action.
 */
export async function loginAdmin(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const submitted = formData.get('password')

  if (typeof submitted !== 'string' || submitted.length === 0) {
    return 'Password is required.'
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  const sessionToken = process.env.ADMIN_SESSION_TOKEN

  if (!adminPassword || !sessionToken) {
    // Environment is misconfigured — fail safe
    return 'Server configuration error. Contact the admin.'
  }

  // Timing-safe comparison using Node crypto
  const submittedBuf = Buffer.from(submitted)
  const expectedBuf = Buffer.from(adminPassword)

  // Buffers must be the same length for timingSafeEqual — pad to the longer
  const length = Math.max(submittedBuf.length, expectedBuf.length)
  const a = Buffer.alloc(length)
  const b = Buffer.alloc(length)
  submittedBuf.copy(a)
  expectedBuf.copy(b)

  const passwordMatches = crypto.timingSafeEqual(a, b)
    && submittedBuf.length === expectedBuf.length

  if (!passwordMatches) {
    return 'Incorrect password.'
  }

  const cookieStore = await cookies()
  cookieStore.set('tp_admin_token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: 86400, // 24 hours
  })

  redirect('/admin')
}
