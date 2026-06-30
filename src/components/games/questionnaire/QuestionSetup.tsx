'use client'

import { useState, useRef, useId } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Plus, Trash2, Play } from 'lucide-react'
import type { QotdQuestion } from '@/types'

function genId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10)
}

interface QuestionSetupProps {
  questions: QotdQuestion[]
  suitcaseCount: number
  onChange: (questions: QotdQuestion[]) => void
  onSuitcaseCountChange: (count: number) => void
  onStart: () => void
}

const EASE = [0.2, 0.7, 0.3, 1] as const

const cardStyle: React.CSSProperties = {
  background: 'var(--card)',
  borderRadius: '20px',
  border: '1px solid var(--bd)',
  padding: '20px',
  boxShadow: '0 22px 46px -32px var(--shadow)',
}

export function QuestionSetup({ questions, suitcaseCount, onChange, onSuitcaseCountChange, onStart }: QuestionSetupProps) {
  const shouldReduce = useReducedMotion()
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const labelId = useId()

  const newLineCount = draft.split('\n').filter(l => l.trim().length > 0).length
  const canAdd = newLineCount > 0 && questions.length < 100
  const canStart = questions.length > 0

  function add() {
    const lines = draft.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    const slots = 100 - questions.length
    const toAdd = lines.slice(0, slots).map(text => ({ id: genId(), text }))
    onChange([...questions, ...toAdd])
    setDraft('')
    textareaRef.current?.focus()
  }

  function remove(id: string) {
    onChange(questions.filter(q => q.id !== id))
  }

  function clearAll() {
    onChange([])
  }

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Left: input + list */}
      <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Input card */}
        <div style={cardStyle}>
          <label
            id={labelId}
            style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: 'var(--tx)', marginBottom: '12px' }}
          >
            Add a question
            <span style={{ color: 'var(--txm)', fontWeight: 400, marginLeft: '8px' }}>
              ({questions.length}/100)
            </span>
          </label>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            aria-labelledby={labelId}
            placeholder="One question per line — each line becomes a separate suitcase"
            rows={5}
            disabled={questions.length >= 100}
            style={{
              width: '100%', background: 'var(--trk)',
              border: '1px solid var(--bd)', borderRadius: '14px',
              padding: '12px 14px', fontSize: '14px', color: 'var(--tx)',
              resize: 'vertical', fontFamily: 'inherit', outline: 'none',
              boxSizing: 'border-box', lineHeight: 1.5,
            }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={add}
              disabled={!canAdd}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: canAdd ? '#86bc25' : 'var(--trk)',
                color: canAdd ? '#fff' : 'var(--txm)',
                border: 'none', borderRadius: '999px', padding: '10px 20px',
                fontSize: '14px', fontWeight: 600, cursor: canAdd ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              <Plus size={15} />
              {newLineCount > 1 ? `Add ${newLineCount}` : 'Add'}
            </button>
            {questions.length > 0 && (
              <button
                onClick={clearAll}
                style={{
                  background: 'none', border: '1px solid var(--bd)', borderRadius: '999px',
                  padding: '10px 18px', fontSize: '13px', fontWeight: 500,
                  color: 'var(--txm)', cursor: 'pointer',
                }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Question list */}
        {questions.length > 0 ? (
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid var(--bd)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--tx)' }}>Questions</span>
              <span style={{ fontSize: '12px', color: 'var(--txm)' }}>
                {questions.length} saved · reloads next week 💾
              </span>
            </div>
            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <AnimatePresence initial={false}>
                {questions.map((q, i) => (
                  <motion.div
                    key={q.id}
                    layout={!shouldReduce}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '13px 20px',
                      borderBottom: i < questions.length - 1 ? '1px solid var(--bd)' : 'none',
                    }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, color: 'var(--txm)',
                        paddingTop: '3px', minWidth: '22px', textAlign: 'right', flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{
                        flex: 1, fontSize: '14px', color: 'var(--tx)',
                        lineHeight: 1.5, wordBreak: 'break-word',
                      }}>
                        {q.text}
                      </span>
                      <button
                        onClick={() => remove(q.id)}
                        aria-label={`Remove question ${i + 1}`}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--txm)', padding: '2px 4px', borderRadius: '6px',
                          display: 'flex', alignItems: 'center', flexShrink: 0, opacity: 0.6,
                          transition: 'opacity 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--tx)' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--txm)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            color: 'var(--txm)', fontSize: '14px', lineHeight: 1.7,
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
            <p style={{ margin: 0 }}>
              Add your first question above.<br />
              Questions are saved locally and will be here next week.
            </p>
          </div>
        )}
      </div>

      {/* Right: Ready panel */}
      <div style={{
        ...cardStyle,
        flex: '0 0 272px', minWidth: '240px',
        position: 'sticky', top: '90px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px', lineHeight: 1 }}>💼</div>
          <h3 style={{
            margin: 0,
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700, fontSize: '20px', letterSpacing: '-0.02em', color: 'var(--tx)',
          }}>
            Ready to play?
          </h3>
        </div>

        {/* Suitcase count stepper */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: 'var(--txm)',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px',
          }}>
            Number of suitcases
          </div>
          <div style={{
            display: 'flex', alignItems: 'stretch',
            background: 'var(--trk)', borderRadius: '14px', border: '1px solid var(--bd)',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => onSuitcaseCountChange(Math.max(1, suitcaseCount - 1))}
              aria-label="Decrease suitcase count"
              style={{
                padding: '10px 16px', background: 'none', border: 'none',
                color: 'var(--tx)', cursor: 'pointer',
                fontSize: '22px', fontWeight: 300, lineHeight: 1,
              }}
            >
              −
            </button>
            <input
              type="number"
              value={suitcaseCount}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) onSuitcaseCountChange(Math.max(1, Math.min(100, v)))
              }}
              min={1}
              max={100}
              aria-label="Number of suitcases"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                textAlign: 'center', minWidth: 0, padding: '8px 0',
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: '24px', fontWeight: 700, color: 'var(--tx)',
              }}
            />
            <button
              onClick={() => onSuitcaseCountChange(Math.min(100, suitcaseCount + 1))}
              aria-label="Increase suitcase count"
              style={{
                padding: '10px 16px', background: 'none', border: 'none',
                color: 'var(--tx)', cursor: 'pointer',
                fontSize: '22px', fontWeight: 300, lineHeight: 1,
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Context text */}
        <div style={{
          marginBottom: '16px', padding: '12px 14px', background: 'var(--trk)',
          borderRadius: '12px', fontSize: '13px', lineHeight: 1.55,
        }}>
          {questions.length === 0 ? (
            <span style={{ color: 'var(--txm)' }}>Add at least one question to get started.</span>
          ) : suitcaseCount <= questions.length ? (
            <span style={{ color: 'var(--txm)' }}>
              {suitcaseCount} of {questions.length} question{questions.length !== 1 ? 's' : ''} randomly selected — no repeats.
            </span>
          ) : (
            <span style={{ color: 'var(--txm)' }}>
              {questions.length} question{questions.length !== 1 ? 's' : ''} repeated to fill {suitcaseCount} suitcases.{' '}
              <span style={{ color: '#ed8b00', fontWeight: 600 }}>Some will appear more than once.</span>
            </span>
          )}
        </div>

        <button
          onClick={onStart}
          disabled={!canStart}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: canStart ? '#0097a9' : 'var(--trk)',
            color: canStart ? '#fff' : 'var(--txm)',
            border: 'none', borderRadius: '999px', padding: '13px 24px',
            fontSize: '15px', fontWeight: 700, cursor: canStart ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { if (canStart) e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <Play size={16} />
          Shuffle &amp; Play
        </button>

        <div style={{
          marginTop: '14px', fontSize: '12px', color: 'var(--txm)', lineHeight: 1.65,
          textAlign: 'center',
        }}>
          💡 Participants pick a number during your call. Click the suitcase to reveal.
        </div>
      </div>
    </div>
  )
}
