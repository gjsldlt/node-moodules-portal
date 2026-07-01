'use client'

import {
  createContext,
  useState,
  useEffect,
  useRef,
  startTransition,
  type ReactNode,
  type FormEvent,
} from 'react'
import { X } from 'lucide-react'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'framer-motion'
import FocusTrap from 'focus-trap-react'
import { storageGet, storageSet, storageClear, STORAGE_KEYS } from '@/lib/storage'
import { getAvatar, AVATAR_PALETTE, AVATAR_EMOJIS, AVATAR_BADGES } from '@/lib/identity'
import { resolveNickname, validateSession, updateUserProfile } from '@/app/actions/nickname'
import { AvatarCircle } from './AvatarCircle'
import type { LocalUser, NicknameContextValue } from '@/types'

// ─── Context ────────────────────────────────────────────────────────────────

export const NicknameContext = createContext<NicknameContextValue | null>(null)

// ─── Transition helpers (Framer Motion 12 requires typed Transition objects) ─

const t_easeOut_03: Transition = { duration: 0.3, ease: 'easeOut' }
const t_pop_enter: Transition  = { duration: 0.45, ease: [0.2, 0.8, 0.3, 1.3] as [number, number, number, number] }
const t_step_enter: Transition = { duration: 0.28, ease: 'easeOut' }
const t_toast_exit: Transition = { duration: 0.2, ease: 'easeIn' }

// ─── Animation variants ──────────────────────────────────────────────────────

const backdropVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
}

// Full card variants (with scale)
const cardVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.9 },
}

// Reduced-motion card variants (opacity only)
const cardVariantsReduced: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
}

// Step variants — direction is passed via custom prop
// enter/exit are functions; center is the static rest state
const stepVariants: Variants = {
  enter:  (direction: 1 | -1) => ({ x: direction * 24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (direction: 1 | -1) => ({ x: direction * -24, opacity: 0 }),
}

const stepVariantsReduced: Variants = {
  enter:  { opacity: 0 },
  center: { opacity: 1 },
  exit:   { opacity: 0 },
}

// ─── Logo mark (card header version — smaller than Header) ──────────────────

function CardLogoMark({ animate }: { animate: boolean }) {
  return (
    <div
      style={{ position: 'relative', width: '24px', height: '24px', flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Green — top-left, static */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '11px', height: '11px', borderRadius: '50%',
        background: 'var(--green)',
      }} />
      {/* Teal — top-right, bobs */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '9px', height: '9px', borderRadius: '50%',
        background: 'var(--teal)',
        animation: animate ? 'tpBob 3s ease-in-out infinite' : 'none',
      }} />
      {/* Orange — bottom-center, bobs with delay */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '10px', height: '10px', borderRadius: '50%',
        background: 'var(--orange)',
        animation: animate ? 'tpBob 3s ease-in-out 0.3s infinite' : 'none',
      }} />
      {/* Red — bottom-right, static */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: '7px', height: '7px', borderRadius: '50%',
        background: 'var(--red)',
      }} />
    </div>
  )
}

// ─── Step 1 — Enter nickname ─────────────────────────────────────────────────

interface StepNameProps {
  shouldReduce: boolean
  direction: 1 | -1
  error: string | null
  isSubmitting: boolean
  onSubmit: (nickname: string) => void
}

