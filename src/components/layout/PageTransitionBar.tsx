'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

type BarState = 'idle' | 'loading' | 'completing'

export function PageTransitionBar() {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const [barState, setBarState] = useState<BarState>('idle')
  const [progress, setProgress] = useState(0)
  const shouldReduce = useReducedMotion()
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect link clicks to start the bar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return
      // Same-page anchor or external — skip
      const isSamePage = href === pathname || href === window.location.pathname
      if (isSamePage) return
      setBarState('loading')
      setProgress(0)
    }
    window.addEventListener('click', handleClick, true)
    return () => window.removeEventListener('click', handleClick, true)
  }, [pathname])

  // Simulate progress creep while in loading state
  useEffect(() => {
    if (barState !== 'loading') return
    progressTimer.current = setTimeout(() => setProgress(75), 150)
    return () => { if (progressTimer.current) clearTimeout(progressTimer.current) }
  }, [barState])

  // Detect route resolve via pathname change
  useEffect(() => {
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname
    setBarState('completing')
    setProgress(100)
    if (completeTimer.current) clearTimeout(completeTimer.current)
    completeTimer.current = setTimeout(() => {
      setBarState('idle')
      setProgress(0)
    }, 500)
    return () => { if (completeTimer.current) clearTimeout(completeTimer.current) }
  }, [pathname])

  if (shouldReduce) return null

  return (
    <AnimatePresence>
      {barState !== 'idle' && (
        <motion.div
          key="tp-progress-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: barState === 'completing' ? 0.2 : 0.9,
              ease: barState === 'completing' ? 'easeOut' : [0.2, 0.0, 0.8, 1.0],
            }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #0097a9, #86bc25)',
              borderRadius: '0 3px 3px 0',
              boxShadow: '0 0 12px rgba(0,151,169,0.55)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
