'use client'

import { useState, useCallback } from 'react'
import { useReducedMotion } from 'framer-motion'
import { WheelCanvas } from './WheelCanvas'
import { ParticipantSidebar } from './ParticipantSidebar'
import { WinnerModal } from './WinnerModal'
import type { WheelUser } from './WheelCanvas'

export interface WheelOfNamesProps {
  participants: WheelUser[]
  /** Called with the selected winner after the spin animation completes. */
  onWinner?: (winner: WheelUser) => void
}

type SpinTarget = { winnerIdx: number; id: number }

export function WheelOfNames({ participants, onWinner }: WheelOfNamesProps) {
  const shouldReduce = useReducedMotion()

  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinTarget, setSpinTarget] = useState<SpinTarget | null>(null)
  const [winner, setWinner] = useState<WheelUser | null>(null)
  // Spin duration in seconds; 0 = instant
  const [spinSecs, setSpinSecs] = useState(3.5)

  function adjustDuration(delta: number) {
    setSpinSecs((prev) => {
      const next = Math.round((prev + delta) * 10) / 10
      return Math.max(0, Math.min(10, next))
    })
  }

  const activePool = participants.filter(
    (p) => !removed.has(p.nickname) && !excluded.has(p.nickname)
  )

  function handleSpin() {
    if (isSpinning || activePool.length === 0) return
    const winnerIdx = Math.floor(Math.random() * activePool.length)
    setIsSpinning(true)
    setSpinTarget((prev) => ({ winnerIdx, id: (prev?.id ?? 0) + 1 }))
  }

  const handleSpinComplete = useCallback(
    (winnerIdx: number) => {
      const w = activePool[winnerIdx]
      setWinner(w)
      setIsSpinning(false)
      onWinner?.(w)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePool, onWinner]
  )

  function handleExclude() {
    if (winner) {
      setExcluded((prev) => new Set([...prev, winner.nickname]))
      setWinner(null)
    }
  }

  function handleKeep() {
    setWinner(null)
  }

  function handleRemove(nickname: string) {
    setRemoved((prev) => new Set([...prev, nickname]))
  }

  function handleRestore(nickname: string) {
    setRemoved((prev) => { const n = new Set(prev); n.delete(nickname); return n })
    setExcluded((prev) => { const n = new Set(prev); n.delete(nickname); return n })
  }

  function handleResetAll() {
    setRemoved(new Set())
    setExcluded(new Set())
  }

  const canSpin = activePool.length >= 1 && !isSpinning

  return (
    <>
      {/* Responsive layout: column on mobile, row on md+ */}
      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* Canvas + spin button */}
        <div className="flex flex-col items-center gap-5" style={{ flex: '2 1 0' }}>
          <WheelCanvas
            participants={activePool}
            spinTarget={spinTarget}
            onSpinComplete={handleSpinComplete}
            spinDuration={spinSecs * 1000}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleSpin}
              disabled={!canSpin}
              aria-busy={isSpinning}
              aria-label={isSpinning ? 'Spinning the wheel' : 'Spin the wheel'}
              style={{
                padding: '14px 32px',
                borderRadius: '999px',
                border: 'none',
                background: canSpin ? 'var(--tx)' : 'var(--trk)',
                color: canSpin ? 'var(--bg)' : 'var(--txm)',
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '16px',
                cursor: canSpin ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'opacity 0.2s ease, transform 0.15s ease',
                boxShadow: canSpin ? '0 8px 24px -8px var(--shadow)' : 'none',
              }}
              onMouseEnter={e => { if (canSpin) e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              onMouseDown={e => { if (canSpin && !shouldReduce) e.currentTarget.style.transform = 'scale(0.96)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              <span
                style={{
                  display: 'inline-block',
                  animation: isSpinning && !shouldReduce ? 'tpSpin 0.6s cubic-bezier(.3,.9,.3,1) infinite' : 'none',
                }}
              >
                🎡
              </span>
              {isSpinning ? 'Spinning…' : 'Spin the wheel'}
            </button>

            {/* Spin duration stepper */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '2px',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--txm)', fontFamily: "'Hanken Grotesk', sans-serif" }}>
                Spin duration
              </span>
              <button
                onClick={() => adjustDuration(-0.5)}
                disabled={isSpinning || spinSecs <= 0}
                aria-label="Decrease spin duration"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1.5px solid var(--bd)',
                  background: 'var(--trk)',
                  color: 'var(--tx)',
                  fontSize: '16px',
                  lineHeight: 1,
                  cursor: isSpinning || spinSecs <= 0 ? 'not-allowed' : 'pointer',
                  opacity: isSpinning || spinSecs <= 0 ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.15s',
                }}
              >−</button>
              <span
                style={{
                  minWidth: '40px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--tx)',
                  fontFamily: "'Hanken Grotesk', sans-serif",
                }}
              >
                {spinSecs === 0 ? 'Instant' : `${spinSecs}s`}
              </span>
              <button
                onClick={() => adjustDuration(0.5)}
                disabled={isSpinning || spinSecs >= 10}
                aria-label="Increase spin duration"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1.5px solid var(--bd)',
                  background: 'var(--trk)',
                  color: 'var(--tx)',
                  fontSize: '16px',
                  lineHeight: 1,
                  cursor: isSpinning || spinSecs >= 10 ? 'not-allowed' : 'pointer',
                  opacity: isSpinning || spinSecs >= 10 ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.15s',
                }}
              >+</button>
            </div>

            {activePool.length === 0 && (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--txm)', textAlign: 'center' }}>
                No players left — reset the pool to spin again
              </p>
            )}
          </div>
        </div>

        {/* Participant sidebar */}
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <ParticipantSidebar
            participants={participants}
            removed={removed}
            excluded={excluded}
            onRemove={handleRemove}
            onRestore={handleRestore}
            onResetAll={handleResetAll}
            isSpinning={isSpinning}
          />
        </div>
      </div>

      <WinnerModal winner={winner} onExclude={handleExclude} onKeep={handleKeep} />
    </>
  )
}
