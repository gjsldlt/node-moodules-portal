'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { getWeekDays, getISODateStr, getTodayStr, isFutureDate, isEditableDate } from '@/lib/moood'

export interface MoodDayTabsProps {
  selectedDate: string         // "YYYY-MM-DD"
  onSelect: (date: string) => void
  submittedDates: string[]     // dates that have a submission for the current user
  weekStart: Date
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export function MoodDayTabs({ selectedDate, onSelect, submittedDates, weekStart }: MoodDayTabsProps) {
  const shouldReduce = useReducedMotion() ?? false
  const today = getTodayStr()
  const days = getWeekDays(weekStart)

  return (
    <div
      role="tablist"
      aria-label="Select day"
      style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '20px',
      }}
    >
      {days.map((day, i) => {
        const dateStr = getISODateStr(day)
        const isToday = dateStr === today
        const isSelected = dateStr === selectedDate
        const isSubmitted = submittedDates.includes(dateStr)
        const isPastWeek = !isEditableDate(dateStr)
        const isFuture = isFutureDate(dateStr)
        // Disable future days and past-week days
        const isDisabled = isFuture || isPastWeek

        return (
          <div key={dateStr} style={{ position: 'relative', flex: 1 }}>
            <button
              role="tab"
              aria-selected={isSelected}
              aria-controls={`day-panel-${dateStr}`}
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelect(dateStr)}
              style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                minHeight: '52px',
                padding: '8px 4px',
                borderRadius: '14px',
                border: isToday
                  ? '2px solid var(--teal)'
                  : '1px solid var(--bd)',
                background: isSelected
                  ? 'var(--tx)'
                  : 'transparent',
                color: isSelected
                  ? 'var(--bg)'
                  : isDisabled
                    ? 'var(--txm)'
                    : 'var(--txs)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: shouldReduce ? 'none' : 'background 0.15s, color 0.15s, border-color 0.15s',
                opacity: isDisabled ? 0.45 : 1,
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, lineHeight: 1, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                {DAY_LABELS[i]}
              </span>
              <span style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1 }}>
                {day.getDate()}
              </span>
              {/* Lock icon for past-week days */}
              {isPastWeek && (
                <span style={{ fontSize: '9px', lineHeight: 1 }} aria-hidden="true">🔒</span>
              )}
            </button>

            {/* Submitted green dot */}
            {isSubmitted && (
              <motion.div
                initial={shouldReduce ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--green)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
