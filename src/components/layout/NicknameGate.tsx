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
import { resolveNickname } from '@/app/actions/nickname'
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
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: pendingUser.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            animation: shouldReduce ? 'none' : 'tpBob 3s ease-in-out infinite',
          }}
          aria-hidden="true"
        >
          {pendingUser.emoji}
        </div>
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

// ─── NicknameProvider ────────────────────────────────────────────────────────

interface NicknameProviderProps {
  children: ReactNode
}

export function NicknameProvider({ children }: NicknameProviderProps) {
  const shouldReduce = useReducedMotion() ?? false

  // undefined = hydration pending (SSR), null = absent, string = resolved
  const [nickname, setNickname] = useState<string | null | undefined>(undefined)
  const [showGate, setShowGate] = useState(false)
  const [previousNickname, setPreviousNickname] = useState<string | null>(null)
  const [step, setStep] = useState<'name' | 'confirm'>('name')
  const [direction, setDirection] = useState<1 | -1>(1)
  const [pendingUser, setPendingUser] = useState<LocalUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stepNameError, setStepNameError] = useState<string | null>(null)
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
    startTransition(() => {
      if (stored) {
        setNickname(stored)
        // Fire-and-forget: update last_seen_at silently
        resolveNickname(stored).catch(() => {
          // Intentionally ignored — background update only
        })
      } else {
        setNickname(null)
        setShowGate(true)
      }
    })
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
      updateKnownUsers(result.user)
      setNickname(result.user.nickname)
      setShowGate(false)
      setStep('name')
      setDirection(1)
      setPreviousNickname(null)

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
    updateKnownUsers(pendingUser)
    setNickname(pendingUser.nickname)
    setShowGate(false)
    setStep('name')
    setDirection(1)
    setPreviousNickname(null)
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
    setIsSubmitting(false)
    setShowGate(true)
  }

  function handleCancel() {
    if (previousNickname) {
      // Storage was never cleared — just restore the in-memory state
      setNickname(previousNickname)
    }
    setPreviousNickname(null)
    setShowGate(false)
    setStep('name')
    setStepNameError(null)
  }

  // Render nothing distinctive while waiting for hydration
  if (nickname === undefined) {
    return (
      <NicknameContext.Provider value={{ nickname: null, triggerSwitch }}>
        {children}
      </NicknameContext.Provider>
    )
  }

  const activeCardVariants = shouldReduce ? cardVariantsReduced : cardVariants

  return (
    <NicknameContext.Provider value={{ nickname: nickname ?? null, triggerSwitch }}>
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
                  step === 'name' ? '#nickname-input' : '#confirm-yes-btn',
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
                    boxShadow: '0 22px 46px -32px var(--shadow)',
                    position: 'relative',
                    overflow: 'hidden',
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
