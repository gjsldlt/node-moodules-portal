import { createClient } from '@/lib/supabase/server'
import { UsersClient } from './UsersClient'

export const metadata = { title: 'Users — Admin · Node Moodus' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return <UsersClient initialUsers={users ?? []} />
}
