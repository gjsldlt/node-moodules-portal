'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import confetti from 'canvas-confetti'
import type { ReminderRow, CompletionRow } from '@/types'

interface Props {
  reminders: ReminderRow[]
  completions: CompletionRow[]
  nickname: string | null
  onToggle: (reminderId: string, done: boolean) => void
  onResolve: (reminderId: string) => void
  submittingIds: Set<string>
}

function ReminderItem({
  reminder,
  isLast,
  isDone,
  nickname,
  submitting,
  onToggle,
  onResolve,
  shouldReduce,
}: {
  reminder: ReminderRow
  isLast: boolean
  isDone: boolean
  nickname: string | null
  submitting: boolean
  onToggle: (reminderId: string, done: boolean) => void
  onResolve: (reminderId: string) => void
  shouldReduce: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const isOwner = reminder.created_by.toLowerCase() === nickname?.toLowerCase()

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(t)
  }, [confirming])

  function handleResolveClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    onResolve(reminder.id)
  }

  function handleTick(e: React.MouseEvent) {
    const newDone = !isDone
    if (newDone && !shouldReduce) {
      confetti({
        origin: { y: e.clientY / window.innerHeight },
        particleCount: 60,
        spread: 80,
        colors: ['#86bc25', '#0097a9', '#62b5e5', '#da291c', '#ed8b00', '#ffcd00'],
      })
    }
    onToggle(reminder.id, newDone)
  }

  const isPast = reminder.due_date
    ? new Date(reminder.due_date + 'T00:00:00') < new Date()
    : false

  return (
    <motion.li key={reminder.id} layout style={{ listStyle: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 0',
          minHeight: '44px',
          borderBottom: isLast ? 'none' : '1px solid var(--bd)',
        }}
      >
        <motion.button
          onClick={handleTick}
          disabled={submitting}
          whileTap={shouldReduce ? {} : { scale: 0.9 }}
          aria-label={isDone ? `Unmark "${reminder.title}" as done` : `Mark "${reminder.title}" as done`}
          aria-pressed={isDone}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '8px',
            flexShrink: 0,
            border: '2px solid var(--teal)',
            background: isDone ? 'var(--teal)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 900,
            color: '#fff',
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          {isDone ? '✓' : ''}
        </motion.button>

        <span
          style={{
            fontWeight: 600,
            fontSize: '15px',
            flex: 1,
            color: isDone ? 'var(--txm)' : 'var(--tx)',
            textDecoration: isDone ? 'line-through' : 'none',
            transition: 'color 0.2s, text-decoration 0.2s',
          }}
        >
          {reminder.title}
        </span>

        {reminder.due_date && (
          <span
            style={{
              padding: '2px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              background: isPast ? 'rgba(218,41,28,0.15)' : 'var(--trk)',
              color: isPast ? 'var(--red)' : 'var(--txs)',
              flexShrink: 0,
            }}
          >
            {new Date(reminder.due_date + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}

        {isOwner && (
          <button
            onClick={handleResolveClick}
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
            {confirming ? 'Sure?' : 'Resolve'}
          </button>
        )}
      </div>
    </motion.li>
  )
}

export function ReminderList({
  reminders,
  completions,
  nickname,
  onToggle,
  onResolve,
  submittingIds,
}: Props) {
  const [listRef] = useAutoAnimate<HTMLUListElement>()
  const shouldReduce = useReducedMotion() ?? false

  function isDone(reminderId: string) {
    return completions.some((c) => c.reminder_id === reminderId && c.nickname === nickname)
  }

  if (reminders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--txs)' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
        <div style={{ fontWeight: 700 }}>All clear! No active reminders.</div>
      </div>
    )
  }

  return (
    <ul ref={listRef} style={{ margin: 0, padding: 0 }}>
      {reminders.map((r, i) => (
        <ReminderItem
          key={r.id}
          reminder={r}
          isLast={i === reminders.length - 1}
          isDone={isDone(r.id)}
          nickname={nickname}
          submitting={submittingIds.has(r.id)}
          onToggle={onToggle}
          onResolve={onResolve}
          shouldReduce={shouldReduce}
        />
      ))}
    </ul>
  )
}
