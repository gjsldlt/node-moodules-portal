'use client'

import type { CSSProperties, KeyboardEvent } from 'react'
import { AVATAR_BADGES } from '@/lib/identity'

interface AvatarCircleProps {
  color: string
  emoji: string
  badge?: string
  size: number
  animate?: boolean
  onClick?: () => void
  role?: string
  tabIndex?: number
  ariaLabel?: string
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void
  style?: CSSProperties
}

export function AvatarCircle({
  color,
  emoji,
  badge = 'none',
  size,
  animate = false,
  onClick,
  role,
  tabIndex,
  ariaLabel,
  onKeyDown,
  style,
}: AvatarCircleProps) {
  const fontSize = Math.round(size * 0.5)
  const badgeInfo = AVATAR_BADGES.find((b) => b.id === badge) ?? AVATAR_BADGES[0]

  const circleStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize,
    flexShrink: 0,
    animation: animate ? 'tpBob 3s ease-in-out infinite' : undefined,
    transition: 'background 0.2s',
    cursor: onClick ? 'pointer' : undefined,
    ...style,
  }

  if (badgeInfo.variant === 'gradient') {
    return (
      <div
        style={{
          background: badgeInfo.gradient,
          borderRadius: '50%',
          padding: '3px',
          flexShrink: 0,
          display: 'inline-flex',
          cursor: onClick ? 'pointer' : undefined,
        }}
        onClick={onClick}
        role={role}
        tabIndex={tabIndex}
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
      >
        <div style={circleStyle}>{emoji}</div>
      </div>
    )
  }

  let badgeStyle: CSSProperties = {}
  if (badgeInfo.variant === 'solid') {
    const ringColor = badgeInfo.color === 'auto' ? color : badgeInfo.color
    badgeStyle = { outline: `3px solid ${ringColor}`, outlineOffset: '2px' }
  } else if (badgeInfo.variant === 'glow') {
    badgeStyle = {
      outline: `2px solid ${badgeInfo.color}`,
      outlineOffset: '2px',
      boxShadow: `0 0 14px ${badgeInfo.color}80`,
    }
  }

  return (
    <div
      style={{ ...circleStyle, ...badgeStyle }}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      {emoji}
    </div>
  )
}
