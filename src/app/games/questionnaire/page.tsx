import { createClient } from '@/lib/supabase/server'
import { QuestionnaireGame } from '@/components/games/questionnaire/QuestionnaireGame'

export const metadata = { title: 'Who Wants to Be a Questionnaire — Node Moodus' }

export default async function QuestionnairePage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('users')
    .select('nickname, avatar_color, avatar_emoji')
    .order('created_at', { ascending: true })

  return (
    <main className="flex-1" style={{ position: 'relative', zIndex: 1 }}>
      <div style={{
        maxWidth: '1180px',
        margin: '0 auto',
        padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,40px) 64px',
      }}>
        <QuestionnaireGame participants={users ?? []} />
      </div>
    </main>
  )
}
