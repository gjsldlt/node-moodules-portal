'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { MOODS, getISOWeekStart, getISODateStr } from '@/lib/moood'
import type { MoodEntry } from '@/app/moood/actions'

interface TeamPulseStatsProps {
  entries: MoodEntry[]       // filtered period entries
  trendEntries: MoodEntry[]  // last 6 weeks for trend bars
}

// Group trend entries into 6 weekly buckets and compute avg per week
function buildTrendBuckets(entries: MoodEntry[]): { label: string; avg: number }[] {
  if (entries.length === 0) return []

  // Build 6 weekly buckets going backwards from current week
  const now = new Date()
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (5 - i) * 7)
    const weekStart = getISOWeekStart(d)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return {
      from: getISODateStr(weekStart),
      to:   getISODateStr(weekEnd),
      label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      scores: [] as number[],
    }
  })

  for (const entry of entries) {
    for (const bucket of buckets) {
      if (entry.entry_date >= bucket.from && entry.entry_date <= bucket.to) {
        bucket.scores.push(entry.score)
        break
      }
    }
  }

  return buckets.map((b) => ({
    label: b.label,
    avg: b.scores.length > 0 ? b.scores.reduce((a, c) => a + c, 0) / b.scores.length : 0,
  }))
}

export function TeamPulseStats({ entries, trendEntries }: TeamPulseStatsProps) {
  const shouldReduce = useReducedMotion() ?? false

  const stats = useMemo(() => {
    if (entries.length === 0) return null
    const avg = entries.reduce((a, e) => a + e.score, 0) / entries.length
    const countByKey: Record<string, number> = {}
    for (const e of entries) {
      countByKey[e.mood_key] = (countByKey[e.mood_key] ?? 0) + 1
    }
    const maxCount = Math.max(...Object.values(countByKey), 1)
    return { avg, countByKey, maxCount, total: entries.length }
  }, [entries])

  const trendBuckets = useMemo(() => buildTrendBuckets(trendEntries), [trendEntries])
  const maxTrend = Math.max(...trendBuckets.map((b) => b.avg), 1)

  // Find the dominant mood label/emoji for the avg
  const avgMood = stats
    ? MOODS.find((m) => m.score === Math.round(stats.avg)) ?? MOODS[2]
    : null

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: '26px',
        border: '1px solid var(--bd)',
        boxShadow: '0 22px 46px -32px var(--shadow)',
        padding: '24px',
        flex: '1 1 240px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <h2
          style={{
            margin: 0,
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: '18px',
            letterSpacing: '-.01em',
            color: 'var(--tx)',
          }}
        >
          Team Pulse
        </h2>
        {/* Live pulse dot */}
        <div
          aria-label="Live indicator"
          style={{ position: 'relative', width: '10px', height: '10px', flexShrink: 0 }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'var(--teal)',
              animation: shouldReduce ? 'none' : 'tpPulse 2s ease-out infinite',
              opacity: shouldReduce ? 0 : undefined,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '2px',
              borderRadius: '50%',
              background: 'var(--teal)',
            }}
          />
        </div>
        <span style={{ fontSize: '13px', color: 'var(--txs)', fontWeight: 500 }}>
          {stats?.total ?? 0} checked in
        </span>
      </div>

      {!stats ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--txm)', fontSize: '14px' }}>
          No data for this period
        </div>
      ) : (
        <>
          {/* Big avg score */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800,
                fontSize: '42px',
                lineHeight: 1,
                letterSpacing: '-0.03em',
                color: 'var(--tx)',
              }}
            >
              {stats.avg.toFixed(1)}
            </div>
            <div style={{ marginTop: '4px', fontSize: '14px', color: 'var(--txs)' }}>
              avg score &middot; {avgMood?.label} {avgMood?.emoji}
            </div>
          </div>

          {/* Distribution bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {MOODS.map((mood) => {
              const count = stats.countByKey[mood.key] ?? 0
              const pct = stats.maxCount > 0 ? (count / stats.maxCount) : 0

              return (
                <div key={mood.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">
                    {mood.emoji}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '8px',
                      borderRadius: '999px',
                      background: 'var(--trk)',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: shouldReduce ? pct : pct }}
                      transition={shouldReduce ? { duration: 0 } : { duration: 0.6, ease: [0.2, 0.7, 0.3, 1] }}
                      style={{
                        height: '100%',
                        borderRadius: '999px',
                        background: mood.color,
                        transformOrigin: 'left',
                        width: `${pct * 100}%`,
                        // We use scaleX animation starting from 0 with width at final value
                        transform: 'scaleX(1)',
                      }}
                      key={`${mood.key}-${count}`}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: count > 0 ? mood.color : 'var(--txm)',
                      minWidth: '20px',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {count}
                  </span>
                </div>
              )
            })}
          </div>

          {/* 6-week trend mini bars */}
          {trendBuckets.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txm)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                6-week trend
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'flex-end',
                  height: '48px',
                }}
                role="img"
                aria-label="6-week mood trend chart"
              >
                {trendBuckets.map((bucket, i) => {
                  const heightPct = maxTrend > 0 ? bucket.avg / 5 : 0

                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%',
                        gap: '4px',
                      }}
                      title={`${bucket.label}: ${bucket.avg > 0 ? bucket.avg.toFixed(1) : 'no data'}`}
                    >
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={
                          shouldReduce
                            ? { duration: 0 }
                            : { duration: 0.6, delay: i * 0.07, ease: [0.2, 0.7, 0.3, 1] }
                        }
                        style={{
                          width: '100%',
                          height: `${Math.max(heightPct * 36, bucket.avg > 0 ? 4 : 2)}px`,
                          borderRadius: '4px 4px 2px 2px',
                          background: bucket.avg > 0 ? 'var(--teal)' : 'var(--trk)',
                          transformOrigin: 'bottom',
                        }}
                      />
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                {trendBuckets.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      fontSize: '9px',
                      color: 'var(--txm)',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
