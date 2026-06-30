'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { QotdSuitcase } from '@/types'

interface SuitcasePickerProps {
  suitcases: QotdSuitcase[]
  showQuestions: boolean
  onOpen: (number: number) => void
  getQuestionText: (questionId: string) => string
}

const EASE = [0.2, 0.7, 0.3, 1] as const

export function SuitcasePicker({ suitcases, showQuestions, onOpen, getQuestionText }: SuitcasePickerProps) {
  const shouldReduce = useReducedMotion()
  const [revealed, setRevealed] = useState<QotdSuitcase | null>(null)

  function handleClick(s: QotdSuitcase) {
    if (s.opened) return
    onOpen(s.number)
    setRevealed(s)
  }

  const count = suitcases.length
  const minCardPx = count <= 12 ? 96 : count <= 30 ? 78 : 62

  return (
    <>
      {/* Suitcase grid */}
      <div style={{
        background: 'var(--card)', borderRadius: '26px', border: '1px solid var(--bd)',
        padding: '24px', marginBottom: '16px',
        boxShadow: '0 22px 46px -32px var(--shadow)',
      }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: shouldReduce ? 0 : 0.025 } },
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${minCardPx}px, 1fr))`,
            gap: '10px',
          }}
          role="grid"
          aria-label="Suitcase grid"
        >
          {suitcases.map((s, i) => (
            <SuitcaseCard
              key={s.number}
              suitcase={s}
              index={i}
              onClick={() => handleClick(s)}
            />
          ))}
        </motion.div>
      </div>

      {/* Host question map */}
      <AnimatePresence>
        {showQuestions && (
          <motion.div
            initial={{ opacity: 0, y: shouldReduce ? 0 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduce ? 0 : -10 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <div style={{
              background: 'var(--card)', borderRadius: '20px', border: '1px solid var(--bd)',
              overflow: 'hidden', marginBottom: '16px',
              boxShadow: '0 22px 46px -32px var(--shadow)',
            }}>
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid var(--bd)',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--tx)' }}>
                  Question map
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: '#ed8b00',
                  background: 'rgba(237,139,0,0.1)', padding: '2px 9px',
                  borderRadius: '999px', letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  Host only
                </span>
              </div>
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {suitcases.map((s, i) => (
                  <div
                    key={s.number}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      padding: '11px 20px',
                      borderBottom: i < suitcases.length - 1 ? '1px solid var(--bd)' : 'none',
                      opacity: s.opened ? 0.4 : 1,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    <span style={{
                      fontSize: '12px', fontWeight: 700,
                      color: s.opened ? 'var(--txm)' : '#0097a9',
                      minWidth: '30px', paddingTop: '2px', flexShrink: 0,
                    }}>
                      #{s.number}
                    </span>
                    <span style={{
                      flex: 1, fontSize: '13px', color: 'var(--tx)', lineHeight: 1.5,
                      textDecoration: s.opened ? 'line-through' : 'none',
                    }}>
                      {getQuestionText(s.questionId)}
                    </span>
                    {s.opened && (
                      <span style={{ fontSize: '14px', flexShrink: 0, paddingTop: '1px' }}>✅</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal modal */}
      <AnimatePresence>
        {revealed && (
          <RevealModal
            suitcase={revealed}
            questionText={getQuestionText(revealed.questionId)}
            onClose={() => setRevealed(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function SuitcaseCard({
  suitcase,
  index,
  onClick,
}: {
  suitcase: QotdSuitcase
  index: number
  onClick: () => void
}) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, scale: shouldReduce ? 1 : 0.72 },
        visible: {
          opacity: 1, scale: 1,
          transition: { duration: 0.32, ease: [0.2, 0.8, 0.3, 1.3], delay: index * 0.025 },
        },
      }}
      whileHover={!suitcase.opened && !shouldReduce ? { scale: 1.1, y: -4 } : {}}
      whileTap={!suitcase.opened && !shouldReduce ? { scale: 0.92 } : {}}
      onClick={!suitcase.opened ? onClick : undefined}
      disabled={suitcase.opened}
      role="gridcell"
      aria-label={`Suitcase ${suitcase.number}${suitcase.opened ? ', already opened' : ', tap to open'}`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '5px', padding: '10px 6px', borderRadius: '14px',
        background: suitcase.opened ? 'var(--trk)' : 'var(--pnl)',
        border: `2px solid ${suitcase.opened ? 'transparent' : 'rgba(0,151,169,0.3)'}`,
        cursor: suitcase.opened ? 'default' : 'pointer',
        transition: 'background 0.25s, border-color 0.25s, opacity 0.25s',
        opacity: suitcase.opened ? 0.42 : 1,
        minHeight: '70px', outline: 'none',
      }}
    >
      <span style={{
        fontSize: suitcase.opened ? '16px' : '22px', lineHeight: 1,
        transition: 'font-size 0.2s',
      }}>
        {suitcase.opened ? '✅' : '💼'}
      </span>
      <span style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: '14px', fontWeight: 700,
        color: suitcase.opened ? 'var(--txm)' : 'var(--tx)',
        lineHeight: 1,
      }}>
        {suitcase.number}
      </span>
    </motion.button>
  )
}

function RevealModal({
  suitcase,
  questionText,
  onClose,
}: {
  suitcase: QotdSuitcase
  questionText: string
  onClose: () => void
}) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Question from suitcase ${suitcase.number}`}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '24px',
        backdropFilter: 'blur(6px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: shouldReduce ? 1 : 0.8, y: shouldReduce ? 0 : 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: shouldReduce ? 1 : 0.93 }}
        transition={{ duration: 0.45, ease: [0.2, 0.8, 0.3, 1.3] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)', borderRadius: '28px', border: '1px solid var(--bd)',
          padding: 'clamp(28px, 5vw, 52px)', maxWidth: '560px', width: '100%',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.65)',
          textAlign: 'center',
        }}
      >
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(0,151,169,0.1)', borderRadius: '999px', padding: '6px 16px',
          marginBottom: '24px',
        }}>
          <span style={{ fontSize: '18px' }}>💼</span>
          <span style={{
            fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: '#0097a9',
          }}>
            Suitcase #{suitcase.number}
          </span>
        </div>

        {/* Question */}
        <p style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700, fontSize: 'clamp(20px, 4vw, 28px)',
          letterSpacing: '-0.02em', color: 'var(--tx)',
          lineHeight: 1.3, margin: '0 0 36px', whiteSpace: 'pre-wrap',
        }}>
          {questionText}
        </p>

        <button
          onClick={onClose}
          style={{
            background: '#0097a9', color: '#fff', border: 'none',
            borderRadius: '999px', padding: '12px 36px',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          Got it — close
        </button>
      </motion.div>
    </motion.div>
  )
}
