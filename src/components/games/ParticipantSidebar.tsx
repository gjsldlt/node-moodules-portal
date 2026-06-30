'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import type { UserRow } from '@/types'

type WheelUser = Pick<UserRow, 'nickname' | 'avatar_color' | 'avatar_emoji'>

interface ParticipantSidebarProps {
  participants: WheelUser[]
  removed: Set<string>
  excluded: Set<string>
  onRemove: (nickname: string) => void
  onRestore: (nickname: string) => void
  onResetAll: () => void
  isSpinning: boolean
}

function Avatar({ user }: { user: WheelUser }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        background: user.avatar_color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        flexShrink: 0,
      }}
    >
      {user.avatar_emoji}
    </div>
  )
}

export function ParticipantSidebar({
  participants,
  removed,
  excluded,
  onRemove,
  onRestore,
  onResetAll,
  isSpinning,
}: ParticipantSidebarProps) {
  const [listRef] = useAutoAnimate<HTMLUListElement>()
  const [query, setQuery] = useState('')

  const activeCount = participants.filter(
    (p) => !removed.has(p.nickname) && !excluded.has(p.nickname)
  ).length

  const hasInactive = removed.size > 0 || excluded.size > 0

  const sorted = [...participants].sort((a, b) => {
    const aOut = removed.has(a.nickname) || excluded.has(a.nickname)
    const bOut = removed.has(b.nickname) || excluded.has(b.nickname)
    if (aOut === bOut) return 0
    return aOut ? 1 : -1
  })

  const filtered = query.trim()
    ? sorted.filter(u => u.nickname.toLowerCase().includes(query.toLowerCase()))
    : sorted

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: 'var(--card)',
        borderRadius: '20px',
        border: '1px solid var(--bd)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--bd)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--tx)' }}>
            Participants
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--teal)',
              background: 'rgba(0,151,169,0.12)',
              padding: '2px 9px',
              borderRadius: '999px',
            }}
          >
            {activeCount} active
          </span>
        </div>
        {hasInactive && (
          <button
            onClick={onResetAll}
            disabled={isSpinning}
            style={{
              border: 'none',
              background: 'none',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--txm)',
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              transition: 'color 0.15s ease',
              fontFamily: "'Hanken Grotesk', sans-serif",
            }}
            onMouseEnter={e => !isSpinning && (e.currentTarget.style.color = 'var(--txs)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--txm)')}
            aria-label="Restore all participants"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--bd)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--trk)', borderRadius: '10px',
          border: '1px solid var(--bd)', padding: '7px 12px',
        }}>
          <Search size={14} style={{ color: 'var(--txm)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter participants…"
            aria-label="Filter participants"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: '13px', color: 'var(--tx)', fontFamily: 'inherit',
              minWidth: 0,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear filter"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--txm)', padding: 0, display: 'flex', alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <ul
        ref={listRef}
        style={{
          margin: 0,
          padding: '8px 0',
          listStyle: 'none',
          overflowY: 'auto',
          maxHeight: '340px',
          flex: 1,
        }}
      >
        {filtered.length === 0 && (
          <li style={{ padding: '20px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--txm)' }}>
            No match for &ldquo;{query}&rdquo;
          </li>
        )}
        {filtered.map((user) => {
          const isRemoved = removed.has(user.nickname)
          const isExcluded = excluded.has(user.nickname)
          const isOut = isRemoved || isExcluded

          return (
            <li
              key={user.nickname}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 16px',
                opacity: isOut ? 0.45 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              <Avatar user={user} />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isOut ? 'var(--txs)' : 'var(--tx)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.nickname}
              </span>

              {/* Status badge */}
              {isExcluded && (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--orange)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  🏆 won
                </span>
              )}
              {isRemoved && !isExcluded && (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--txm)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  hidden
                </span>
              )}

              {/* Action button */}
              {isOut ? (
                <button
                  onClick={() => onRestore(user.nickname)}
                  disabled={isSpinning}
                  aria-label={`Restore ${user.nickname}`}
                  style={{
                    width: '28px',
                    height: '28px',
                    border: '1px solid var(--bd)',
                    borderRadius: '50%',
                    background: 'var(--trk)',
                    color: 'var(--txs)',
                    fontSize: '13px',
                    cursor: isSpinning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.15s ease',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => !isSpinning && (e.currentTarget.style.background = 'var(--card)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--trk)')}
                >
                  ↩
                </button>
              ) : (
                <button
                  onClick={() => onRemove(user.nickname)}
                  disabled={isSpinning}
                  aria-label={`Remove ${user.nickname} from wheel`}
                  style={{
                    width: '28px',
                    height: '28px',
                    border: '1px solid transparent',
                    borderRadius: '50%',
                    background: 'transparent',
                    color: 'var(--txm)',
                    fontSize: '13px',
                    cursor: isSpinning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.15s ease, color 0.15s ease',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => {
                    if (isSpinning) return
                    e.currentTarget.style.background = 'rgba(218,41,28,0.1)'
                    e.currentTarget.style.color = 'var(--red)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--txm)'
                  }}
                >
                  ✕
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
