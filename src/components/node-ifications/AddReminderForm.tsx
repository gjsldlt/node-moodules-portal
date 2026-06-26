'use client'

import { useState } from 'react'
import type { ReminderRow } from '@/types'
import { addReminder } from '@/app/node-ifications/actions'
import { MarkdownEditor } from './MarkdownEditor'

interface Props {
  nickname: string | null
  onAdd: (r: ReminderRow) => void
  onToast: (msg: string) => void
}

const TYPE_OPTIONS: { id: 'team' | 'personal'; label: string }[] = [
  { id: 'team', label: '👥 Team' },
  { id: 'personal', label: '👤 Personal' },
]

export function AddReminderForm({ nickname, onAdd, onToast }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [type, setType] = useState<'team' | 'personal'>('team')
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

    const res = await addReminder({ title, content: content || null, dueDate: dueDate || null, dueTime: dueTime || null, nickname: nickname!, type })

    if ('error' in res) {
      setError(res.error)
    } else {
      onAdd(res.data)
      onToast(type === 'personal' ? 'Personal reminder added 👤' : 'Reminder added ✅')
      setTitle('')
      setContent('')
      setDueDate('')
      setDueTime('')
      setType('team')
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
          margin: '0 0 14px',
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: '16px',
          letterSpacing: '-.01em',
        }}
      >
        ✅ New Reminder
      </h3>

      {/* Personal / Team toggle */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--trk)',
          borderRadius: '999px',
          padding: '3px',
          width: 'fit-content',
          marginBottom: '14px',
        }}
      >
        {TYPE_OPTIONS.map((opt) => {
          const active = type === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setType(opt.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: 'none',
                background: active ? 'var(--tx)' : 'transparent',
                color: active ? 'var(--bg)' : 'var(--txs)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {type === 'personal' && (
        <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--txm)' }}>
          Only visible to you.
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

        <MarkdownEditor
          value={content}
          onChange={setContent}
          placeholder="Add details, links, checklists… (optional)"
          minHeight={180}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            aria-label="Due date (optional)"
          />
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            disabled={!dueDate}
            style={{ ...inputStyle, flex: '0 0 130px', opacity: dueDate ? 1 : 0.4, cursor: dueDate ? 'pointer' : 'not-allowed' }}
            aria-label="Due time (optional)"
          />
        </div>

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
