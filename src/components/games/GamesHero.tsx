'use client'

import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.2, 0.7, 0.3, 1] as const

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function GamesHero({ memberCount }: { memberCount: number }) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduce ? 0 : 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '32px',
      }}
    >
      <div style={{ minWidth: '260px', flex: 1 }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--teal)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '6px',
          }}
        >
          {formatDate(new Date())}
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(30px, 5vw, 46px)',
            lineHeight: 1.04,
            letterSpacing: '-0.025em',
            color: 'var(--tx)',
          }}
        >
          Games{' '}
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              animation: shouldReduce ? 'none' : 'tpBob 3.4s ease-in-out infinite',
            }}
          >
            🎮
          </span>
        </h1>
        <p style={{ margin: '10px 0 0', color: 'var(--txs)', fontSize: '16px', maxWidth: '44ch' }}>
          Spin the wheel, run a trivia round, or just mess around between standups.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px 22px',
          borderRadius: '22px',
          background: 'var(--pnl)',
          boxShadow: '0 22px 44px -26px var(--shadow)',
          flexShrink: 0,
        }}
        aria-label={`${memberCount} team members registered`}
      >
        <span
          style={{
            fontSize: '32px',
            animation: shouldReduce ? 'none' : 'tpBob 3s ease-in-out infinite',
          }}
          aria-hidden="true"
        >
          👥
        </span>
        <div>
          <div
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: '28px',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: 'var(--pnlt)',
            }}
          >
            {memberCount}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--pnls)', marginTop: '2px' }}>
            team members
          </div>
        </div>
      </div>
    </motion.div>
  )
}
