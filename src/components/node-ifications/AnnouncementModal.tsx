'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { AnnouncementRow } from '@/types'
import { MarkdownContent } from './MarkdownEditor'

interface Props {
  announcement: AnnouncementRow | null
  onClose: () => void
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function AnnouncementModal({ announcement, onClose }: Props) {
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    if (!announcement) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [announcement, onClose])

  return (
    <AnimatePresence>
      {announcement && (
        <motion.div
          key="ann-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 80,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            background: 'rgba(6,6,9,.65)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            key="ann-modal-card"
            initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.88 }}
            animate={shouldReduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.3, 1.2] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
              background: 'var(--card)', borderRadius: '26px',
              border: '1px solid var(--bd)',
              boxShadow: '0 40px 80px -20px var(--shadow)',
              padding: '28px 30px 30px', position: 'relative',
            }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: 'absolute', top: '18px', right: '18px',
                width: '32px', height: '32px', borderRadius: '50%',
                border: '1px solid var(--bd)', background: 'var(--trk)',
                color: 'var(--txm)', fontSize: '16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}
            >
              ×
            </button>

            {/* Pinned badge */}
            {announcement.pinned && (
              <span style={{
                display: 'inline-block', background: 'rgba(134,188,37,.15)', color: 'var(--green)',
                padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: '14px',
              }}>
                📌 Pinned
              </span>
            )}

            {/* Meta + emoji */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', paddingRight: '40px' }}>
              {announcement.emoji && (
                <span style={{ fontSize: '36px', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>
                  {announcement.emoji}
                </span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{
                  margin: '0 0 6px',
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 800, fontSize: '22px', lineHeight: 1.2, letterSpacing: '-.02em',
                }}>
                  {announcement.title}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--txm)' }}>
                  by {announcement.created_by} · {relativeTime(announcement.created_at)}
                </div>
              </div>
            </div>

            {/* Body */}
            {announcement.body ? (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid var(--bd)', margin: '18px 0' }} />
                <MarkdownContent content={announcement.body} />
              </>
            ) : (
              <p style={{ marginTop: '14px', color: 'var(--txm)', fontSize: '14px', fontStyle: 'italic' }}>
                No details added.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
