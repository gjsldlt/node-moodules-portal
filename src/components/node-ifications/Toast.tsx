'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect } from 'react'

export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [message, onDismiss])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: shouldReduce ? 0 : 24, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: shouldReduce ? 0 : 24, x: '-50%' }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.3, 1.2] }}
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '26px',
            zIndex: 50,
            background: 'var(--pnl)',
            color: 'var(--pnlt)',
            padding: '14px 22px',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: '14.5px',
            boxShadow: '0 20px 40px -16px var(--shadow)',
            border: '1px solid var(--bd)',
            whiteSpace: 'nowrap',
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
