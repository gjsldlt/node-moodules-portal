import { createClient } from '@/lib/supabase/server'
import { WheelOfNamesRoute } from '@/components/games/WheelOfNamesRoute'

export const metadata = { title: 'Wheel of Names — Node Moodus' }

export default async function WheelOfNamesPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('users')
    .select('nickname, avatar_color, avatar_emoji')
    .order('created_at', { ascending: true })

  return <WheelOfNamesRoute participants={users ?? []} />
}
