'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import FocusTrap from 'focus-trap-react'
import confetti from 'canvas-confetti'
import type { UserRow } from '@/types'

type WheelUser = Pick<UserRow, 'nickname' | 'avatar_color' | 'avatar_emoji'>

interface WinnerModalProps {
  winner: WheelUser | null
  onExclude: () => void
  onKeep: () => void
}

const CONFETTI_COLORS = ['#86bc25', '#0097a9', '#62b5e5', '#da291c', '#ed8b00', '#ffcd00']

const POP = {
  hidden: { opacity: 0, scale: 0.82 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.2, 0.8, 0.3, 1.3] as [number, number, number, number] } },
  exit:    { opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as [number, number, number, number] } },
}

export function WinnerModal({ winner, onExclude, onKeep }: WinnerModalProps) {
  const shouldReduce = useReducedMotion()
  const firedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!winner || shouldReduce) return
    if (firedRef.current === winner.nickname) return
    firedRef.current = winner.nickname
    confetti({
      particleCount: 130,
      spread: 80,
      origin: { y: 0.45 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    })
  }, [winner, shouldReduce])

  // Close on Escape
  useEffect(() => {
    if (!winner) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onKeep()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [winner, onKeep])

  return (
    <AnimatePresence>
      {winner && (
        <FocusTrap focusTrapOptions={{ allowOutsideClick: true }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onKeep}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            {/* Card — stop propagation so clicking inside doesn't close */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Winner: ${winner.nickname}`}
              onClick={(e) => e.stopPropagation()}
              variants={POP}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                background: 'var(--card)',
                borderRadius: '26px',
                border: '1px solid var(--bd)',
                padding: '40px 32px 32px',
                width: '100%',
                maxWidth: '380px',
                textAlign: 'center',
                boxShadow: '0 32px 64px -24px var(--shadow)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              {/* Winner avatar */}
              <div>
                <motion.div
                  animate={shouldReduce ? {} : { scale: [1, 1.08, 1] }}
                  transition={{ duration: 0.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.4 }}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: winner.avatar_color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    margin: '0 auto 14px',
                    boxShadow: `0 0 0 4px var(--card), 0 0 0 6px ${winner.avatar_color}44`,
                  }}
                  aria-hidden="true"
                >
                  {winner.avatar_emoji}
                </motion.div>

                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--teal)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '6px',
                  }}
                >
                  🎉 Winner!
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontWeight: 800,
                    fontSize: 'clamp(26px, 5vw, 34px)',
                    letterSpacing: '-0.025em',
                    color: 'var(--tx)',
                  }}
                >
                  {winner.nickname}
                </h2>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <button
                  onClick={onExclude}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    borderRadius: '999px',
                    border: 'none',
                    background: 'var(--tx)',
                    color: 'var(--bg)',
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'opacity 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Exclude from next spin
                </button>
                <button
                  onClick={onKeep}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    borderRadius: '999px',
                    border: '1px solid var(--bd)',
                    background: 'transparent',
                    color: 'var(--txs)',
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--trk)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Keep in pool
                </button>
              </div>
            </motion.div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  )
}