function StepName({ shouldReduce, direction, error, isSubmitting, onSubmit }: StepNameProps) {
  const [value, setValue] = useState('')
  const variants = shouldReduce ? stepVariantsReduced : stepVariants

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isSubmitting) onSubmit(value)
  }

  return (
    <motion.div
      key="name"
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={shouldReduce ? t_step_enter : t_step_enter}
    >
      <h2
        id="gate-heading"
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 'clamp(20px, 4vw, 26px)',
          fontWeight: 700,
          color: 'var(--tx)',
          margin: '0 0 6px',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        Pick your nickname
      </h2>

      <p style={{ color: 'var(--txs)', fontSize: '0.9rem', margin: '0 0 20px', lineHeight: 1.5 }}>
        It&apos;s how your team will know you.
      </p>

      <form onSubmit={handleSubmit}>
        {/* sr-only label */}
        <label
          htmlFor="nickname-input"
          style={{
            position: 'absolute', width: 1, height: 1,
            overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
          }}
        >
          Nickname
        </label>

        <input
          id="nickname-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Alex, Kira-88, Dev Boi"
          maxLength={30}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={error ? 'nickname-error' : undefined}
          aria-invalid={error ? 'true' : undefined}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '14px',
            border: `1px solid ${error ? 'var(--red)' : 'var(--bd)'}`,
            background: 'var(--trk)',
            color: 'var(--tx)',
            fontSize: '1rem',
            fontFamily: 'inherit',
            outline: 'none',
            marginBottom: error ? '8px' : '20px',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--teal)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--bd)' }}
        />

        {error && (
          <span
            id="nickname-error"
            role="alert"
            style={{
              display: 'block',
              color: 'var(--red)',
              fontSize: '0.82rem',
              marginBottom: '16px',
            }}
          >
            {error}
          </span>
        )}

        <motion.button
          type="submit"
          disabled={isSubmitting || value.trim().length < 2}
          whileHover={{ y: shouldReduce ? 0 : -2 }}
          transition={{ duration: 0.15, ease: 'easeOut' } as Transition}
          style={{
            width: '100%',
            padding: '13px 28px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--tx)',
            color: 'var(--bg)',
            fontSize: '1rem',
            fontFamily: 'inherit',
            fontWeight: 600,
            cursor: isSubmitting || value.trim().length < 2 ? 'not-allowed' : 'pointer',
            minHeight: '44px',
            opacity: isSubmitting || value.trim().length < 2 ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {isSubmitting ? 'Checking…' : "Let's go →"}
        </motion.button>
      </form>
    </motion.div>
  )
}

// ─── Step 2 — Confirm identity ───────────────────────────────────────────────

interface StepConfirmProps {
  shouldReduce: boolean
  direction: 1 | -1
  pendingUser: LocalUser
  isSubmitting: boolean
  onConfirm: () => void
  onDeny: () => void
}

function StepConfirm({
  shouldReduce,
  direction,
  pendingUser,
  isSubmitting,
  onConfirm,
  onDeny,
}: StepConfirmProps) {
  const variants = shouldReduce ? stepVariantsReduced : stepVariants

  return (
    <motion.div
      key="confirm"
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={t_step_enter}
    >
      <h2
        id="gate-heading"
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 'clamp(18px, 3.5vw, 22px)',
          fontWeight: 700,
          color: 'var(--tx)',
          margin: '0 0 6px',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        Wait — is this you?
      </h2>

      <p style={{ color: 'var(--txs)', fontSize: '0.9rem', margin: '0 0 24px', lineHeight: 1.5 }}>
        That nickname already exists. Are you this person?
      </p>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <AvatarCircle
          color={pendingUser.color}
          emoji={pendingUser.emoji}
          size={64}
          animate={!shouldReduce}
        />
        <span style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--tx)',
          letterSpacing: '-0.01em',
        }}>
          {pendingUser.nickname}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <motion.button
          id="confirm-yes-btn"
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          whileHover={{ y: shouldReduce ? 0 : -2 }}
          transition={{ duration: 0.15, ease: 'easeOut' } as Transition}
          style={{
            width: '100%',
            padding: '13px 28px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--tx)',
            color: 'var(--bg)',
            fontSize: '1rem',
            fontFamily: 'inherit',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            minHeight: '44px',
            opacity: isSubmitting ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          Yes, that&apos;s me
        </motion.button>

        <button
          type="button"
          onClick={onDeny}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '13px 28px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--trk)',
            color: 'var(--tx)',
            fontSize: '1rem',
            fontFamily: 'inherit',
            fontWeight: 500,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            minHeight: '44px',
            opacity: isSubmitting ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          No, pick another
        </button>
      </div>
    </motion.div>
  )
}

// ─── Step 3 — Edit profile ───────────────────────────────────────────────────

const SECTION_LABEL_STYLE = {
  fontSize: '0.75rem',
  fontWeight: 600 as const,
  color: 'var(--txm)',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
}

interface StepEditProps {
  shouldReduce: boolean
  direction: 1 | -1
  currentNickname: string
  currentColor: string
  currentEmoji: string
  currentBadge: string
  error: string | null
  isSubmitting: boolean
  onSave: (nickname: string, color: string, emoji: string, badge: string) => void
  onCancel: () => void
}

