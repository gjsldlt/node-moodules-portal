'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MOODS, CONFETTI_COLORS, getTodayStr, getISODateStr, getWeekDays, isEditableDate, isFutureDate, getMoodByKey } from '@/lib/moood'
import { submitMoodEntry } from '@/app/moood/actions'
import { MoodDayTabs } from './MoodDayTabs'

interface CheckinEntry {
  mood_key: string
  score: number
}

export interface MoodCheckinProps {
  nickname: string
  initialEntries: Record<string, CheckinEntry> // date → entry
  weekStart: Date
  onToast: (msg: string) => void
  onSubmit?: (entry: { nickname: string; entry_date: string; score: number; mood_key: string }) => void
}

const popVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.2, 0.8, 0.3, 1.3] as [number, number, number, number] } },
  exit:   { opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: 'easeIn' as const } },
}

const popVariantsReduced = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
}

export function MoodCheckin({ nickname, initialEntries, weekStart, onToast, onSubmit }: MoodCheckinProps) {
  const shouldReduce = useReducedMotion() ?? false
  const today = getTodayStr()

  const [entries, setEntries] = useState<Record<string, CheckinEntry>>(initialEntries)
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const days = getWeekDays(weekStart)
  const submittedDates = days
    .map((d) => getISODateStr(d))
    .filter((d) => !!entries[d])

  const isPastWeek = !isEditableDate(selectedDate)
  const isFuture   = isFutureDate(selectedDate)
  const isLocked   = isPastWeek || isFuture
  const currentEntry = entries[selectedDate] ?? null

  // When switching days, reset the pending mood selection
  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date)
    setSelectedMood(null)
  }, [])

  const activeMoodKey = selectedMood ?? currentEntry?.mood_key ?? null

  async function handleSubmit() {
    if (!activeMoodKey || submitting) return
    const mood = MOODS.find((m) => m.key === activeMoodKey)
    if (!mood) return

    setSubmitting(true)

    // Optimistic update
    const optimistic: CheckinEntry = { mood_key: mood.key, score: mood.score }
    setEntries((prev) => ({ ...prev, [selectedDate]: optimistic }))

    const res = await submitMoodEntry({
      nickname,
      entry_date: selectedDate,
      score: mood.score,
      mood_key: mood.key,
    })

    if (res.error) {
      // Roll back
      setEntries((prev) => {
        const next = { ...prev }
        if (initialEntries[selectedDate]) {
          next[selectedDate] = initialEntries[selectedDate]
        } else {
          delete next[selectedDate]
        }
        return next
      })
      onToast(`Could not save — ${res.error}`)
    } else {
      // Celebrate
      if (!shouldReduce) {
        const confetti = (await import('canvas-confetti')).default
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.55 },
          colors: CONFETTI_COLORS,
        })
      }
      onToast(`Pulse saved! ${mood.emoji}`)
      onSubmit?.({ nickname, entry_date: selectedDate, score: mood.score, mood_key: mood.key })
      setSelectedMood(null)
    }

    setSubmitting(false)
  }

  const variants = shouldReduce ? popVariantsReduced : popVariants

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: '26px',
        border: '1px solid var(--bd)',
        boxShadow: '0 22px 46px -32px var(--shadow)',
        padding: '24px',
        flex: '1.4 1 320px',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h2
        style={{
          margin: '0 0 16px',
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: '20px',
          letterSpacing: '-.01em',
          color: 'var(--tx)',
        }}
      >
        My Mood
      </h2>

      <MoodDayTabs
        selectedDate={selectedDate}
        onSelect={handleSelectDate}
        submittedDates={submittedDates}
        weekStart={weekStart}
      />

      <AnimatePresence mode="wait">
        {isLocked ? (
          <motion.div
            key={`locked-${selectedDate}`}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              gap: '12px',
              color: 'var(--txm)',
              textAlign: 'center',
            }}
          >
            {currentEntry ? (
              <>
                <div
                  style={{
                    fontSize: '48px',
                    animation: shouldReduce ? 'none' : 'tpBob 3s ease-in-out infinite',
                  }}
                  aria-label={getMoodByKey(currentEntry.mood_key)?.label}
                >
                  {getMoodByKey(currentEntry.mood_key)?.emoji}
                </div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--txs)' }}>
                  {getMoodByKey(currentEntry.mood_key)?.label}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--txm)' }}>
                  {isPastWeek ? 'Past-week entry — locked' : 'Future date'}
                </div>
              </>
            ) : (
              <>
                <span style={{ fontSize: '32px' }} aria-hidden="true">🔒</span>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                  {isPastWeek ? 'Past-week entries are locked' : 'Future date — not yet'}
                </div>
              </>
            )}
          </motion.div>
        ) : currentEntry && !selectedMood ? (
          /* Submitted state */
          <motion.div
            key={`submitted-${selectedDate}`}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 16px',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '52px',
                animation: shouldReduce ? 'none' : 'tpBob 3s ease-in-out infinite',
              }}
              aria-label={`Your mood: ${getMoodByKey(currentEntry.mood_key)?.label}`}
              role="img"
            >
              {getMoodByKey(currentEntry.mood_key)?.emoji}
            </div>
            <div
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: '22px',
                color: 'var(--tx)',
                letterSpacing: '-0.01em',
              }}
            >
              {getMoodByKey(currentEntry.mood_key)?.label}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--txm)' }}>
              Pulse saved for {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <button
              onClick={() => setSelectedMood(currentEntry.mood_key)}
              style={{
                marginTop: '4px',
                padding: '8px 20px',
                borderRadius: '999px',
                border: '1px solid var(--bd)',
                background: 'var(--trk)',
                color: 'var(--txs)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                minHeight: '36px',
              }}
            >
              Change pulse
            </button>
          </motion.div>
        ) : (
          /* Selection state */
          <motion.div
            key={`select-${selectedDate}`}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '12px' }}
          >
            {/* Mood emoji buttons */}
            <div
              role="radiogroup"
              aria-label="Select your mood"
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              {MOODS.map((mood) => {
                const isActive = activeMoodKey === mood.key
                return (
                  <motion.button
                    key={mood.key}
                    role="radio"
                    aria-checked={isActive}
                    aria-label={mood.label}
                    onClick={() => setSelectedMood(mood.key)}
                    whileHover={shouldReduce ? {} : { scale: 1.08 }}
                    whileTap={shouldReduce ? {} : { scale: 0.95 }}
                    animate={isActive && !shouldReduce ? { scale: 1.12 } : { scale: 1 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '12px 4px',
                      minHeight: '72px',
                      borderRadius: '16px',
                      border: isActive
                        ? `2px solid ${mood.color}`
                        : '1px solid var(--bd)',
                      background: isActive
                        ? `${mood.color}18`
                        : 'var(--trk)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: shouldReduce ? 'none' : 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '26px', lineHeight: 1 }} aria-hidden="true">
                      {mood.emoji}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: isActive ? mood.color : 'var(--txm)',
                        lineHeight: 1,
                        transition: shouldReduce ? 'none' : 'color 0.15s',
                      }}
                    >
                      {mood.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* Submit CTA */}
            <motion.button
              onClick={handleSubmit}
              disabled={!activeMoodKey || submitting}
              whileHover={shouldReduce || !activeMoodKey ? {} : { y: -2 }}
              transition={{ duration: 0.15 }}
              style={{
                width: '100%',
                padding: '13px 24px',
                borderRadius: '999px',
                border: 'none',
                background: activeMoodKey ? 'var(--tx)' : 'var(--trk)',
                color: activeMoodKey ? 'var(--bg)' : 'var(--txm)',
                fontSize: '15px',
                fontWeight: 600,
                cursor: !activeMoodKey || submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                minHeight: '48px',
                transition: shouldReduce ? 'none' : 'background 0.2s, color 0.2s',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Saving…' : currentEntry ? 'Update pulse' : 'Submit my pulse'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
