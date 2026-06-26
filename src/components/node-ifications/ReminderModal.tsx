'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ReminderRow } from '@/types'
import { MarkdownContent } from './MarkdownEditor'

interface Props {
  reminder: ReminderRow | null
  onClose: () => void
}

export function ReminderModal({ reminder, onClose }: Props) {
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    if (!reminder) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reminder, onClose])

  const isPast = reminder?.due_date
    ? new Date(reminder.due_date + 'T00:00:00') < new Date(new Date().toDateString())
    : false

  return (
    <AnimatePresence>
      {reminder && (
        <motion.div
          key="reminder-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(6,6,9,.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            key="reminder-modal-card"
            initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.88 }}
            animate={shouldReduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.3, 1.2] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '580px',
              maxHeight: '80vh',
              overflowY: 'auto',
              background: 'var(--card)',
              borderRadius: '26px',
              border: '1px solid var(--bd)',
              boxShadow: '0 40px 80px -20px var(--shadow)',
              padding: '28px 30px 30px',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid var(--bd)',
                background: 'var(--trk)',
                color: 'var(--txm)',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              ×
            </button>

            {/* Meta row — paddingRight keeps the "by" label clear of the close button */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingRight: '40px' }}>
              {(reminder.type ?? 'team') === 'personal' && (
                <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: 'var(--trk)', color: 'var(--txm)' }}>
                  👤 Personal
                </span>
              )}
              {(reminder.type ?? 'team') === 'team' && (
                <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: 'var(--trk)', color: 'var(--txm)' }}>
                  👥 Team
                </span>
              )}
              {reminder.due_date && (
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: isPast ? 'rgba(218,41,28,0.15)' : 'var(--trk)',
                  color: isPast ? 'var(--red)' : 'var(--txs)',
                  whiteSpace: 'nowrap',
                }}>
                  📅 {new Date(reminder.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  {reminder.due_time && ` · ${reminder.due_time}`}
                  {isPast ? ' · Overdue' : ''}
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--txm)' }}>
                by {reminder.created_by}
              </span>
            </div>

            {/* Title */}
            <h2 style={{
              margin: '0 0 4px',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: '22px',
              lineHeight: 1.2,
              letterSpacing: '-.02em',
              paddingRight: '40px',
            }}>
              {reminder.title}
            </h2>

            {/* Content */}
            {reminder.content ? (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid var(--bd)', margin: '16px 0' }} />
                <MarkdownContent content={reminder.content} />
              </>
            ) : (
              <p style={{ marginTop: '12px', color: 'var(--txm)', fontSize: '14px', fontStyle: 'italic' }}>
                No details added.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
