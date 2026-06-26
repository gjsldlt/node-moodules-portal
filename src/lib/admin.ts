import 'server-only'
import { cookies } from 'next/headers'

export async function checkIsAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('tp_admin_token')?.value
  const expected = process.env.ADMIN_SESSION_TOKEN
  return !!token && !!expected && token === expected
}
