'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { getAnnouncementAccentColor } from '@/lib/identity'
import { deleteAnnouncement } from '@/app/node-ifications/actions'
import type { AnnouncementRow } from '@/types'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

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

function AnnouncementItem({
  announcement,
  isLast,
  nickname,
  onDelete,
}: {
  announcement: AnnouncementRow
  isLast: boolean
  nickname: string | null
  onDelete: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const accent = getAnnouncementAccentColor(announcement.emoji)
  const isOwner = nickname?.toLowerCase() === announcement.created_by?.toLowerCase()

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

  return (
    <motion.li
      variants={itemVariants}
      style={{ listStyle: 'none' }}
    >
      <div
        style={{
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
          padding: '16px 0',
          borderBottom: isLast ? 'none' : '1px solid var(--bd)',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: accent + '22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
          }}
          aria-hidden
        >
          {announcement.emoji ?? '📢'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '3px' }}>
            {announcement.title}
          </div>
          {announcement.body && (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--txs)',
                marginBottom: '4px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {announcement.body}
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'var(--txm)' }}>
            by {announcement.created_by} · {relativeTime(announcement.created_at)}
          </div>
          {isOwner && (
            <button
              onClick={handleDeleteClick}
              style={{
                marginTop: '8px',
                padding: '4px 12px',
                border: '1px solid var(--bd)',
                borderRadius: '999px',
                background: 'transparent',
                color: 'var(--txs)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {confirming ? 'Sure? Click again' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </motion.li>
  )
}

interface Props {
  announcements: AnnouncementRow[]
  nickname: string | null
  onDelete: (id: string) => void
}

export function AnnouncementList({ announcements, nickname, onDelete }: Props) {
  const [listRef] = useAutoAnimate<HTMLUListElement>()

  if (announcements.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--txs)' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗒️</div>
        <div style={{ fontWeight: 700, fontSize: '15px' }}>
          No announcements yet — be the first!
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <ul ref={listRef} style={{ margin: 0, padding: 0 }}>
        {announcements.map((a, i) => (
          <AnnouncementItem
            key={a.id}
            announcement={a}
            isLast={i === announcements.length - 1}
            nickname={nickname}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </motion.div>
  )
}
