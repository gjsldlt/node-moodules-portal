'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getAnnouncementAccentColor } from '@/lib/identity'
import { deleteAnnouncement } from '@/app/node-ifications/actions'
import type { AnnouncementRow } from '@/types'

const itemVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.2, 0.7, 0.3, 1] as const },
  },
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface Props {
  announcement: AnnouncementRow
  nickname: string | null
  onDelete: (id: string) => void
  onView: (a: AnnouncementRow) => void
  isAdmin: boolean
}

export function FeaturedAnnouncementCard({ announcement, nickname, onDelete, onView, isAdmin }: Props) {
  const [confirming, setConfirming] = useState(false)
  const accent = getAnnouncementAccentColor(announcement.emoji)

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(t)
  }, [confirming])

  async function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    onDelete(announcement.id)
    await deleteAnnouncement({ id: announcement.id, nickname: nickname! })
  }

  const isOwner = isAdmin || nickname?.toLowerCase() === announcement.created_by?.toLowerCase()

  return (
    <motion.div
      variants={itemVariants}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '26px',
        padding: '24px',
        background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
        border: `1px solid ${accent}33`,
        marginBottom: '12px',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '60%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          pointerEvents: 'none',
          animation: 'tpSheen 5.5s ease-in-out 1s infinite',
        }}
      />

      {announcement.pinned && (
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.22)',
            color: '#fff',
            padding: '3px 10px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          📌 Pinned
        </span>
      )}

      <button
        onClick={() => onView(announcement)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          textAlign: 'left', fontFamily: 'inherit', width: '100%',
        }}
      >
        <span style={{ fontSize: '30px', flexShrink: 0, lineHeight: 1 }}>
          {announcement.emoji ?? '📢'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '20px', lineHeight: 1.15, marginBottom: '6px' }}>
            {announcement.title}
          </div>
          {announcement.body && (
            <div style={{ fontSize: '14px', opacity: 0.88, marginBottom: '8px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {announcement.body.replace(/[#*`_~\[\]]/g, '').slice(0, 140)}
              {announcement.body.length > 140 ? '…' : ''}
            </div>
          )}
          <div style={{ fontSize: '12px', opacity: 0.6 }}>
            by {announcement.created_by} · {relativeTime(announcement.created_at)}
            {announcement.body && <span style={{ opacity: 0.7 }}> · Read more →</span>}
          </div>
        </div>
      </button>

      {isOwner && (
        <button
          onClick={handleDeleteClick}
          style={{
            marginTop: '12px',
            padding: '6px 14px',
            border: '1px solid rgba(255,255,255,.25)',
            borderRadius: '999px',
            background: 'transparent',
            color: 'rgba(255,255,255,.7)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {confirming ? 'Sure? Click again' : 'Delete'}
        </button>
      )}
    </motion.div>
  )
}
