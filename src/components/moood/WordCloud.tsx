'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import cloud from 'd3-cloud'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { DailyWord } from '@/app/moood/actions'
import type { FilterState } from './MoodFilterBar'

const BRAND = ['#86bc25', '#0097a9', '#62b5e5', '#da291c', '#ed8b00', '#009a44']
const CLOUD_HEIGHT = 320

interface WordCloudProps {
  words: DailyWord[]
  filter: FilterState
}

interface ProcessedWord {
  word: string
  count: number
  size: number
  color: string
  weight: number
  font: string
}

interface PlacedWord extends ProcessedWord {
  x: number
  y: number
  rotate: number
}

// extend d3-cloud's Word with our custom fields
interface D3Word extends cloud.Word {
  color: string
  count: number
  weight: number
  font: string
}

function hashWord(word: string): number {
  let h = 5381
  for (let i = 0; i < word.length; i++) h = ((h << 5) + h + word.charCodeAt(i)) >>> 0
  return h
}

function buildWords(raw: DailyWord[]): ProcessedWord[] {
  if (raw.length === 0) return []
  const freq: Record<string, number> = {}
  for (const w of raw) {
    const k = w.word.toLowerCase().trim()
    if (k) freq[k] = (freq[k] ?? 0) + 1
  }
  const sorted = Object.entries(freq).sort(([, a], [, b]) => b - a).slice(0, 60)
  const max = sorted[0]?.[1] ?? 1
  return sorted.map(([word, count]) => ({
    word,
    count,
    size: Math.round(Math.pow(count / max, 0.5) * 56 + 14),
    color: BRAND[hashWord(word) % BRAND.length],
    weight: count > 3 ? 800 : count > 1 ? 700 : 600,
    // display face for prominent words, body face for the tail
    font: count >= 2
      ? "'Bricolage Grotesque', sans-serif"
      : "'Hanken Grotesk', sans-serif",
  }))
}

export function WordCloud({ words, filter }: WordCloudProps) {
  const shouldReduce = useReducedMotion() ?? false
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(580)
  const [placed, setPlaced] = useState<PlacedWord[]>([])
  const [animKey, setAnimKey] = useState(0)

  const items = useMemo(() => buildWords(words), [words])

  // Measure inner width (subtract card padding)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = (w: number) => setWidth(Math.max(220, w - 48))
    update(el.clientWidth)
    const ro = new ResizeObserver(e => update(e[0]?.contentRect.width ?? el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Run d3-cloud layout whenever items or width changes
  useEffect(() => {
    if (items.length === 0) {
      setPlaced([])
      return
    }
    let cancelled = false

    const layout = cloud<D3Word>()
      .size([width, CLOUD_HEIGHT])
      .words(
        items.map(p => ({
          text: p.word,
          size: p.size,
          color: p.color,
          count: p.count,
          weight: p.weight,
          font: p.font,
        }))
      )
      // per-word font so d3-cloud measures each word correctly
      .font(d => d.font ?? "'Hanken Grotesk', sans-serif")
      .fontWeight(d => d.weight ?? 600)
      .fontSize(d => d.size ?? 14)
      .rotate(d => {
        const h = hashWord(d.text ?? '') % 10
        return h < 7 ? 0 : h < 9 ? 30 : -30
      })
      .padding(6)
      .spiral('archimedean')
      .on('end', computed => {
        if (cancelled) return
        setPlaced(
          computed
            .filter(w => w.x !== undefined && w.y !== undefined)
            .map(w => ({
              word: w.text ?? '',
              count: w.count,
              size: w.size ?? 14,
              color: w.color,
              weight: w.weight ?? 600,
              font: w.font,
              x: w.x!,
              y: w.y!,
              rotate: w.rotate ?? 0,
            }))
        )
        setAnimKey(k => k + 1)
      })

    layout.start()
    return () => {
      cancelled = true
      layout.stop()
    }
  }, [items, width])

  const filterKey = JSON.stringify(filter)

  return (
    <div
      ref={containerRef}
      style={{
        background: 'var(--card)',
        borderRadius: '26px',
        border: '1px solid var(--bd)',
        boxShadow: '0 22px 46px -32px var(--shadow)',
        padding: '24px',
      }}
    >
      <h2
        style={{
          margin: '0 0 20px',
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          fontSize: '18px',
          letterSpacing: '-.01em',
          color: 'var(--tx)',
        }}
      >
        Word Cloud
      </h2>

      <AnimatePresence mode="wait">
        {placed.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--txm)',
              fontSize: '14px',
            }}
          >
            No words yet for this period
          </motion.div>
        ) : (
          <motion.svg
            key={`wc-${animKey}-${filterKey}`}
            initial="hidden"
            animate="visible"
            exit="hidden"
            width="100%"
            height={CLOUD_HEIGHT}
            viewBox={`${-width / 2} ${-CLOUD_HEIGHT / 2} ${width} ${CLOUD_HEIGHT}`}
            style={{ display: 'block', overflow: 'visible' }}
            aria-label="Word cloud of team submissions"
          >
            {placed.map((w, i) => (
              // Static SVG g for positioning — Framer Motion on the text for animation
              <g
                key={w.word}
                transform={`translate(${w.x},${w.y}) rotate(${w.rotate})`}
              >
                <motion.text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={w.size}
                  fontFamily={w.font}
                  fontWeight={w.weight}
                  fill={w.color}
                  style={{
                    cursor: 'default',
                    userSelect: 'none',
                    // scale from the word's own center
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    // Bricolage-specific: tight tracking + optical sizing
                    ...(w.font.includes('Bricolage') && {
                      letterSpacing: '-0.025em',
                      fontVariationSettings: `'opsz' ${Math.min(96, Math.max(12, w.size))}`,
                    }),
                  }}
                  variants={{
                    hidden: shouldReduce
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.2 },
                    visible: shouldReduce
                      ? { opacity: 1, transition: { duration: 0.2, delay: i * 0.008 } }
                      : {
                          opacity: 1,
                          scale: 1,
                          transition: {
                            delay: i * 0.028,
                            duration: 0.5,
                            ease: [0.2, 0.8, 0.3, 1.3],
                          },
                        },
                  }}
                  whileHover={
                    shouldReduce
                      ? {}
                      : {
                          scale: 1.22,
                          transition: { duration: 0.15, ease: 'easeOut' },
                        }
                  }
                  aria-label={`${w.word} ×${w.count}`}
                >
                  {w.word}
                </motion.text>
              </g>
            ))}
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  )
}
