'use client'

import { useState, useTransition, useRef, useEffect, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, AlertTriangle, Search } from 'lucide-react'
import { AvatarCircle } from '@/components/layout/AvatarCircle'
import { AVATAR_PALETTE, AVATAR_EMOJIS, getAvatar } from '@/lib/identity'
import { adminCreateUser, adminUpdateUser, adminDeleteUser } from '@/app/actions/adminUsers'
import type { UserRow } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(iso))
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)   return `${d}d ago`
  return formatDate(iso)
}

// ─── Section label shared style ──────────────────────────────────────────────

const LABEL: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 600,
  color: 'var(--txm)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 6px',
  display: 'block',
}

// ─── Avatar form (shared between create + edit) ───────────────────────────────

interface AvatarFormProps {
  initialNickname: string
  initialColor: string
  initialEmoji: string
  error: string | null
  isPending: boolean
  submitLabel: string
  onSubmit: (nickname: string, color: string, emoji: string) => void
  onCancel: () => void
}

function AvatarForm({
  initialNickname,
  initialColor,
  initialEmoji,
  error,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
}: AvatarFormProps) {
  const [nickname, setNickname] = useState(initialNickname)
  const [color, setColor] = useState(initialColor)
  const [emoji, setEmoji] = useState(initialEmoji)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isPending) onSubmit(nickname, color, emoji)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Live preview */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <AvatarCircle color={color} emoji={emoji} size={56} animate />
      </div>

      {/* Nickname */}
      <label htmlFor="admin-nick" style={LABEL}>Nickname</label>
      <input
        ref={inputRef}
        id="admin-nick"
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={30}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '12px',
          border: `1px solid ${error ? 'var(--red)' : 'var(--bd)'}`,
          background: 'var(--trk)',
          color: 'var(--tx)',
          fontSize: '0.95rem',
          fontFamily: 'inherit',
          outline: 'none',
          marginBottom: error ? '6px' : '16px',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--teal)' }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--bd)' }}
      />

      {error && (
        <p role="alert" style={{ color: 'var(--red)', fontSize: '0.8rem', margin: '0 0 14px' }}>
          {error}
        </p>
      )}

      {/* Color */}
      <p style={LABEL}>Background</p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(9, 1fr)',
        gap: '6px',
        marginBottom: '16px',
      }}>
        {AVATAR_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={color === c}
            onClick={() => setColor(c)}
            style={{
              aspectRatio: '1',
              borderRadius: '50%',
              background: c,
              border: color === c ? '3px solid var(--tx)' : '2px solid transparent',
              outline: color === c ? '2px solid var(--card)' : 'none',
              cursor: 'pointer',
              transition: 'outline 0.1s, border 0.1s',
            }}
          />
        ))}
      </div>

      {/* Emoji */}
      <p style={LABEL}>Animal</p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '4px',
        maxHeight: '148px',
        overflowY: 'auto',
        marginBottom: '20px',
        paddingRight: '2px',
      }}>
        {AVATAR_EMOJIS.map((em) => (
          <button
            key={em}
            type="button"
            aria-label={em}
            aria-pressed={emoji === em}
            onClick={() => setEmoji(em)}
            style={{
              height: '38px',
              borderRadius: '8px',
              border: emoji === em ? '2px solid var(--teal)' : '2px solid transparent',
              background: emoji === em ? 'var(--trk)' : 'transparent',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.1s, border 0.1s',
            }}
          >
            {em}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="submit"
          disabled={isPending || nickname.trim().length < 2}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--tx)',
            color: 'var(--bg)',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            fontWeight: 600,
            cursor: isPending || nickname.trim().length < 2 ? 'not-allowed' : 'pointer',
            opacity: isPending || nickname.trim().length < 2 ? 0.5 : 1,
            minHeight: '40px',
            transition: 'opacity 0.15s',
          }}
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--trk)',
            color: 'var(--tx)',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            fontWeight: 500,
            cursor: 'pointer',
            minHeight: '40px',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

