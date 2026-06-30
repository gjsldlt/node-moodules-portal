'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { getWeekDays, getISODateStr, getTodayStr, isEditableDate, isFutureDate, wordColor } from '@/lib/moood'
import { submitDailyWord } from '@/app/moood/actions'
import { MoodDayTabs } from './MoodDayTabs'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export interface WordOfDayProps {
  nickname: string
  initialWords: Record<string, string> // date → word
  weekStart: Date
  onToast: (msg: string) => void
  onSubmit?: (w: { nickname: string; entry_date: string; word: string }) => void
}

export function WordOfDay({ nickname, initialWords, weekStart, onToast, onSubmit }: WordOfDayProps) {
  const shouldReduce = useReducedMotion() ?? false
  const today = getTodayStr()
  const days = getWeekDays(weekStart)

  const [words, setWords] = useState<Record<string, string>>(initialWords)
  const [selectedDate, setSelectedDate] = useState(today)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [chipsRef] = useAutoAnimate<HTMLDivElement>()

  const submittedDates = days
    .map((d) => getISODateStr(d))
    .filter((d) => !!words[d])

  const isPastWeek = !isEditableDate(selectedDate)
  const isFuture   = isFutureDate(selectedDate)
  const isLocked   = isPastWeek || isFuture
  const currentWord = words[selectedDate] ?? null

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date)
    setInputValue('')
    setError(null)
  }, [])

  // When user clicks a chip to edit that day
  function handleChipEdit(date: string) {
    if (!isEditableDate(date) || isFutureDate(date)) return
    setSelectedDate(date)
    setInputValue(words[date] ?? '')
    setError(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function validateWord(val: string): string | null {
    const trimmed = val.trim()
    if (!trimmed) return 'Please enter a word.'
    if (trimmed.length > 20) return 'Max 20 characters.'
    if (/\s/.test(trimmed)) return 'Single word only — no spaces.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    const err = validateWord(trimmed)
    if (err) { setError(err); return }

    setSubmitting(true)
    setError(null)

    // Optimistic
    setWords((prev) => ({ ...prev, [selectedDate]: trimmed }))

    const res = await submitDailyWord({ nickname, entry_date: selectedDate, word: trimmed })

    if (res.error) {
      setWords((prev) => {
        const next = { ...prev }
        if (initialWords[selectedDate]) {
          next[selectedDate] = initialWords[selectedDate]
        } else {
          delete next[selectedDate]
        }
        return next
      })
      setError(res.error)
    } else {
      onToast('Word saved!')
      onSubmit?.({ nickname, entry_date: selectedDate, word: trimmed })
      setInputValue('')
    }

    setSubmitting(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Block spaces client-side
    const val = e.target.value.replace(/\s/g, '')
    setInputValue(val)
    if (error) setError(null)
  }

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: '26px',
        border: '1px solid var(--bd)',
        boxShadow: '0 22px 46px -32px var(--shadow)',
        padding: '24px',
        flex: '1 1 260px',
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
        Word of the Day
      </h2>

      <MoodDayTabs
        selectedDate={selectedDate}
        onSelect={handleSelectDate}
        submittedDates={submittedDates}
        weekStart={weekStart}
      />

      {isLocked ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '28px 16px',
            gap: '10px',
            color: 'var(--txm)',
            textAlign: 'center',
          }}
        >
          {currentWord ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  borderRadius: '999px',
                  background: `${wordColor(currentWord)}22`,
                  color: wordColor(currentWord),
                  fontWeight: 800,
                  fontSize: '18px',
                  letterSpacing: '-0.01em',
                }}
              >
                {currentWord}
              </span>
              <div style={{ fontSize: '13px', color: 'var(--txm)' }}>
                {isPastWeek ? 'Past-week — locked' : 'Future date'}
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: '32px' }} aria-hidden="true">🔒</span>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>
                {isPastWeek ? 'Past-week entries are locked' : 'Future date — not yet'}
              </div>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <label
            htmlFor="wotd-input"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--txs)',
              marginBottom: '8px',
            }}
          >
            Your word for {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            {currentWord && (
              <span style={{ marginLeft: '8px', color: 'var(--txm)', fontWeight: 400 }}>
                (currently: &ldquo;{currentWord}&rdquo;)
              </span>
            )}
          </label>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                id="wotd-input"
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={currentWord ? `Change "${currentWord}"` : 'Your word for today…'}
                maxLength={20}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-describedby={error ? 'wotd-error' : undefined}
                aria-invalid={error ? 'true' : undefined}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '14px',
                  border: `1px solid ${error ? 'var(--red)' : 'var(--bd)'}`,
                  background: 'var(--trk)',
                  color: 'var(--tx)',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: shouldReduce ? 'none' : 'border-color 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--teal)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--bd)' }}
              />
            </div>
            <motion.button
              type="submit"
              disabled={!inputValue.trim() || submitting}
              whileHover={shouldReduce || !inputValue.trim() ? {} : { y: -1 }}
              transition={{ duration: 0.15 }}
              style={{
                padding: '11px 18px',
                borderRadius: '14px',
                border: 'none',
                background: inputValue.trim() ? 'var(--teal)' : 'var(--trk)',
                color: inputValue.trim() ? '#fff' : 'var(--txm)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: !inputValue.trim() || submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                minHeight: '44px',
                flexShrink: 0,
                transition: shouldReduce ? 'none' : 'background 0.15s, color 0.15s',
              }}
            >
              {submitting ? '…' : currentWord ? 'Update' : 'Save'}
            </motion.button>
          </div>

          {error && (
            <span
              id="wotd-error"
              role="alert"
              style={{ display: 'block', fontSize: '12px', color: 'var(--red)', marginTop: '6px' }}
            >
              {error}
            </span>
          )}
        </form>
      )}

      {/* This-week chips — pushed to bottom when card stretches */}
      <div ref={chipsRef} style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '20px' }}>
        {days.map((day, i) => {
          const dateStr = getISODateStr(day)
          const word = words[dateStr]
          const canEdit = isEditableDate(dateStr) && !isFutureDate(dateStr)
          const color = word ? wordColor(word) : undefined

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => word && canEdit && handleChipEdit(dateStr)}
              disabled={!word}
              aria-label={word ? `${DAY_LABELS[i]}: ${word}${canEdit ? ' — click to edit' : ''}` : `${DAY_LABELS[i]}: no word yet`}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '8px 4px',
                borderRadius: '14px',
                border: word
                  ? `1px solid ${color}44`
                  : '1px solid var(--bd)',
                background: word
                  ? `${color}18`
                  : 'transparent',
                color: word ? color : 'var(--txm)',
                fontFamily: 'inherit',
                minHeight: '44px',
                cursor: word && canEdit ? 'pointer' : 'default',
                transition: shouldReduce ? 'none' : 'background 0.15s',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: word ? color : 'var(--txm)', opacity: 0.65, lineHeight: 1 }}>
                {DAY_LABELS[i]}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                {word ?? '–'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
