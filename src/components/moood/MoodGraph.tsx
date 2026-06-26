'use client'

import { useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { MOODS, getMoodByKey, getISOWeekStart, getISODateStr } from '@/lib/moood'
import type { MoodEntry } from '@/app/moood/actions'
import type { FilterState } from './MoodFilterBar'

interface MoodGraphProps {
  entries: MoodEntry[]
  filter: FilterState
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const EMOJI_Y_MAP: Record<number, string> = { 1: '😣', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' }

// Interpolate a color between red (#da291c) and green (#86bc25) based on 1–5 score
function scoreToColor(score: number): string {
  const t = (score - 1) / 4 // 0 at score=1, 1 at score=5
  // Red channel: 218 → 134
  const r = Math.round(218 + (134 - 218) * t)
  // Green channel: 41 → 188
  const g = Math.round(41 + (188 - 41) * t)
  // Blue channel: 28 → 37
  const b = Math.round(28 + (37 - 28) * t)
  return `rgb(${r},${g},${b})`
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { moodKey?: string; avg?: number; count?: number } }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  const val = payload[0].value
  const moodKey = payload[0].payload?.moodKey
  const count   = payload[0].payload?.count
  const mood = moodKey ? getMoodByKey(moodKey) : MOODS.find((m) => m.score === Math.round(val))

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--bd)',
        borderRadius: '12px',
        padding: '10px 14px',
        fontSize: '13px',
        color: 'var(--tx)',
        boxShadow: '0 8px 24px -8px var(--shadow)',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '4px' }}>{label}</div>
      {mood && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '18px' }}>{mood.emoji}</span>
          <span>{mood.label}</span>
          <span style={{ color: 'var(--txm)' }}>({typeof val === 'number' ? val.toFixed(1) : val})</span>
        </div>
      )}
      {count !== undefined && (
        <div style={{ color: 'var(--txm)', marginTop: '2px' }}>{count} submission{count !== 1 ? 's' : ''}</div>
      )}
    </div>
  )
}

// ─── Data builders ────────────────────────────────────────────────────────────

type GraphDataPoint = { name: string; score?: number; avg?: number; count?: number; moodKey?: string }

function buildTodayData(entries: MoodEntry[]): GraphDataPoint[] {
  return entries.map((e) => ({
    name: e.nickname.slice(0, 8),
    score: e.score,
    moodKey: e.mood_key,
  }))
}

function buildWeekData(entries: MoodEntry[]): GraphDataPoint[] {
  const weekStart = getISOWeekStart(new Date())
  return DOW_LABELS.map((label, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dateStr = getISODateStr(d)
    const dayEntries = entries.filter((e) => e.entry_date === dateStr)
    const avg = dayEntries.length > 0
      ? dayEntries.reduce((a, e) => a + e.score, 0) / dayEntries.length
      : 0
    return { name: label, avg, count: dayEntries.length }
  })
}

function buildDowData(entries: MoodEntry[], dayOfWeek: number): GraphDataPoint[] {
  // Group entries by date, keep only the specified day of week (ISO: Mon=1…Sun=7)
  // dayOfWeek: Mon=0…Fri=4 → JS getDay Mon=1…Fri=5
  const targetJsDay = dayOfWeek + 1

  const byDate: Record<string, number[]> = {}
  for (const e of entries) {
    const d = new Date(e.entry_date + 'T00:00:00')
    if (d.getDay() === targetJsDay) {
      byDate[e.entry_date] = byDate[e.entry_date] ?? []
      byDate[e.entry_date].push(e.score)
    }
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([date, scores]) => ({
      name: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avg: scores.reduce((a, c) => a + c, 0) / scores.length,
      count: scores.length,
    }))
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MoodGraph({ entries, filter }: MoodGraphProps) {
  const shouldReduce = useReducedMotion() ?? false
  const animDuration = shouldReduce ? 0 : 800

  const data = useMemo<GraphDataPoint[]>(() => {
    if (filter.mode === 'today') return buildTodayData(entries)
    if (filter.mode === 'week') return buildWeekData(entries)
    if (filter.mode === 'day-of-week') return buildDowData(entries, filter.dayOfWeek ?? 0)
    // range — treat same as week view (avg per day)
    const byDate: Record<string, number[]> = {}
    for (const e of entries) {
      byDate[e.entry_date] = byDate[e.entry_date] ?? []
      byDate[e.entry_date].push(e.score)
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => ({
        name: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avg: scores.reduce((a, c) => a + c, 0) / scores.length,
        count: scores.length,
      }))
  }, [entries, filter])

  const filterKey = JSON.stringify(filter)

  const isEmpty = entries.length === 0 ||
    (filter.mode === 'range' && (!filter.rangeFrom || !filter.rangeTo))

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: '26px',
        border: '1px solid var(--bd)',
        boxShadow: '0 22px 46px -32px var(--shadow)',
        padding: '24px',
        flex: '2 1 320px',
        minWidth: 0,
      }}
    >
      <h2
        style={{
          margin: '0 0 16px',
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: '18px',
          letterSpacing: '-.01em',
          color: 'var(--tx)',
        }}
      >
        Mood Graph
      </h2>

      {isEmpty ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--txm)', fontSize: '14px' }}>
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" minHeight={220}>
          {filter.mode === 'day-of-week' ? (
            // Line chart for day-of-week trend
            <LineChart
              key={filterKey}
              data={data as { name: string; avg: number; count: number }[]}
              margin={{ top: 8, right: 12, left: 4, bottom: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--txm)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(v: number) => EMOJI_Y_MAP[v] ?? String(v)}
                tick={{ fill: 'var(--txm)', fontSize: 14 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'var(--bd)', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#0097a9"
                strokeWidth={2.5}
                dot={{ fill: '#0097a9', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#0097a9' }}
                animationDuration={animDuration}
              />
            </LineChart>
          ) : (
            // Bar chart for today / week / range
            <BarChart
              key={filterKey}
              data={data}
              margin={{ top: 8, right: 12, left: 4, bottom: 16 }}
              barCategoryGap="32%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--txm)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(v: number) => EMOJI_Y_MAP[v] ?? ''}
                tick={{ fill: 'var(--txm)', fontSize: 14 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'var(--trk)', radius: 8 }}
              />
              <Bar
                dataKey={filter.mode === 'today' ? 'score' : 'avg'}
                radius={[6, 6, 0, 0]}
                animationBegin={0}
                animationDuration={animDuration}
              >
                {data.map((entry, index) => {
                  const val = filter.mode === 'today' ? (entry.score ?? 0) : (entry.avg ?? 0)
                  const color = filter.mode === 'today'
                    ? (getMoodByKey(entry.moodKey ?? '')?.color ?? '#0097a9')
                    : scoreToColor(val)
                  return <Cell key={`cell-${index}`} fill={color} />
                })}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  )
}