function StepEdit({
  shouldReduce,
  direction,
  currentNickname,
  currentColor,
  currentEmoji,
  currentBadge,
  error,
  isSubmitting,
  onSave,
  onCancel,
}: StepEditProps) {
  const [nickname, setNickname] = useState(currentNickname)
  const [selectedColor, setSelectedColor] = useState(currentColor)
  const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji)
  const [selectedBadge, setSelectedBadge] = useState(currentBadge)
  const variants = shouldReduce ? stepVariantsReduced : stepVariants

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isSubmitting) onSave(nickname, selectedColor, selectedEmoji, selectedBadge)
  }

  const unchanged =
    nickname.trim() === currentNickname &&
    selectedColor === currentColor &&
    selectedEmoji === currentEmoji &&
    selectedBadge === currentBadge

  return (
    <motion.div
      key="edit"
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={t_step_enter}
    >
      <h2
        id="gate-heading"
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 'clamp(20px, 4vw, 24px)',
          fontWeight: 700,
          color: 'var(--tx)',
          margin: '0 0 4px',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        Edit your profile
      </h2>
      <p style={{ color: 'var(--txs)', fontSize: '0.875rem', margin: '0 0 18px', lineHeight: 1.5 }}>
        Customize your nickname, color, animal, and badge.
      </p>

      {/* Live avatar preview */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
        <AvatarCircle
          color={selectedColor}
          emoji={selectedEmoji}
          badge={selectedBadge}
          size={64}
          animate={!shouldReduce}
        />
      </div>

      <form onSubmit={handleSubmit}>
        {/* Nickname */}
        <label
          htmlFor="edit-nickname-input"
          style={{ ...SECTION_LABEL_STYLE, display: 'block', marginBottom: '6px' }}
        >
          Nickname
        </label>
        <input
          id="edit-nickname-input"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={30}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={error ? 'edit-error' : undefined}
          aria-invalid={error ? 'true' : undefined}
          style={{
            width: '100%',
            padding: '11px 16px',
            borderRadius: '14px',
            border: `1px solid ${error ? 'var(--red)' : 'var(--bd)'}`,
            background: 'var(--trk)',
            color: 'var(--tx)',
            fontSize: '1rem',
            fontFamily: 'inherit',
            outline: 'none',
            marginBottom: error ? '8px' : '18px',
            transition: 'border-color 0.15s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--teal)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--bd)' }}
        />

        {error && (
          <span
            id="edit-error"
            role="alert"
            style={{ display: 'block', color: 'var(--red)', fontSize: '0.82rem', marginBottom: '14px' }}
          >
            {error}
          </span>
        )}

        {/* Background color — 9-per-row grid, 2 rows for 18 colors */}
        <p style={SECTION_LABEL_STYLE}>Background</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: '7px',
          marginBottom: '18px',
        }}>
          {AVATAR_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              aria-label={`Color ${color}`}
              aria-pressed={selectedColor === color}
              style={{
                aspectRatio: '1',
                borderRadius: '50%',
                background: color,
                border: selectedColor === color ? '3px solid var(--tx)' : '2px solid transparent',
                outline: selectedColor === color ? '2px solid var(--card)' : 'none',
                cursor: 'pointer',
                transition: 'outline 0.12s, border 0.12s',
              }}
            />
          ))}
        </div>

        {/* Animal emoji — scrollable 6-col grid */}
        <p style={SECTION_LABEL_STYLE}>Animal</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '5px',
          maxHeight: '168px',
          overflowY: 'auto',
          marginBottom: '18px',
          paddingRight: '2px',
        }}>
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setSelectedEmoji(emoji)}
              aria-label={emoji}
              aria-pressed={selectedEmoji === emoji}
              style={{
                height: '40px',
                borderRadius: '10px',
                border: selectedEmoji === emoji ? '2px solid var(--teal)' : '2px solid transparent',
                background: selectedEmoji === emoji ? 'var(--trk)' : 'transparent',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.1s, border 0.1s',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Badge border */}
        <p style={SECTION_LABEL_STYLE}>Badge</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
          marginBottom: '20px',
        }}>
          {AVATAR_BADGES.map((badge) => (
            <button
              key={badge.id}
              type="button"
              onClick={() => setSelectedBadge(badge.id)}
              aria-label={badge.label}
              aria-pressed={selectedBadge === badge.id}
              style={{
                height: '56px',
                borderRadius: '12px',
                border: selectedBadge === badge.id ? '2px solid var(--teal)' : '2px solid var(--bd)',
                background: selectedBadge === badge.id ? 'var(--trk)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'background 0.1s, border 0.1s',
                padding: '0 4px',
              }}
            >
              {/* Mini avatar preview with badge */}
              <AvatarCircle
                color={selectedColor}
                emoji={selectedEmoji}
                badge={badge.id}
                size={24}
              />
              <span style={{
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--txs)',
                lineHeight: 1,
                textAlign: 'center',
              }}>
                {badge.label}
              </span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <motion.button
            type="submit"
            disabled={isSubmitting || unchanged || nickname.trim().length < 2}
            whileHover={{ y: shouldReduce ? 0 : -2 }}
            transition={{ duration: 0.15, ease: 'easeOut' } as Transition}
            style={{
              width: '100%',
              padding: '13px 28px',
              borderRadius: '999px',
              border: 'none',
              background: 'var(--tx)',
              color: 'var(--bg)',
              fontSize: '1rem',
              fontFamily: 'inherit',
              fontWeight: 600,
              cursor: isSubmitting || unchanged || nickname.trim().length < 2 ? 'not-allowed' : 'pointer',
              minHeight: '44px',
              opacity: isSubmitting || unchanged || nickname.trim().length < 2 ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </motion.button>

          <button
            type="button"
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '13px 28px',
              borderRadius: '999px',
              border: 'none',
              background: 'var(--trk)',
              color: 'var(--tx)',
              fontSize: '1rem',
              fontFamily: 'inherit',
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  )
}

// ─── NicknameProvider ────────────────────────────────────────────────────────

interface NicknameProviderProps {
  children: ReactNode
}

export function NicknameProvider({ children }: NicknameProviderProps) {
  const shouldReduce = useReducedMotion() ?? false

  // undefined = hydration pending (SSR), null = absent, string = resolved
  const [nickname, setNickname] = useState<string | null | undefined>(undefined)
  const [avatar, setAvatar] = useState<{ color: string; emoji: string; badge?: string } | null>(null)
  const [showGate, setShowGate] = useState(false)
  const [previousNickname, setPreviousNickname] = useState<string | null>(null)
  const [step, setStep] = useState<'name' | 'confirm' | 'edit'>('name')
  const [direction, setDirection] = useState<1 | -1>(1)
  const [pendingUser, setPendingUser] = useState<LocalUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stepNameError, setStepNameError] = useState<string | null>(null)
  const [stepEditError, setStepEditError] = useState<string | null>(null)
  const [bannerMessage, setBannerMessage] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  // On mount — read localStorage exactly once.
  // All setState calls are deferred via startTransition to satisfy the
  // react-hooks/set-state-in-effect lint rule (no synchronous setState in effect bodies).
  useEffect(() => {
    const stored = storageGet<string>(STORAGE_KEYS.NICKNAME)
    const storedAvatar = storageGet<{ color: string; emoji: string; badge?: string }>(STORAGE_KEYS.USER_AVATAR)

    if (stored) {
      // Optimistically restore the session from localStorage immediately…
      startTransition(() => {
        setNickname(stored)
        setAvatar(storedAvatar ?? getAvatar(stored))
      })

      // …then validate against the DB. If the account was deleted, clear and re-gate.
      validateSession(stored)
        .then((result) => {
          if (result === 'deleted') {
            startTransition(() => {
              storageClear()
              setNickname(null)
              setAvatar(null)
              setStep('name')
              setDirection(1)
              setStepNameError(null)
              setBannerMessage('Your nickname was removed. Pick a new one to continue.')
              setShowGate(true)
            })
          }
        })
        .catch(() => {
          // Network error — leave the session intact (fail-safe)
        })
    } else {
      startTransition(() => {
        setNickname(null)
        setAvatar(null)
        setShowGate(true)
      })
    }
  }, [])

  function showToast(message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastMessage(message)
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000)
  }

  function updateKnownUsers(user: LocalUser) {
    const existing = storageGet<LocalUser[]>(STORAGE_KEYS.KNOWN_USERS) ?? []
    const alreadyPresent = existing.some(
      (u) => u.nickname.toLowerCase() === user.nickname.toLowerCase()
    )
    if (!alreadyPresent) {
      storageSet(STORAGE_KEYS.KNOWN_USERS, [...existing, user])
    }
  }

  async function handleNameSubmit(inputNickname: string) {
    setIsSubmitting(true)
    setStepNameError(null)

    const result = await resolveNickname(inputNickname)

    if (result.status === 'created') {
      storageClear()
      storageSet(STORAGE_KEYS.NICKNAME, result.user.nickname)
      storageSet(STORAGE_KEYS.USER_AVATAR, { color: result.user.color, emoji: result.user.emoji })
      updateKnownUsers(result.user)
      setNickname(result.user.nickname)
      setAvatar({ color: result.user.color, emoji: result.user.emoji })
      setShowGate(false)
      setStep('name')
      setDirection(1)
      setPreviousNickname(null)
      setBannerMessage(null)

      // Dynamic import keeps canvas-confetti out of the SSR bundle
      const confetti = (await import('canvas-confetti')).default
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#86bc25', '#0097a9', '#62b5e5', '#da291c', '#ed8b00', '#ffcd00'],
      })

      showToast(`You're in, ${result.user.nickname}! ${result.user.emoji}`)
    } else if (result.status === 'exists') {
      setPendingUser(result.user)
      setDirection(1)
      setStep('confirm')
    } else {
      setStepNameError(result.message)
    }

    setIsSubmitting(false)
  }

  function handleConfirmYes() {
    if (!pendingUser) return
    // Clear old user's data only when switching to a different account
    if (previousNickname?.toLowerCase() !== pendingUser.nickname.toLowerCase()) {
      storageClear()
    }
    storageSet(STORAGE_KEYS.NICKNAME, pendingUser.nickname)
    storageSet(STORAGE_KEYS.USER_AVATAR, { color: pendingUser.color, emoji: pendingUser.emoji })
    updateKnownUsers(pendingUser)
    setNickname(pendingUser.nickname)
    setAvatar({ color: pendingUser.color, emoji: pendingUser.emoji })
    setShowGate(false)
    setStep('name')
    setDirection(1)
    setPreviousNickname(null)
    setBannerMessage(null)
    showToast(`Welcome back, ${pendingUser.nickname}! ${pendingUser.emoji}`)
    setPendingUser(null)
  }

  function handleConfirmNo() {
    setDirection(-1)
    setStep('name')
    setPendingUser(null)
    setStepNameError("That name's taken — pick another?")
  }

  function triggerSwitch() {
    // Save current nickname so cancel can restore it. Don't clear storage yet —
    // only clear when the user actually confirms a new/different account.
    setPreviousNickname(nickname ?? null)
    setNickname(null)
    setPendingUser(null)
    setStep('name')
    setDirection(1)
    setStepNameError(null)
    setStepEditError(null)
    setIsSubmitting(false)
    setShowGate(true)
  }

  function triggerEdit() {
    setPreviousNickname(nickname ?? null)
    setStepEditError(null)
    setIsSubmitting(false)
    setStep('edit')
    setDirection(1)
    setShowGate(true)
  }

  async function handleSaveProfile(newNickname: string, newColor: string, newEmoji: string, newBadge: string) {
    if (!nickname) return
    setIsSubmitting(true)
    setStepEditError(null)

    const result = await updateUserProfile(nickname, {
      nickname: newNickname,
      avatarColor: newColor,
      avatarEmoji: newEmoji,
    })

    if (result.status === 'ok') {
      const updated = result.user
      storageSet(STORAGE_KEYS.NICKNAME, updated.nickname)
      storageSet(STORAGE_KEYS.USER_AVATAR, { color: updated.color, emoji: updated.emoji, badge: newBadge })
      // Replace old entry in known users
      const existing = storageGet<LocalUser[]>(STORAGE_KEYS.KNOWN_USERS) ?? []
      const filtered = existing.filter(
        (u) => u.nickname.toLowerCase() !== nickname.toLowerCase()
      )
      storageSet(STORAGE_KEYS.KNOWN_USERS, [...filtered, updated])
      setNickname(updated.nickname)
      setAvatar({ color: updated.color, emoji: updated.emoji, badge: newBadge })
      setPreviousNickname(null)
      setShowGate(false)
      setStep('name')
      showToast(`Profile updated! ${updated.emoji}`)
    } else {
      setStepEditError(result.message)
    }

    setIsSubmitting(false)
  }

  function handleCancel() {
    if (previousNickname && step !== 'edit') {
      // Switch flow: storage was never cleared — restore the in-memory state
      setNickname(previousNickname)
    }
    setPreviousNickname(null)
    setShowGate(false)
    setStep('name')
    setStepNameError(null)
    setStepEditError(null)
  }

  // Render nothing distinctive while waiting for hydration
  if (nickname === undefined) {
    return (
      <NicknameContext.Provider value={{ nickname: null, avatar: null, triggerSwitch, triggerEdit }}>
        {children}
      </NicknameContext.Provider>
    )
  }

  const activeCardVariants = shouldReduce ? cardVariantsReduced : cardVariants

  return (
    <NicknameContext.Provider value={{ nickname: nickname ?? null, avatar, triggerSwitch, triggerEdit }}>
      {children}

      {/* Overlay — rendered after children so it sits on top in DOM order */}
      <AnimatePresence>
        {showGate && (
          <motion.div
            key="gate-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={t_easeOut_03}
            onClick={previousNickname ? handleCancel : undefined}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              padding: '24px',
              cursor: previousNickname ? 'default' : undefined,
            }}
          >
            <FocusTrap
              focusTrapOptions={{
                initialFocus:
                  step === 'name'    ? '#nickname-input' :
                  step === 'edit'    ? '#edit-nickname-input' :
                                       '#confirm-yes-btn',
                allowOutsideClick: !!previousNickname,
                returnFocusOnDeactivate: true,
              }}
            >
              {/* FocusTrap requires a single DOM-element child */}
              <div>
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="gate-heading"
                  variants={activeCardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={
                    shouldReduce
                      ? ({ duration: 0.2, ease: 'easeOut' } as Transition)
                      : t_pop_enter
                  }
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: 'var(--card)',
                    borderRadius: '26px',
                    padding: '28px 28px 32px',
                    width: 'min(calc(100vw - 48px), 430px)',
                    maxHeight: 'calc(100dvh - 48px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    boxShadow: '0 22px 46px -32px var(--shadow)',
                    position: 'relative',
                  }}
                >
                  {/* Close button — only when switching from an existing account */}
                  {previousNickname && (
                    <button
                      onClick={handleCancel}
                      aria-label="Cancel and go back"
                      style={{
                        position: 'absolute', top: '18px', right: '18px',
                        width: '32px', height: '32px', borderRadius: '50%',
                        border: '1px solid var(--bd)', background: 'var(--trk)',
                        color: 'var(--txm)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}

                  {/* Card header: logo mark + wordmark */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <CardLogoMark animate={!shouldReduce} />
                    <span style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontWeight: 800,
                      fontSize: '15px',
                      letterSpacing: '-0.02em',
                      color: 'var(--tx)',
                      lineHeight: 1,
                    }}>
                      Node Moodus
                    </span>
                  </div>

                  {/* Deleted-account notice */}
                  {bannerMessage && (
                    <div style={{
                      background: 'rgba(237,139,0,0.1)',
                      border: '1px solid rgba(237,139,0,0.3)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      marginBottom: '20px',
                      fontSize: '0.85rem',
                      color: 'var(--orange)',
                      lineHeight: 1.5,
                    }}>
                      ⚠️ {bannerMessage}
                    </div>
                  )}

                  {/* Steps — keyed so AnimatePresence triggers on step change */}
                  <AnimatePresence mode="wait" custom={direction}>
                    {step === 'name' && (
                      <StepName
                        key="name"
                        shouldReduce={shouldReduce}
                        direction={direction}
                        error={stepNameError}
                        isSubmitting={isSubmitting}
                        onSubmit={handleNameSubmit}
                      />
                    )}
                    {step === 'confirm' && pendingUser && (
                      <StepConfirm
                        key="confirm"
                        shouldReduce={shouldReduce}
                        direction={direction}
                        pendingUser={pendingUser}
                        isSubmitting={isSubmitting}
                        onConfirm={handleConfirmYes}
                        onDeny={handleConfirmNo}
                      />
                    )}
                    {step === 'edit' && nickname && (
                      <StepEdit
                        key="edit"
                        shouldReduce={shouldReduce}
                        direction={direction}
                        currentNickname={nickname}
                        currentColor={avatar?.color ?? getAvatar(nickname).color}
                        currentEmoji={avatar?.emoji ?? getAvatar(nickname).emoji}
                        currentBadge={avatar?.badge ?? 'none'}
                        error={stepEditError}
                        isSubmitting={isSubmitting}
                        onSave={handleSaveProfile}
                        onCancel={handleCancel}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </FocusTrap>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast — sibling to the overlay so it survives the overlay exit animation */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="toast"
            exit={{ opacity: 0, y: 12 }}
            transition={t_toast_exit}
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
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--tx)',
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 24px -8px var(--shadow)',
              animation: 'tpToast 0.35s cubic-bezier(.2,.8,.3,1.2) both',
              pointerEvents: 'none',
            }}
            role="status"
            aria-live="polite"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </NicknameContext.Provider>
  )
}
