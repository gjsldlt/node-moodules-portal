'use client'

import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Minimize2 } from 'lucide-react'
import { WheelOfNames } from '../WheelOfNames'
import type { WheelUser } from '../WheelCanvas'

interface WheelModalProps {
  participants: WheelUser[]
  minimized: boolean
  onMinimize: () => void
}

const EASE = [0.2, 0.7, 0.3, 1] as const

export function WheelModal({ participants, minimized, onMinimize }: WheelModalProps) {
  const shouldReduce = useReducedMotion()

  // Escape → minimize (not close, to preserve spin state)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !minimized) onMinimize()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [minimized, onMinimize])

  // Lock body scroll only when fully open
  useEffect(() => {
    document.body.style.overflow = minimized ? '' : 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [minimized])

  return (
    // Backdrop — fades out on minimize but stays in DOM so WheelOfNames state survives
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: minimized ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      onClick={onMinimize}
      role="dialog"
      aria-modal={!minimized}
      aria-label="Wheel of Names"
      aria-hidden={minimized}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(12px,3vw,32px)',
        backdropFilter: 'blur(8px)',
        // Hide from interaction while minimized — backdrop becomes invisible and non-interactive
        pointerEvents: minimized ? 'none' : 'auto',
      }}
    >
      {/* Panel — scales down slightly on minimize */}
      <motion.div
        initial={{ opacity: 0, scale: shouldReduce ? 1 : 0.88, y: shouldReduce ? 0 : 24 }}
        animate={{
          opacity: minimized ? 0 : 1,
          scale: minimized ? (shouldReduce ? 1 : 0.94) : 1,
          y: minimized ? (shouldReduce ? 0 : 24) : 0,
        }}
        transition={{ duration: 0.3, ease: EASE }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: '26px',
          border: '1px solid var(--bd)',
          maxWidth: '920px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7)',
          // Keep pointer events on when minimized so click-through works on the main page
          pointerEvents: minimized ? 'none' : 'auto',
        }}
      >
        {/* Toolbar */}
        <div style={{
          position: 'absolute', top: '14px', right: '14px', zIndex: 10,
        }}>
          <button
            onClick={onMinimize}
            aria-label="Minimize wheel"
            style={toolbarBtnStyle}
          >
            <Minimize2 size={13} />
            Minimize
          </button>
        </div>

        {/* WheelOfNames stays mounted even when minimized — state is preserved */}
        <WheelOfNames participants={participants} />
      </motion.div>
    </motion.div>
  )
}

const toolbarBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '5px',
  background: 'var(--trk)', border: '1px solid var(--bd)',
  borderRadius: '999px', padding: '6px 12px',
  fontSize: '13px', fontWeight: 600, color: 'var(--txs)', cursor: 'pointer',
}
