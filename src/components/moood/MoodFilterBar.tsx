'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export type FilterMode = 'today' | 'week' | 'day-of-week' | 'range'
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 // Mon=0 … Fri=4

export interface FilterState {
  mode: FilterMode
  dayOfWeek?: DayOfWeek
  rangeFrom?: string
  rangeTo?: string
}

interface MoodFilterBarProps {
  value: FilterState
  onChange: (filter: FilterState) => void
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export function MoodFilterBar({ value, onChange }: MoodFilterBarProps) {
  const shouldReduce = useReducedMotion() ?? false
  const [byDayExpanded, setByDayExpanded] = useState(value.mode === 'day-of-week')
  const [rangeExpanded, setRangeExpanded] = useState(value.mode === 'range')

  function handlePillClick(mode: FilterMode) {
    if (mode === 'day-of-week') {
      const willExpand = !byDayExpanded
      setByDayExpanded(willExpand)
      setRangeExpanded(false)
      if (willExpand) {
        const dow = (value.dayOfWeek ?? 0) as DayOfWeek
        onChange({ mode: 'day-of-week', dayOfWeek: dow })
      } else if (value.mode === 'day-of-week') {
        onChange({ mode: 'week' })
      }
      return
    }
    if (mode === 'range') {
      const willExpand = !rangeExpanded
      setRangeExpanded(willExpand)
      setByDayExpanded(false)
      if (willExpand) {
        onChange({ mode: 'range' })
      } else if (value.mode === 'range') {
        onChange({ mode: 'week' })
      }
      return
    }
    setByDayExpanded(false)
    setRangeExpanded(false)
    onChange({ mode })
  }

  function handleDow(dow: DayOfWeek) {
    onChange({ mode: 'day-of-week', dayOfWeek: dow })
  }

  function handleRangeFrom(from: string) {
    onChange({ mode: 'range', rangeFrom: from, rangeTo: value.rangeTo })
  }

  function handleRangeTo(to: string) {
    onChange({ mode: 'range', rangeFrom: value.rangeFrom, rangeTo: to })
  }

  const activePill = value.mode

  function pillStyle(mode: FilterMode) {
    const isActive = activePill === mode ||
      (mode === 'day-of-week' && activePill === 'day-of-week') ||
      (mode === 'range' && activePill === 'range')
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '7px 16px',
      borderRadius: '999px',
      border: isActive ? 'none' : '1px solid var(--bd)',
      background: isActive ? 'var(--tx)' : 'transparent',
      color: isActive ? 'var(--bg)' : 'var(--txs)',
      fontWeight: 600,
      fontSize: '14px',
      cursor: 'pointer',
      fontFamily: 'inherit',
      minHeight: '36px',
      flexShrink: 0 as const,
      transition: shouldReduce ? 'none' : 'background 0.15s, color 0.15s',
      whiteSpace: 'nowrap' as const,
    }
  }

  const dateInputStyle = {
    padding: '7px 10px',
    borderRadius: '12px',
    border: '1px solid var(--bd)',
    background: 'var(--trk)',
    color: 'var(--tx)',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    minHeight: '36px',
    colorScheme: 'dark' as const,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
      {/* Single row: pills + inline range inputs */}
      <div
        role="group"
        aria-label="Filter mood data"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
        }}
      >
        <button onClick={() => handlePillClick('today')} aria-pressed={activePill === 'today'} style={pillStyle('today')}>
          Today
        </button>
        <button onClick={() => handlePillClick('week')} aria-pressed={activePill === 'week'} style={pillStyle('week')}>
          This Week
        </button>
        <button
          onClick={() => handlePillClick('day-of-week')}
          aria-pressed={byDayExpanded}
          aria-expanded={byDayExpanded}
          style={pillStyle('day-of-week')}
        >
          By Day {byDayExpanded ? '▲' : '▾'}
        </button>
        <button
          onClick={() => handlePillClick('range')}
          aria-pressed={rangeExpanded}
          aria-expanded={rangeExpanded}
          style={pillStyle('range')}
        >
          Date Range
        </button>

        {/* By Day sub-tabs — inline to the right of the pills */}
        {byDayExpanded && (
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            role="group"
            aria-label="Select day of week"
            style={{ display: 'flex', gap: '6px', marginLeft: '4px' }}
          >
            {DOW_LABELS.map((label, i) => {
              const dow = i as DayOfWeek
              const isActive = value.mode === 'day-of-week' && value.dayOfWeek === dow
              return (
                <button
                  key={dow}
                  onClick={() => handleDow(dow)}
                  aria-pressed={isActive}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: isActive ? 'none' : '1px solid var(--bd)',
                    background: isActive ? 'var(--teal)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--txs)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    minHeight: '32px',
                    flexShrink: 0,
                    transition: shouldReduce ? 'none' : 'background 0.15s, color 0.15s',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </motion.div>
        )}

        {/* Range inputs — inline to the right of the pills */}
        {rangeExpanded && (
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}
          >
            <label htmlFor="range-from" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txs)', whiteSpace: 'nowrap' }}>
              From
            </label>
            <input
              id="range-from"
              type="date"
              value={value.rangeFrom ?? ''}
              onChange={(e) => handleRangeFrom(e.target.value)}
              style={dateInputStyle}
            />
            <label htmlFor="range-to" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txs)' }}>
              To
            </label>
            <input
              id="range-to"
              type="date"
              value={value.rangeTo ?? ''}
              min={value.rangeFrom}
              onChange={(e) => handleRangeTo(e.target.value)}
              style={dateInputStyle}
            />
          </motion.div>
        )}
      </div>

    </div>
  )
}
