import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.2, 0.7, 0.3, 1] as const

export function SuggestGameCard({ index = 0 }: { index?: number }) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: shouldReduce ? 0 : 22, scale: shouldReduce ? 1 : 0.985 },
        visible: {
          opacity: 1, y: 0, scale: 1,
          transition: { duration: 0.6, ease: EASE, delay: index * 0.07 },
        },
      }}
      style={{
        background: 'transparent',
        borderRadius: '26px',
        border: '2px dashed var(--bd)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        minHeight: '140px',
        textAlign: 'center',
        cursor: 'default',
      }}
    >
      <span style={{ fontSize: '28px' }}>💡</span>
      <div>
        <p
          style={{
            margin: '0 0 4px',
            fontWeight: 700,
            fontSize: '15px',
            color: 'var(--txs)',
          }}
        >
          Got a game idea?
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--txm)' }}>
          Drop it in Teams and we&apos;ll build it.
        </p>
      </div>
    </motion.div>
  )
}
