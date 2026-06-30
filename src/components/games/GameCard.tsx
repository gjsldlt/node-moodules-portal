'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

interface GameCardProps {
  emoji: string
  title: string
  description: string
  comingSoon?: boolean
  href?: string
  onClick?: () => void
  index?: number
}

const EASE = [0.2, 0.7, 0.3, 1] as const

export function GameCard({ emoji, title, description, comingSoon = false, href, onClick, index = 0 }: GameCardProps) {
  const shouldReduce = useReducedMotion()
  const interactive = !comingSoon && (!!href || !!onClick)

  const item = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 22, scale: shouldReduce ? 1 : 0.985 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { duration: 0.6, ease: EASE, delay: index * 0.07 },
    },
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--card)',
    borderRadius: '26px',
    border: '1px solid var(--bd)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 22px 46px -32px var(--shadow)',
    cursor: interactive ? 'pointer' : 'default',
    outline: 'none',
    textDecoration: 'none',
    color: 'inherit',
  }

  const card = (
    <motion.div
      variants={item}
      style={cardStyle}
      onClick={!href && onClick ? onClick : undefined}
      role={!href && interactive ? 'button' : undefined}
      tabIndex={!href && interactive ? 0 : undefined}
      onKeyDown={!href && interactive && onClick
        ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }
        : undefined}
      whileHover={interactive && !shouldReduce ? { scale: 1.02, y: -2 } : {}}
      whileTap={interactive && !shouldReduce ? { scale: 0.98 } : {}}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'var(--trk)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0,
          }}
        >
          {emoji}
        </div>
        {comingSoon ? (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--txm)',
              background: 'var(--trk)',
              padding: '3px 10px',
              borderRadius: '999px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Soon
          </span>
        ) : (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--teal)',
              background: 'rgba(0,151,169,0.12)',
              padding: '3px 10px',
              borderRadius: '999px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--teal)',
                display: 'inline-block',
                animation: shouldReduce ? 'none' : 'tpPulse 2s ease-out infinite',
                flexShrink: 0,
              }}
            />
            Live
          </span>
        )}
      </div>

      <div>
        <h3
          style={{
            margin: '0 0 4px',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: '18px',
            letterSpacing: '-0.02em',
            color: comingSoon ? 'var(--txs)' : 'var(--tx)',
          }}
        >
          {title}
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--txm)', lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
    </motion.div>
  )

  if (href && !comingSoon) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'contents' }}>
        {card}
      </Link>
    )
  }

  return card
}
