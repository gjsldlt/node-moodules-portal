import { createClient } from '@/lib/supabase/server'
import { getISOWeekStart, getISODateStr } from '@/lib/moood'
import { getTrendEntries } from './actions'
import { MooodClient } from '@/components/moood/MooodClient'

export const metadata = {
  title: 'Moood — Node Moodus',
  description: 'Daily mood check-in, word of the day, and team pulse.',
}

export default async function MooodPage() {
  const supabase = await createClient()

  const weekStart    = getISOWeekStart(new Date())
  const weekStartStr = getISODateStr(weekStart)
  const weekEnd      = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekEndStr   = getISODateStr(weekEnd)

  // Fetch all team data for the current week (server-side, no nickname required)
  const [
    { data: moodEntriesRaw },
    { data: dailyWordsRaw },
    trendEntriesRaw,
  ] = await Promise.all([
    supabase
      .from('mood_entries')
      .select('*')
      .gte('entry_date', weekStartStr)
      .lte('entry_date', weekEndStr)
      .order('entry_date', { ascending: true }),
    supabase
      .from('daily_words')
      .select('*')
      .gte('entry_date', weekStartStr)
      .lte('entry_date', weekEndStr)
      .order('entry_date', { ascending: true }),
    getTrendEntries(),
  ])

  const initialMoodEntries = moodEntriesRaw ?? []
  const initialDailyWords  = dailyWordsRaw  ?? []

  // Nickname is localStorage-only — we cannot read it server-side.
  // MoodCheckin and WordOfDay will each read `initialCheckinEntries` /
  // `initialWordEntries` from the server-fetched team data once the client
  // knows the nickname via useNickname().
  // We pass empty maps here; MooodClient fills them after hydration via
  // the nickname from context. This avoids a full client-side refetch for
  // the personal check-in card — the client filters from `initialMoodEntries`.

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
      <MooodClient
        initialMoodEntries={initialMoodEntries}
        initialDailyWords={initialDailyWords}
        trendEntries={trendEntriesRaw}
        weekStart={weekStart}
      />
    </main>
  )
}
