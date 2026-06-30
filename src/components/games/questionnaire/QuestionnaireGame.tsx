'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Shuffle } from 'lucide-react'
import { QuestionSetup } from './QuestionSetup'
import { SuitcasePicker } from './SuitcasePicker'
import { WheelModal } from './WheelModal'
import type { QotdQuestion, QotdSuitcase } from '@/types'
import type { WheelUser } from '../WheelCanvas'

const STORAGE_KEY = 'tp_qotd_questions'
const SUITCASES_KEY = 'tp_qotd_suitcases'
const EASE = [0.2, 0.7, 0.3, 1] as const

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function shuffleIntoSuitcases(questions: QotdQuestion[], count: number): QotdSuitcase[] {
  if (questions.length === 0 || count === 0) return []
  // Cycle through independently-shuffled batches so repeats are distributed evenly
  const pool: string[] = []
  while (pool.length < count) {
    pool.push(...fisherYates(questions.map(q => q.id)))
  }
  return pool.slice(0, count).map((questionId, i) => ({
    number: i + 1, questionId, opened: false,
  }))
}

const ctrlBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  background: 'var(--trk)', border: '1px solid var(--bd)',
  borderRadius: '999px', padding: '8px 16px',
  fontSize: '13px', fontWeight: 600, color: 'var(--txs)', cursor: 'pointer',
}

interface QuestionnaireGameProps {
  participants: WheelUser[]
}

