'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ReminderRow } from '@/types'

interface Props {
  completed: ReminderRow[]
  nickname: string | null
  onUntick: (reminderId: string) => void
}

export function CompletedReminders({ completed, nickname: _nickname, onUntick }: Props) {
  const [expanded, setExpanded] = useState(false)
  const shouldReduce = useReducedMotion()

  return (
    <div>
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '14px 0',
          width: '100%',
        }}
      >
        <span
          style={{
            background: 'rgba(134,188,37,0.15)',
            color: 'var(--green)',
            padding: '3px 10px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {completed.length} done
        </span>
        {shouldReduce ? (
          <span
            style={{
              display: 'inline-block',
              color: 'var(--txm)',
              fontSize: '12px',
              transform: expanded ? 'rotate(180deg)' : 'none',
            }}
          >
            ▾
          </span>
        ) : (
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'inline-block', color: 'var(--txm)', fontSize: '12px' }}
          >
            ▾
          </motion.span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="completed-content"
            initial={shouldReduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={shouldReduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={shouldReduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {completed.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '20px 0',
                  color: 'var(--txs)',
                  fontSize: '14px',
                }}
              >
                Nothing done yet — get cracking!
              </div>
            ) : (
              <ul style={{ margin: 0, padding: 0 }}>
                {completed.map((r) => (
                  <li
                    key={r.id}
                    style={{
                      listStyle: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--bd)',
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        color: 'var(--txm)',
                        textDecoration: 'line-through',
                      }}
                    >
                      {r.title}
                    </span>
                    <button
                      onClick={() => onUntick(r.id)}
                      style={{
                        padding: '4px 12px',
                        border: '1px solid var(--bd)',
                        borderRadius: '999px',
                        background: 'transparent',
                        color: 'var(--txs)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      Untick
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
