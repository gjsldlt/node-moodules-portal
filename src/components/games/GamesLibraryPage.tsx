'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { GamesHero } from './GamesHero'
import { GameCard } from './GameCard'
import { SuggestGameCard } from './SuggestGameCard'
import type { WheelUser } from './WheelCanvas'

interface GamesLibraryPageProps {
  initialUsers: WheelUser[]
}

const GAME_CARDS: Array<{
  emoji: string
  title: string
  description: string
  comingSoon: boolean
  href?: string
}> = [
  {
    emoji: '🎡',
    title: 'Wheel of Names',
    description: 'Randomly pick a team member. Great for cold calls, shoutout order, or who buys coffee.',
    comingSoon: false,
    href: '/games/wheel-of-names',
  },
  {
    emoji: '💼',
    title: 'Who Wants to Be a Questionnaire',
    description: 'Shuffle questions into numbered suitcases. Participants pick during your call — you reveal and read aloud.',
    comingSoon: false,
    href: '/games/questionnaire',
  },
]

const EASE = [0.2, 0.7, 0.3, 1] as const

export function GamesLibraryPage({ initialUsers }: GamesLibraryPageProps) {
  const shouldReduce = useReducedMotion()

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduce ? 0 : 0.07 } },
  }

  return (
    <main
      className="flex-1"
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,40px) 64px',
        }}
      >
        <GamesHero memberCount={initialUsers.length} />

        <motion.section
          initial={{ opacity: 0, y: shouldReduce ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          aria-labelledby="library-heading"
        >
          <div style={{ marginBottom: '18px' }}>
            <h2
              id="library-heading"
              style={{
                margin: '0 0 4px',
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(20px, 3vw, 26px)',
                letterSpacing: '-0.02em',
                color: 'var(--tx)',
              }}
            >
              Game Library
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--txm)' }}>
              More games are on the way — built one catchup at a time.
            </p>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '16px',
            }}
          >
            {GAME_CARDS.map((card, i) => (
              <GameCard
                key={card.title}
                emoji={card.emoji}
                title={card.title}
                description={card.description}
                comingSoon={card.comingSoon}
                href={card.href}
                index={i}
              />
            ))}
            <SuggestGameCard index={GAME_CARDS.length} />
          </motion.div>
        </motion.section>
      </div>
    </main>
  )
}
