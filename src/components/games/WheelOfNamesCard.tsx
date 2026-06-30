'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { WheelOfNames } from './WheelOfNames'
import type { WheelUser } from './WheelCanvas'

interface WheelOfNamesCardProps {
  participants: WheelUser[]
  /** Optional entrance animation delay in seconds. */
  animDelay?: number
}

const EASE = [0.2, 0.7, 0.3, 1] as const

/**
 * Card-wrapped version of the Wheel of Names widget.
 * Use this when embedding the wheel inside a page layout
 * (e.g. the standalone /games/wheel-of-names page).
 */
export function WheelOfNamesCard({ participants, animDelay = 0.1 }: WheelOfNamesCardProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduce ? 0 : 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: animDelay }}
      style={{
        background: 'var(--card)',
        borderRadius: '26px',
        border: '1px solid var(--bd)',
        boxShadow: '0 22px 46px -32px var(--shadow)',
        overflow: 'hidden',
      }}
      aria-labelledby="wheel-card-heading"
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '20px 24px',
          borderBottom: '1px solid var(--bd)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--trk)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}
          aria-hidden="true"
        >
          🎡
        </div>
        <div>
          <h2
            id="wheel-card-heading"
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: '20px',
              letterSpacing: '-0.02em',
              color: 'var(--tx)',
            }}
          >
            Wheel of Names
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--txm)' }}>
            Spin to randomly pick a team member
          </p>
        </div>
      </div>

      <WheelOfNames participants={participants} />
    </motion.div>
  )
}
