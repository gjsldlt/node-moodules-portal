'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { MOODS } from '@/lib/moood'
import type { MoodEntry } from '@/app/moood/actions'

interface MooodHeroProps {
  entries: MoodEntry[]   // current-week team entries
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function MooodHero({ entries }: MooodHeroProps) {
  const shouldReduce = useReducedMotion() ?? false

  const stats = useMemo(() => {
    if (entries.length === 0) return null
    const avg = entries.reduce((a, e) => a + e.score, 0) / entries.length
    const mood = MOODS.find((m) => m.score === Math.round(avg)) ?? MOODS[2]
    // Count unique nicknames
    const uniqueCount = new Set(entries.map((e) => e.nickname)).size
    return { avg, mood, uniqueCount }
  }, [entries])

  const fadeUpVariants = {
    hidden:  { opacity: 0, y: shouldReduce ? 0 : 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.7, 0.3, 1] as [number, number, number, number] } },
  }

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '4px',
      }}
    >
      {/* Left: date + heading */}
      <div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--green)',
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
          How&apos;s the team feeling?{' '}
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              animation: shouldReduce ? 'none' : 'tpWave 2.6s ease-in-out 1s infinite',
            }}
          >
            👋
          </span>
        </h1>
      </div>

      {/* Right: inverted stat panel */}
      {stats && (
        <div
          style={{
            background: 'var(--pnl)',
            borderRadius: '20px',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexShrink: 0,
            boxShadow: '0 22px 44px -26px var(--shadow)',
          }}
          aria-label={`${stats.uniqueCount} team members checked in this week, average mood ${stats.mood.label}`}
        >
          <div
            style={{
              fontSize: '36px',
              animation: shouldReduce ? 'none' : 'tpBob 3s ease-in-out infinite',
            }}
            aria-hidden="true"
          >
            {stats.mood.emoji}
          </div>
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
              {stats.avg.toFixed(1)}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--pnls)', marginTop: '2px' }}>
              {stats.uniqueCount} checked in this week
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
