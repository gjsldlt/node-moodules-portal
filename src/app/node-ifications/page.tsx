import { createClient } from '@/lib/supabase/server'
import { getISOWeek } from '@/lib/week'
import { checkIsAdmin } from '@/lib/admin'
import { NodeificationsHero } from '@/components/node-ifications/NodeificationsHero'
import { NodeificationsClient } from '@/components/node-ifications/NodeificationsClient'

export default async function NodeificationsPage() {
  const supabase = await createClient()
  const { week, year } = getISOWeek()

  const [
    { data: announcementsData },
    { data: remindersData },
    { data: completionsData },
    { count: moodCount },
    isAdmin,
  ] = await Promise.all([
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('reminders').select('*').eq('resolved', false).order('created_at', { ascending: false }),
    supabase.from('reminder_completions').select('*').limit(500),
    supabase
      .from('mood_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('week_number', week)
      .eq('year', year),
    checkIsAdmin(),
  ])

  const announcements = announcementsData ?? []
  const reminders = remindersData ?? []
  const completions = completionsData ?? []
  const openReminderCount = reminders.length
  const weeklyCheckinCount = moodCount ?? 0

  return (
    <main
      style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: 'clamp(20px,4vw,40px) clamp(20px,4vw,40px) 64px',
      }}
    >
      <NodeificationsHero
        openReminderCount={openReminderCount}
        weeklyCheckinCount={weeklyCheckinCount}
      />
      <NodeificationsClient
        initialAnnouncements={announcements}
        initialReminders={reminders}
        initialCompletions={completions}
        isAdmin={isAdmin}
      />
    </main>
  )
}
