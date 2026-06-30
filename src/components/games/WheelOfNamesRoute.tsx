'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { WheelOfNamesCard } from './WheelOfNamesCard'
import type { WheelUser } from './WheelCanvas'

const EASE = [0.2, 0.7, 0.3, 1] as const

export function WheelOfNamesRoute({ participants }: { participants: WheelUser[] }) {
  const shouldReduce = useReducedMotion()

  return (
    <main className="flex-1" style={{ position: 'relative', zIndex: 1 }}>
      <motion.div
        initial={{ opacity: 0, y: shouldReduce ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,40px) 64px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <Link
            href="/games"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'var(--trk)', border: '1px solid var(--bd)',
              borderRadius: '999px', padding: '8px 16px',
              fontSize: '13px', fontWeight: 600, color: 'var(--txs)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            Games
          </Link>
        </div>

        <WheelOfNamesCard participants={participants} animDelay={0.1} />
      </motion.div>
    </main>
  )
}
