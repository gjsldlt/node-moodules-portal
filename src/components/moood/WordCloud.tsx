'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { wordColor, wordRotation } from '@/lib/moood'
import type { DailyWord } from '@/app/moood/actions'
import type { FilterState } from './MoodFilterBar'

interface WordCloudProps {
  words: DailyWord[]
  filter: FilterState
}

interface WordItem {
  word: string
  count: number
  size: number
  color: string
  rotation: number
}

function buildWordItems(words: DailyWord[]): WordItem[] {
  if (words.length === 0) return []

  // Count word frequencies (case-insensitive)
  const freq: Record<string, number> = {}
  for (const w of words) {
    const key = w.word.toLowerCase()
    freq[key] = (freq[key] ?? 0) + 1
  }

  const sorted = Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 40)

  const maxFreq = sorted[0]?.[1] ?? 1

  return sorted.map(([word, count]) => ({
    word,
    count,
    size: clamp(14, (count / maxFreq) * 50 + 14, 64),
    color: wordColor(word),
    rotation: wordRotation(word),
  }))
}

function clamp(min: number, value: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Variants for individual words
const wordVariants = {
  hidden: { opacity: 0, scale: 0.4 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.03,
      duration: 0.45,
      ease: [0.2, 0.8, 0.3, 1.3] as [number, number, number, number],
    },
  }),
  exit: { opacity: 0, scale: 0.6, transition: { duration: 0.2 } },
}

const wordVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:   { opacity: 0, transition: { duration: 0.1 } },
}

export function WordCloud({ words, filter }: WordCloudProps) {
  const shouldReduce = useReducedMotion() ?? false
  const filterKey = JSON.stringify(filter)

  const items = useMemo(() => buildWordItems(words), [words])

  const variants = shouldReduce ? wordVariantsReduced : wordVariants

  return (
    <div
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
        {items.length === 0 ? (
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
          <motion.div
            key={filterKey}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              minHeight: '120px',
              padding: '8px 0',
            }}
          >
            {items.map((item, i) => (
              <motion.span
                key={item.word}
                custom={shouldReduce ? 0 : i}
                variants={variants}
                whileHover={shouldReduce ? {} : { scale: 1.18, transition: { duration: 0.15 } }}
                style={{
                  display: 'inline-block',
                  fontSize: `${item.size}px`,
                  fontWeight: item.count > 2 ? 800 : 600,
                  color: item.color,
                  lineHeight: 1.1,
                  cursor: 'default',
                  letterSpacing: '-0.01em',
                  transform: shouldReduce ? 'none' : `rotate(${item.rotation}deg)`,
                  userSelect: 'none',
                  transition: shouldReduce ? 'none' : 'transform 0.15s',
                }}
                aria-label={`${item.word} (${item.count})`}
              >
                {item.word}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
