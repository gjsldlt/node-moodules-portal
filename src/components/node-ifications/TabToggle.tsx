'use client'

import { motion, useReducedMotion } from 'framer-motion'

export type Tab = 'all' | 'announcements' | 'reminders'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: '🗂️ All' },
  { id: 'announcements', label: '📣 Announcements' },
  { id: 'reminders', label: '✅ Reminders' },
]

export function TabToggle({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab
  onTabChange: (t: Tab) => void
}) {
  const shouldReduce = useReducedMotion()

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        background: 'var(--trk)',
        borderRadius: '999px',
        padding: '4px',
        width: 'fit-content',
        marginBottom: '24px',
      }}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-pressed={active}
            style={{
              position: 'relative',
              padding: '8px 18px',
              borderRadius: '999px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              color: active ? 'var(--bg)' : 'var(--txs)',
              zIndex: 1,
              transition: 'color 0.15s',
            }}
          >
            {active && !shouldReduce && (
              <motion.span
                layoutId="tp-tab-pill"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '999px',
                  background: 'var(--tx)',
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            {active && shouldReduce && (
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '999px',
                  background: 'var(--tx)',
                  zIndex: -1,
                }}
              />
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
