'use client'

import { useState } from 'react'
import type { ReminderRow } from '@/types'
import { addReminder } from '@/app/node-ifications/actions'

interface Props {
  nickname: string | null
  onAdd: (r: ReminderRow) => void
  onToast: (msg: string) => void
}

export function AddReminderForm({ nickname, onAdd, onToast }: Props) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!nickname) {
    return (
      <p style={{ color: 'var(--txs)', fontSize: '14px', margin: 0 }}>
        Set a nickname first to add reminders.
      </p>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || submitting) return
    setSubmitting(true)
    setError(null)

    const res = await addReminder({ title, dueDate: dueDate || null, nickname: nickname! })

    if ('error' in res) {
      setError(res.error)
    } else {
      onAdd(res.data)
      onToast('Reminder added ✅')
      setTitle('')
      setDueDate('')
    }

    setSubmitting(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 15px',
    borderRadius: '14px',
    border: '1.5px solid var(--bd)',
    background: 'var(--bg)',
    color: 'var(--tx)',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: '26px',
        border: '1px solid var(--bd)',
        boxShadow: '0 22px 46px -32px var(--shadow)',
        padding: '24px',
      }}
    >
      <h3
        style={{
          margin: '0 0 16px',
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: '16px',
          letterSpacing: '-.01em',
        }}
      >
        ✅ New Reminder
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="text"
          placeholder="What needs to happen…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
          style={inputStyle}
          aria-label="Reminder title"
        />

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          placeholder="Due date (optional)"
          style={inputStyle}
          aria-label="Due date (optional)"
        />

        {error && (
          <p style={{ margin: 0, color: 'var(--red)', fontSize: '13px' }} role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!title.trim() || submitting}
          style={{
            padding: '12px',
            border: 'none',
            borderRadius: '999px',
            background: 'var(--green)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '15px',
            width: '100%',
            cursor: title.trim() && !submitting ? 'pointer' : 'not-allowed',
            opacity: title.trim() && !submitting ? 1 : 0.6,
            fontFamily: 'inherit',
          }}
        >
          {submitting ? 'Adding…' : 'Add Reminder'}
        </button>
      </form>
    </div>
  )
}
