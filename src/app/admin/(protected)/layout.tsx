import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminProtectedLayout({ children }: AdminLayoutProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get('tp_admin_token')?.value
  const expectedToken = process.env.ADMIN_SESSION_TOKEN

  if (!token || !expectedToken || token !== expectedToken) {
    redirect('/admin/login')
  }

  return <>{children}</>
}
