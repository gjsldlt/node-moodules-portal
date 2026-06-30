'use client'

import { motion, useReducedMotion } from 'framer-motion'

// template.tsx remounts on every navigation (unlike layout.tsx which persists).
// This gives every page a smooth entrance without needing per-page animation wrappers.
export default function Template({ children }: { children: React.ReactNode }) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={
        shouldReduce
          ? { opacity: 0 }
          : { opacity: 0, y: 12, scale: 0.985 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: shouldReduce ? 0.15 : 0.45,
        ease: [0.2, 0.7, 0.3, 1],
      }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}
    >
      {children}
    </motion.div>
  )
}
