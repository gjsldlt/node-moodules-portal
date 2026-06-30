'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { UserRow } from '@/types'

export type WheelUser = Pick<UserRow, 'nickname' | 'avatar_color' | 'avatar_emoji'>

interface WheelCanvasProps {
  participants: WheelUser[]
  spinTarget: { winnerIdx: number; id: number } | null
  onSpinComplete: (winnerIdx: number) => void
}

const SEGMENT_COLORS = ['#86bc25', '#0097a9', '#62b5e5', '#da291c', '#ed8b00', '#ffcd00', '#009a44']
const SPIN_DURATION = 3500
const CANVAS_SIZE = 360

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function WheelCanvas({ participants, spinTarget, onSpinComplete }: WheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)
  const rafRef = useRef(0)
  // Refs that always hold the latest values without triggering effects
  const participantsRef = useRef<WheelUser[]>(participants)
  participantsRef.current = participants
  const onSpinCompleteRef = useRef(onSpinComplete)
  onSpinCompleteRef.current = onSpinComplete
  const shouldReduceRef = useRef<boolean | null>(null)
  const shouldReduce = useReducedMotion()
  shouldReduceRef.current = shouldReduce

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = CANVAS_SIZE
    const cx = size / 2
    const cy = size / 2
    const r = (size / 2) * 0.9
    const members = participantsRef.current
    const n = members.length
    const rot = rotationRef.current

    ctx.clearRect(0, 0, size, size)

    if (n === 0) {
      // Empty state placeholder
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.font = 'bold 13px Hanken Grotesk, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fillText('No players', cx, cy)
      return
    }

    const segAngle = (2 * Math.PI) / n

    for (let i = 0; i < n; i++) {
      const startAngle = rot - Math.PI / 2 + i * segAngle
      const endAngle = startAngle + segAngle
      const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length]

      // Segment fill
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()

      // Subtle border between segments
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Text in segment center
      const midAngle = startAngle + segAngle / 2
      const textRadius = r * 0.62
      const tx = cx + Math.cos(midAngle) * textRadius
      const ty = cy + Math.sin(midAngle) * textRadius

      ctx.save()
      ctx.translate(tx, ty)
      // Rotate so text reads outward from center
      ctx.rotate(midAngle + Math.PI / 2)

      const member = members[i]

      // Emoji (only when segments are large enough to fit)
      if (n <= 10) {
        const emojiFontSize = Math.max(11, Math.min(18, 200 / n))
        ctx.font = `${emojiFontSize}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.fillText(member.avatar_emoji, 0, n <= 5 ? -9 : -7)
      }

      // Nickname
      const maxChars = n <= 4 ? 10 : n <= 7 ? 8 : n <= 12 ? 6 : 4
      const label =
        member.nickname.length > maxChars
          ? member.nickname.slice(0, maxChars - 1) + '…'
          : member.nickname
      const nameFontSize = Math.max(7, Math.min(12, 180 / n))
      ctx.font = `bold ${nameFontSize}px Hanken Grotesk, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillText(label, 0, n <= 10 ? 7 : 0)

      ctx.restore()
    }

    // Center hub circle
    const hubR = r * 0.1
    ctx.beginPath()
    ctx.arc(cx, cy, hubR, 0, 2 * Math.PI)
    ctx.fillStyle = 'var(--bg, #0e0e12)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [])  // stable — reads from refs

  // Redraw whenever participants prop changes
  useEffect(() => {
    drawWheel()
  }, [participants, drawWheel])

  // Initial draw
  useEffect(() => {
    drawWheel()
  }, [drawWheel])

  // Spin animation — only re-runs when spinTarget changes
  useEffect(() => {
    if (!spinTarget) return

    cancelAnimationFrame(rafRef.current)

    const members = participantsRef.current
    const n = members.length
    if (n === 0) return

    const { winnerIdx } = spinTarget
    const segAngle = (2 * Math.PI) / n

    if (shouldReduceRef.current) {
      // Skip animation — jump directly to winner
      const targetNorm =
        ((-winnerIdx * segAngle - segAngle / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
      rotationRef.current = targetNorm
      drawWheel()
      onSpinCompleteRef.current(winnerIdx)
      return
    }

    const startRotation = rotationRef.current
    const targetNorm =
      ((-winnerIdx * segAngle - segAngle / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    const currentNorm = (startRotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    const delta = (targetNorm - currentNorm + 2 * Math.PI) % (2 * Math.PI)
    // 6 full spins + offset to land on winner
    const targetRotation = startRotation + 6 * 2 * Math.PI + delta
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / SPIN_DURATION, 1)
      rotationRef.current = startRotation + (targetRotation - startRotation) * easeOut(t)
      drawWheel()
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rotationRef.current = targetRotation
        drawWheel()
        onSpinCompleteRef.current(winnerIdx)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [spinTarget, drawWheel])

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '20px',
      }}
    >
      {/* Pointer / needle at 12 o'clock */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '0px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          width: 0,
          height: 0,
          borderLeft: '11px solid transparent',
          borderRight: '11px solid transparent',
          borderTop: '22px solid var(--tx)',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
        }}
      />
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        role="img"
        aria-label={`Spinning wheel with ${participants.length} participant${participants.length !== 1 ? 's' : ''}`}
        style={{
          borderRadius: '50%',
          display: 'block',
          maxWidth: '100%',
          boxShadow: '0 16px 48px -16px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  )
}
