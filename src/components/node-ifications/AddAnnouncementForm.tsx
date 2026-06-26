'use client'

import { useState } from 'react'
import type { AnnouncementRow } from '@/types'
import { addAnnouncement } from '@/app/node-ifications/actions'
import { MarkdownEditor } from './MarkdownEditor'

const PRESET_EMOJIS = ['📢', '🎉', '⚠️', '🔥', '✅', '💡']

interface Props {
  nickname: string | null
  onAdd: (a: AnnouncementRow) => void
  onToast: (msg: string) => void
}

export function AddAnnouncementForm({ nickname, onAdd, onToast }: Props) {
  const [emoji, setEmoji] = useState('📢')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!nickname) {
    return (
      <p style={{ color: 'var(--txs)', fontSize: '14px' }}>
        Set a nickname first to post.
      </p>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || submitting) return
    setSubmitting(true)
    setError(null)

    const res = await addAnnouncement({ title, body: body || null, emoji, nickname: nickname! })

    if ('error' in res) {
      setError(res.error)
    } else {
      onAdd(res.data)
      onToast('Announcement posted! 📣')
      setTitle('')
      setBody('')
      setEmoji('📢')
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
        📢 New Announcement
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PRESET_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              aria-label={`Select emoji ${e}`}
              aria-pressed={emoji === e}
              style={{
                padding: '8px 10px',
                borderRadius: '10px',
                border: emoji === e ? '1.5px solid var(--bd)' : '1.5px solid transparent',
                background: emoji === e ? 'var(--trk)' : 'transparent',
                fontSize: '20px',
                cursor: 'pointer',
              }}
            >
              {e}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Announcement title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
          style={inputStyle}
          aria-label="Announcement title"
        />

        <MarkdownEditor
          value={body}
          onChange={setBody}
          placeholder="Body text, links, details… (optional)"
          minHeight={120}
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
            padding: '14px',
            border: 'none',
            borderRadius: '14px',
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
          {submitting ? 'Posting…' : 'Post Announcement'}
        </button>
      </form>
    </div>
  )
}
