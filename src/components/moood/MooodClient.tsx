'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useNickname } from '@/hooks/useNickname'
import { getMoodEntries, getDailyWords } from '@/app/moood/actions'
import type { MoodEntry, DailyWord } from '@/app/moood/actions'
import { getISODateStr, getISOWeekStart, getTodayStr } from '@/lib/moood'
import type { FilterState } from './MoodFilterBar'
import { MoodFilterBar } from './MoodFilterBar'
import { MoodCheckin } from './MoodCheckin'
import { WordOfDay } from './WordOfDay'
import { TeamPulseStats } from './TeamPulseStats'
import { MoodGraph } from './MoodGraph'
import { WordCloud } from './WordCloud'
import { MooodHero } from './MooodHero'

export interface MooodClientProps {
  initialMoodEntries: MoodEntry[]
  initialDailyWords: DailyWord[]
  trendEntries: MoodEntry[]
  weekStart: Date
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key="moood-toast"
          initial={{ opacity: 0, y: 16, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 10, x: '-50%' }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.3, 1.2] as [number, number, number, number] }}
          onClick={onDismiss}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '26px',
            left: '50%',
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
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── filterToDateRange ────────────────────────────────────────────────────────

function filterToDateRange(filter: FilterState): { from: string; to: string } {
  const today = getTodayStr()
  const weekStart = getISOWeekStart(new Date())
  const weekStartStr = getISODateStr(weekStart)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekEndStr = getISODateStr(weekEnd)

  if (filter.mode === 'today') {
    return { from: today, to: today }
  }
  if (filter.mode === 'week') {
    return { from: weekStartStr, to: weekEndStr }
  }
  if (filter.mode === 'day-of-week') {
    // Last 8 occurrences: go back 8 weeks from this week's occurrence
    const dow = filter.dayOfWeek ?? 0 // Mon=0
    const currentWeekDay = new Date(weekStart)
    currentWeekDay.setDate(weekStart.getDate() + dow)
    const eightWeeksAgo = new Date(currentWeekDay)
    eightWeeksAgo.setDate(currentWeekDay.getDate() - 7 * 7)
    return { from: getISODateStr(eightWeeksAgo), to: today }
  }
  if (filter.mode === 'range') {
    return {
      from: filter.rangeFrom ?? weekStartStr,
      to: filter.rangeTo ?? today,
    }
  }
  return { from: weekStartStr, to: weekEndStr }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MooodClient({
  initialMoodEntries,
  initialDailyWords,
  trendEntries,
  weekStart,
}: MooodClientProps) {
  const shouldReduce = useReducedMotion() ?? false
  const { nickname } = useNickname()

  // Derive personal entries from the team data using the nickname from context.
  // This avoids an extra client-side fetch — the server already loaded all team entries.
  const initialCheckinEntries = useMemo<Record<string, { mood_key: string; score: number }>>(() => {
    if (!nickname) return {}
    const result: Record<string, { mood_key: string; score: number }> = {}
    for (const e of initialMoodEntries) {
      if (e.nickname.toLowerCase() === nickname.toLowerCase()) {
        result[e.entry_date] = { mood_key: e.mood_key, score: e.score }
      }
    }
    return result
  }, [nickname, initialMoodEntries])

  const initialWordEntries = useMemo<Record<string, string>>(() => {
    if (!nickname) return {}
    const result: Record<string, string> = {}
    for (const w of initialDailyWords) {
      if (w.nickname.toLowerCase() === nickname.toLowerCase()) {
        result[w.entry_date] = w.word
      }
    }
    return result
  }, [nickname, initialDailyWords])

  const [filter, setFilter] = useState<FilterState>({ mode: 'week' })
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>(initialMoodEntries)
  const [dailyWords, setDailyWords] = useState<DailyWord[]>(initialDailyWords)

  // For "By Day" mode, TeamPulseStats and WordCloud should only see entries for
  // the selected weekday — MoodGraph handles its own internal filtering for the chart.
  const visEntries = useMemo<MoodEntry[]>(() => {
    if (filter.mode !== 'day-of-week' || filter.dayOfWeek === undefined) return moodEntries
    const targetJsDay = filter.dayOfWeek + 1 // Mon=0 → getDay()=1, Thu=3 → getDay()=4
    return moodEntries.filter((e) => new Date(e.entry_date + 'T00:00:00').getDay() === targetJsDay)
  }, [moodEntries, filter])

  const visWords = useMemo<DailyWord[]>(() => {
    if (filter.mode !== 'day-of-week' || filter.dayOfWeek === undefined) return dailyWords
    const targetJsDay = filter.dayOfWeek + 1
    return dailyWords.filter((w) => new Date(w.entry_date + 'T00:00:00').getDay() === targetJsDay)
  }, [dailyWords, filter])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  // Called by MoodCheckin after a successful submit so visualizations update immediately
  const handleMoodSubmit = useCallback((entry: { nickname: string; entry_date: string; score: number; mood_key: string }) => {
    setMoodEntries((prev) => {
      const without = prev.filter((e) => !(e.nickname.toLowerCase() === entry.nickname.toLowerCase() && e.entry_date === entry.entry_date))
      return [...without, { ...entry, id: `optimistic-${entry.nickname}-${entry.entry_date}`, submitted_at: new Date().toISOString() }]
    })
  }, [])

  // Called by WordOfDay after a successful submit
  const handleWordSubmit = useCallback((w: { nickname: string; entry_date: string; word: string }) => {
    setDailyWords((prev) => {
      const without = prev.filter((e) => !(e.nickname.toLowerCase() === w.nickname.toLowerCase() && e.entry_date === w.entry_date))
      return [...without, { ...w, id: `optimistic-${w.nickname}-${w.entry_date}`, submitted_at: new Date().toISOString() }]
    })
  }, [])

  const handleFilterChange = useCallback(async (newFilter: FilterState) => {
    setFilter(newFilter)

    // Range requires both dates to be set
    if (newFilter.mode === 'range' && (!newFilter.rangeFrom || !newFilter.rangeTo)) return

    setLoading(true)
    const { from, to } = filterToDateRange(newFilter)

    const [entries, words] = await Promise.all([
      getMoodEntries({ from, to }),
      getDailyWords({ from, to }),
    ])
    setMoodEntries(entries)
    setDailyWords(words)
    setLoading(false)
  }, [])

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduce ? 0 : 0.08 } },
  }
  const itemVariants = {
    hidden:  { opacity: 0, y: shouldReduce ? 0 : 22, scale: shouldReduce ? 1 : 0.985 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.2, 0.7, 0.3, 1] as [number, number, number, number] } },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Hero */}
      <motion.div variants={itemVariants}>
        <MooodHero entries={initialMoodEntries} />
      </motion.div>

      {/* Check-in row: Mood + Word of Day */}
      {nickname && (
        <motion.div
          variants={itemVariants}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}
        >
          <MoodCheckin
            nickname={nickname}
            initialEntries={initialCheckinEntries}
            weekStart={weekStart}
            onToast={showToast}
            onSubmit={handleMoodSubmit}
          />
          <WordOfDay
            nickname={nickname}
            initialWords={initialWordEntries}
            weekStart={weekStart}
            onToast={showToast}
            onSubmit={handleWordSubmit}
          />
        </motion.div>
      )}

      {/* Filter bar */}
      <motion.div variants={itemVariants}>
        <MoodFilterBar value={filter} onChange={handleFilterChange} />
      </motion.div>

      {/* Graph + Stats row */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          position: 'relative',
        }}
      >
        {loading && (
          <div
            aria-busy="true"
            aria-label="Loading"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              background: 'rgba(0,0,0,0.08)',
              borderRadius: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(2px)',
              pointerEvents: 'none',
            }}
          />
        )}
        <MoodGraph entries={moodEntries} filter={filter} />
        <TeamPulseStats entries={visEntries} trendEntries={trendEntries} />
      </motion.div>

      {/* Word cloud */}
      <motion.div variants={itemVariants}>
        <WordCloud words={visWords} filter={filter} />
      </motion.div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </motion.div>
  )
}
