import { getISOWeek } from '@/lib/week'

interface Props {
  openReminderCount: number
  weeklyCheckinCount: number
}

export function NodeificationsHero({ openReminderCount, weeklyCheckinCount }: Props) {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday
  const mondayOffset = (dayOfWeek + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - mondayOffset)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const weekRange = `${fmt(monday)} – ${fmt(friday)}`

  return (
    <section
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '24px',
        animation: 'tpFadeUp .6s cubic-bezier(.2,.7,.3,1) both',
      }}
    >
      <div style={{ flex: 1, minWidth: '280px' }}>
        <div
          style={{
            fontWeight: 700,
            color: 'var(--teal)',
            fontSize: '14px',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}
        >
          {weekRange}
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(30px,5vw,46px)',
            lineHeight: 1.04,
            letterSpacing: '-.025em',
          }}
        >
          Node-ifications{' '}
          <span style={{ display: 'inline-block', animation: 'tpBob 3s ease-in-out infinite' }}>
            📣
          </span>
        </h1>
        <p style={{ margin: '10px 0 0', color: 'var(--txs)', fontSize: '16px', maxWidth: '52ch' }}>
          News, nudges, and team reminders — all in one place.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          padding: '16px 20px',
          borderRadius: '26px',
          background: 'var(--pnl)',
          color: 'var(--pnlt)',
          boxShadow: '0 22px 44px -26px var(--shadow)',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: '30px',
              lineHeight: 1.1,
            }}
          >
            {openReminderCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--pnls)', fontWeight: 600 }}>
            open reminders
          </div>
        </div>

        <div style={{ width: '1px', height: '40px', background: 'rgba(150,150,150,.28)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              position: 'relative',
              display: 'inline-block',
              width: '10px',
              height: '10px',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'var(--teal)',
              }}
            />
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'var(--teal)',
                animation: 'tpPulse 2s ease-out infinite',
              }}
            />
          </span>
          <div>
            <div
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: '30px',
                lineHeight: 1.1,
              }}
            >
              {weeklyCheckinCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--pnls)', fontWeight: 600 }}>
              checked in this week
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
