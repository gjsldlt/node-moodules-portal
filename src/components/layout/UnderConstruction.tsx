'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface UnderConstructionProps {
  /** Page/feature name shown in the fake terminal, e.g. "shaw-rawt" */
  packageName?: string
  /** Short human label used in the heading, e.g. "Shaw-rawt" */
  label?: string
  /** Emoji shown in the bobbing icon cluster */
  emoji?: string
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

const LOG_LINES = [
  { delay: 0,    text: 'Resolving packages...' },
  { delay: 800,  text: 'Fetching from registry...' },
  { delay: 1600, text: 'Linking dependencies...' },
  { delay: 2600, text: 'Building fresh packages...' },
  { delay: 3400, text: 'Almost there...' },
]

/** Fake progress that rushes to 94% then creeps toward 99% — and stalls. */
function useFakeProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    let raf: number
    let start: number | null = null
    const tick = (now: number) => {
      if (!start) start = now
      const elapsed = now - start
      // Fast phase: 0→94% in 2.8s; slow phase: 94→99% over 6s; stalls at 99%
      let next: number
      if (elapsed < 2800) {
        next = (elapsed / 2800) * 94
      } else {
        const slow = Math.min((elapsed - 2800) / 6000, 1)
        next = 94 + slow * 5
      }
      setPct(Math.min(next, 99))
      if (next < 99) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return pct
}

export default function UnderConstruction({
  packageName = 'feature',
  label = 'This page',
  emoji = '🔧',
}: UnderConstructionProps) {
  const shouldReduce = useReducedMotion()

  const [spinnerIdx, setSpinnerIdx] = useState(0)
  const [visibleLines, setVisibleLines] = useState<number[]>([])
  const progress = useFakeProgress()

  // Braille spinner
  useEffect(() => {
    if (shouldReduce) return
    const id = setInterval(() => setSpinnerIdx(i => (i + 1) % SPINNER_FRAMES.length), 80)
    return () => clearInterval(id)
  }, [shouldReduce])

  // Drip log lines in one by one
  useEffect(() => {
    const timers = LOG_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(prev => [...prev, i]), line.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  // Entrance variants
  const EASE = [0.2, 0.7, 0.3, 1] as [number, number, number, number]

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduce ? 0 : 0.09 } },
  }
  const item = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 22, scale: shouldReduce ? 1 : 0.985 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { duration: 0.6, ease: EASE },
    },
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16 min-h-[70vh]">
      <motion.div
        className="w-full max-w-lg flex flex-col items-center gap-8 text-center"
        variants={container}
        initial="hidden"
        animate="visible"
      >

        {/* Bobbing emoji cluster */}
        <motion.div variants={item} className="relative flex items-end justify-center gap-3 h-20">
          <motion.span
            className="text-5xl"
            animate={shouldReduce ? {} : { y: [0, -10, 0] }}
            transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
          >
            {emoji}
          </motion.span>
          <motion.span
            className="text-3xl"
            animate={shouldReduce ? {} : { y: [0, -8, 0] }}
            transition={{ duration: 3.4, ease: 'easeInOut', repeat: Infinity, delay: 0.4 }}
          >
            📦
          </motion.span>
          <motion.span
            className="text-2xl"
            animate={shouldReduce ? {} : { y: [0, -6, 0] }}
            transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, delay: 0.8 }}
          >
            ⚙️
          </motion.span>
          {/* Spinning cog — tiny, floating top-right */}
          <motion.span
            className="absolute -top-1 right-0 text-lg"
            animate={shouldReduce ? {} : { rotate: 360 }}
            transition={{ duration: 4, ease: 'linear', repeat: Infinity }}
          >
            🔩
          </motion.span>
        </motion.div>

        {/* Heading */}
        <motion.div variants={item} className="flex flex-col gap-2">
          <h1 className="font-display font-bold text-tx" style={{ fontSize: 'clamp(28px, 5vw, 42px)', lineHeight: 1.06, letterSpacing: '-0.025em' }}>
            {label} is being built
          </h1>
          <p className="text-txs font-body text-base">
            Our devs are on it — no ETA but the vibes are immaculate.
          </p>
        </motion.div>

        {/* Fake terminal */}
        <motion.div
          variants={item}
          className="w-full rounded-[18px] overflow-hidden border border-bd text-left"
          style={{ background: 'var(--pnl)', boxShadow: '0 22px 46px -32px var(--shadow)' }}
        >
          {/* Terminal chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-bd">
            <span className="w-3 h-3 rounded-full bg-red-brand opacity-80" />
            <span className="w-3 h-3 rounded-full bg-yellow-brand opacity-80" />
            <span className="w-3 h-3 rounded-full bg-green opacity-80" />
            <span className="ml-3 text-txm text-xs font-body font-medium tracking-wide">terminal</span>
          </div>

          {/* Terminal body */}
          <div className="px-5 py-4 font-mono text-sm space-y-1 min-h-[140px]">
            {/* Command line */}
            <div className="flex gap-2">
              <span className="text-green select-none">$</span>
              <span className="text-txs">npm install </span>
              <span className="text-sky-brand font-semibold">{packageName}</span>
            </div>

            {/* Log lines dripping in */}
            {LOG_LINES.map((line, i) =>
              visibleLines.includes(i) ? (
                <motion.div
                  key={i}
                  className="text-txm pl-4"
                  initial={{ opacity: 0, x: shouldReduce ? 0 : -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {line.text}
                </motion.div>
              ) : null
            )}

            {/* Live spinner line */}
            {visibleLines.length === LOG_LINES.length && (
              <motion.div
                className="flex items-center gap-2 pl-4 text-teal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-teal">{shouldReduce ? '…' : SPINNER_FRAMES[spinnerIdx]}</span>
                <span className="text-txs">still installing...</span>
              </motion.div>
            )}
          </div>

          {/* Progress bar */}
          <div className="px-5 pb-5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-txm text-xs font-body">progress</span>
              <span className="text-txs text-xs font-body tabular-nums">{Math.floor(progress)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--trk)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, var(--teal), var(--sky))',
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
            {progress >= 99 && (
              <motion.p
                className="text-orange text-xs font-body mt-2 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                stuck at 99%... classic.
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Back home link */}
        <motion.div variants={item}>
          <Link
            href="/node-ifications"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill text-sm font-body font-semibold transition-all duration-200 hover:opacity-80 active:scale-95"
            style={{ background: 'var(--trk)', color: 'var(--tx)', border: '1px solid var(--bd)' }}
          >
            ← Back to node-ifications
          </Link>
        </motion.div>
      </motion.div>
    </main>
  )
}