function Modal({ title, onClose, children }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card)',
          borderRadius: '24px',
          padding: '24px',
          width: 'min(calc(100vw - 48px), 400px)',
          maxHeight: 'calc(100dvh - 48px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: '0 22px 46px -32px var(--shadow)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--tx)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '30px', height: '30px', borderRadius: '50%',
              border: '1px solid var(--bd)', background: 'var(--trk)',
              color: 'var(--txm)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={13} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '26px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        background: 'var(--card)',
        border: '1px solid var(--bd)',
        borderRadius: '999px',
        padding: '10px 20px',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--tx)',
        whiteSpace: 'nowrap',
        boxShadow: '0 8px 24px -8px var(--shadow)',
        animation: 'tpToast 0.35s cubic-bezier(.2,.8,.3,1.2) both',
        pointerEvents: 'none',
      }}
    >
      {message}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Mode =
  | { type: 'idle' }
  | { type: 'creating' }
  | { type: 'editing'; user: UserRow }

interface Props { initialUsers: UserRow[] }

export function UsersClient({ initialUsers }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<Mode>({ type: 'idle' })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  function closeModal() {
    setMode({ type: 'idle' })
    setFormError(null)
  }

  // ── Create ──
  function handleCreate(nickname: string, color: string, emoji: string) {
    setFormError(null)
    startTransition(async () => {
      const result = await adminCreateUser(nickname, color, emoji)
      if (result.status === 'error') {
        setFormError(result.message)
        return
      }
      setUsers((prev) => [result.user, ...prev])
      closeModal()
      showToast(`${result.user.avatar_emoji} ${result.user.nickname} added`)
    })
  }

  // ── Update ──
  function handleUpdate(nickname: string, color: string, emoji: string) {
    if (mode.type !== 'editing') return
    const { user } = mode
    setFormError(null)
    startTransition(async () => {
      const result = await adminUpdateUser(user.id, nickname, color, emoji)
      if (result.status === 'error') {
        setFormError(result.message)
        return
      }
      setUsers((prev) => prev.map((u) => (u.id === result.user.id ? result.user : u)))
      closeModal()
      showToast(`${result.user.avatar_emoji} ${result.user.nickname} updated`)
    })
  }

  // ── Delete ──
  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await adminDeleteUser(id)
      if (result.status === 'error') {
        showToast(`Error: ${result.message}`)
        setDeletingId(null)
        return
      }
      const deleted = users.find((u) => u.id === id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setDeletingId(null)
      showToast(`${deleted?.avatar_emoji ?? '👤'} ${deleted?.nickname ?? 'User'} deleted`)
    })
  }

  const defaultAvatar = getAvatar('')

  const filtered = query.trim()
    ? users.filter((u) => u.nickname.toLowerCase().includes(query.trim().toLowerCase()))
    : users

  return (
    <>
      <main style={{ flex: 1, padding: 'clamp(20px, 4vw, 40px)' }}>

        {/* Page header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(22px, 3vw, 30px)',
              fontWeight: 800,
              color: 'var(--tx)',
              margin: '0 0 2px',
              letterSpacing: '-0.02em',
            }}>
              Nickname records
            </h1>
            <p style={{ color: 'var(--txm)', fontSize: '0.875rem', margin: 0 }}>
              {query.trim()
                ? `${filtered.length} of ${users.length} ${users.length === 1 ? 'user' : 'users'}`
                : `${users.length} ${users.length === 1 ? 'user' : 'users'}`
              }
            </p>
          </div>

          <button
            onClick={() => { setFormError(null); setMode({ type: 'creating' }) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '999px',
              border: 'none',
              background: 'var(--green)',
              color: '#fff',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '40px',
              flexShrink: 0,
            }}
          >
            <Plus size={16} />
            New user
          </button>
        </div>

        {/* Search */}
        {users.length > 0 && (
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--txm)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nicknames…"
              autoComplete="off"
              spellCheck={false}
              style={{
                width: '100%',
                padding: '10px 36px 10px 38px',
                borderRadius: '12px',
                border: '1px solid var(--bd)',
                background: 'var(--card)',
                color: 'var(--tx)',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--teal)' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--bd)' }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--trk)',
                  color: 'var(--txm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {users.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            color: 'var(--txm)',
            fontSize: '0.9rem',
          }}>
            No users yet. Create one above.
          </div>
        )}

        {/* No results from search */}
        {users.length > 0 && filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--txm)',
            fontSize: '0.9rem',
          }}>
            No nicknames match &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Table */}
        {filtered.length > 0 && (
          <div style={{
            background: 'var(--card)',
            borderRadius: '20px',
            border: '1px solid var(--bd)',
            overflow: 'hidden',
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 140px 140px 100px',
              gap: '0',
              padding: '10px 20px',
              borderBottom: '1px solid var(--bd)',
              background: 'var(--trk)',
            }}>
              {['', 'Nickname', 'Created', 'Last seen', ''].map((col, i) => (
                <span key={i} style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--txm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  textAlign: i === 4 ? 'right' : 'left',
                }}>
                  {col}
                </span>
              ))}
            </div>

            {/* Table rows */}
            {filtered.map((user, idx) => {
              const isConfirmingDelete = deletingId === user.id

              return (
                <div
                  key={user.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 140px 140px 100px',
                    alignItems: 'center',
                    gap: '0',
                    padding: '12px 20px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--bd)' : 'none',
                    background: isConfirmingDelete ? 'rgba(218,41,28,0.06)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Avatar */}
                  <AvatarCircle
                    color={user.avatar_color}
                    emoji={user.avatar_emoji}
                    size={32}
                  />

                  {/* Nickname */}
                  <span style={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: 'var(--tx)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    paddingRight: '12px',
                  }}>
                    {user.nickname}
                  </span>

                  {/* Created */}
                  <span style={{ fontSize: '0.8rem', color: 'var(--txs)' }}>
                    {formatDate(user.created_at)}
                  </span>

                  {/* Last seen */}
                  <span style={{ fontSize: '0.8rem', color: 'var(--txs)' }}
                    title={formatDate(user.last_seen_at)}
                  >
                    {formatRelative(user.last_seen_at)}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    {isConfirmingDelete ? (
                      // Inline delete confirmation
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={isPending}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            border: 'none',
                            background: 'var(--red)',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontFamily: 'inherit',
                            fontWeight: 600,
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            opacity: isPending ? 0.6 : 1,
                            minHeight: '28px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isPending ? '…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          disabled={isPending}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            border: '1px solid var(--bd)',
                            background: 'var(--trk)',
                            color: 'var(--txs)',
                            fontSize: '0.75rem',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            minHeight: '28px',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setFormError(null)
                            setMode({ type: 'editing', user })
                          }}
                          aria-label={`Edit ${user.nickname}`}
                          style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            border: '1px solid var(--bd)', background: 'var(--trk)',
                            color: 'var(--txs)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingId(user.id)}
                          aria-label={`Delete ${user.nickname}`}
                          style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            border: '1px solid rgba(218,41,28,0.3)', background: 'rgba(218,41,28,0.08)',
                            color: 'var(--red)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Delete warning note */}
        {deletingId && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            padding: '10px 16px',
            background: 'rgba(218,41,28,0.08)',
            border: '1px solid rgba(218,41,28,0.2)',
            borderRadius: '12px',
            color: 'var(--red)',
            fontSize: '0.82rem',
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            Hard delete — this cannot be undone.
          </div>
        )}
      </main>

      {/* Create modal */}
      {mode.type === 'creating' && (
        <Modal title="New user" onClose={closeModal}>
          <AvatarForm
            initialNickname=""
            initialColor={AVATAR_PALETTE[0]}
            initialEmoji={AVATAR_EMOJIS[0]}
            error={formError}
            isPending={isPending}
            submitLabel="Create user"
            onSubmit={handleCreate}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {mode.type === 'editing' && (
        <Modal title="Edit user" onClose={closeModal}>
          <AvatarForm
            initialNickname={mode.user.nickname}
            initialColor={mode.user.avatar_color}
            initialEmoji={mode.user.avatar_emoji}
            error={formError}
            isPending={isPending}
            submitLabel="Save changes"
            onSubmit={handleUpdate}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {/* Toast */}
      {toast && <Toast message={toast} />}
    </>
  )
}