export function QuestionnaireGame({ participants }: QuestionnaireGameProps) {
  const shouldReduce = useReducedMotion()
  const [mode, setMode] = useState<'setup' | 'play'>('setup')
  const [questions, setQuestions] = useState<QotdQuestion[]>([])
  const [suitcases, setSuitcases] = useState<QotdSuitcase[]>([])
  const [showQuestions, setShowQuestions] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [suitcaseCount, setSuitcaseCount] = useState(1)
  const [wheelState, setWheelState] = useState<'closed' | 'open' | 'minimized'>('closed')

  // Hydrate from localStorage — must finish before persist effect writes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const saved: QotdQuestion[] = raw ? JSON.parse(raw) : []
      if (saved.length > 0) setQuestions(saved)

      const sc = localStorage.getItem(SUITCASES_KEY)
      setSuitcaseCount(sc !== null
        ? Math.max(1, Math.min(100, parseInt(sc, 10) || 1))
        : Math.max(1, saved.length)   // default = question count on first load
      )
    } catch {}
    setHydrated(true)
  }, [])

  // Persist to localStorage — skips the initial render where questions is still []
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions))
    localStorage.setItem(SUITCASES_KEY, String(suitcaseCount))
  }, [questions, suitcaseCount, hydrated])

  const startGame = useCallback(() => {
    if (questions.length === 0) return
    setSuitcases(shuffleIntoSuitcases(questions, suitcaseCount))
    setMode('play')
    setShowQuestions(false)
  }, [questions, suitcaseCount])

  const reshuffle = useCallback(() => {
    setSuitcases(shuffleIntoSuitcases(questions, suitcaseCount))
  }, [questions, suitcaseCount])

  const openSuitcase = useCallback((number: number) => {
    setSuitcases(prev =>
      prev.map(s => s.number === number ? { ...s, opened: true } : s)
    )
  }, [])

  const getQuestionText = useCallback(
    (questionId: string) => questions.find(q => q.id === questionId)?.text ?? '',
    [questions]
  )

  const openedCount = suitcases.filter(s => s.opened).length
  const allDone = suitcases.length > 0 && openedCount === suitcases.length

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {/* Game header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '16px',
        marginBottom: '28px', flexWrap: 'wrap',
      }}>
        <Link
          href="/games"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--trk)', border: '1px solid var(--bd)',
            borderRadius: '999px', padding: '8px 16px',
            fontSize: '13px', fontWeight: 600, color: 'var(--txs)',
            textDecoration: 'none', flexShrink: 0, marginTop: '5px',
          }}
        >
          <ArrowLeft size={14} />
          Games
        </Link>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{
            margin: '0 0 6px',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800, fontSize: 'clamp(22px, 4vw, 30px)',
            letterSpacing: '-0.03em', color: 'var(--tx)', lineHeight: 1.1,
          }}>
            💼 Who Wants to Be a Questionnaire
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--txm)', lineHeight: 1.5 }}>
            Shuffle questions into numbered suitcases. Participants pick during your call — click to reveal and read aloud.
          </p>
        </div>
      </div>

      {/* Play-mode control bar */}
      {mode === 'play' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px', flexWrap: 'wrap', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tx)' }}>
              {openedCount}
              <span style={{ color: 'var(--txm)', fontWeight: 400 }}>
                {' '}/ {suitcases.length} opened
              </span>
            </span>
            {allDone && (
              <motion.span
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.3, 1.3] }}
                style={{
                  fontSize: '11px', fontWeight: 700, color: '#86bc25',
                  background: 'rgba(134,188,37,0.12)', padding: '2px 10px',
                  borderRadius: '999px', letterSpacing: '0.04em', textTransform: 'uppercase',
                }}
              >
                All done! 🎉
              </motion.span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowQuestions(v => !v)}
              style={ctrlBtn}
              aria-pressed={showQuestions}
            >
              {showQuestions ? <EyeOff size={14} /> : <Eye size={14} />}
              {showQuestions ? 'Hide questions' : 'Show questions'}
            </button>
            <button onClick={reshuffle} style={ctrlBtn}>
              <Shuffle size={14} />
              Reshuffle
            </button>
            <button
              onClick={() => { setMode('setup'); setShowQuestions(false) }}
              style={{ ...ctrlBtn, color: 'var(--txm)' }}
            >
              Edit questions
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {mode === 'setup' ? (
        <QuestionSetup
          questions={questions}
          suitcaseCount={suitcaseCount}
          onChange={setQuestions}
          onSuitcaseCountChange={setSuitcaseCount}
          onStart={startGame}
        />
      ) : (
        <SuitcasePicker
          suitcases={suitcases}
          showQuestions={showQuestions}
          onOpen={openSuitcase}
          getQuestionText={getQuestionText}
        />
      )}

      {/* Wheel of Names FAB — hidden when fully open, becomes "resume" when minimized */}
      {participants.length > 0 && wheelState !== 'open' && (
        <motion.button
          onClick={() => setWheelState('open')}
          whileHover={!shouldReduce ? { scale: 1.06, y: -3 } : {}}
          whileTap={!shouldReduce ? { scale: 0.95 } : {}}
          initial={{ opacity: 0, y: shouldReduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: shouldReduce ? 0 : 12 }}
          transition={{ duration: 0.2, ease: [0.2, 0.7, 0.3, 1] }}
          aria-label={wheelState === 'minimized' ? 'Resume Wheel of Names' : 'Open Wheel of Names'}
          style={{
            position: 'fixed', bottom: '28px', right: '28px', zIndex: 100,
            display: 'flex', alignItems: 'center', gap: '9px',
            background: '#0097a9', color: '#fff',
            border: 'none', borderRadius: '999px',
            padding: '13px 22px',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 8px 32px -4px rgba(0,151,169,0.55)',
          }}
        >
          {wheelState === 'minimized' && (
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#fff', flexShrink: 0,
              animation: shouldReduce ? 'none' : 'tpPulse 2s ease-out infinite',
            }} />
          )}
          <span
            style={{
              fontSize: '18px', lineHeight: 1,
              display: 'inline-block',
              animation: shouldReduce ? 'none' : 'tpBob 3.4s ease-in-out infinite',
            }}
            aria-hidden="true"
          >
            🎡
          </span>
          {wheelState === 'minimized' ? 'Resume wheel' : 'Spin wheel'}
        </motion.button>
      )}

      {/* Wheel modal — stays mounted when minimized so WheelOfNames state survives */}
      {wheelState !== 'closed' && (
        <WheelModal
          participants={participants}
          minimized={wheelState === 'minimized'}
          onMinimize={() => setWheelState('minimized')}
        />
      )}
    </motion.div>
  )
}
