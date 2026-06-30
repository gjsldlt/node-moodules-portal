'use client'

import { useReducedMotion } from 'framer-motion'
import type { CSSProperties } from 'react'

interface SkeletonBlockProps {
  width?: string | number
  height?: string | number
  radius?: string | number
  className?: string
  style?: CSSProperties
}

export function SkeletonBlock({
  width = '100%',
  height = 20,
  radius = 8,
  className,
  style,
}: SkeletonBlockProps) {
  const shouldReduce = useReducedMotion()

  return (
    <div
      className={`tp-skeleton${className ? ` ${className}` : ''}`}
      style={{
        width,
        height,
        borderRadius: radius,
        background: shouldReduce
          ? 'var(--trk)'
          : 'linear-gradient(90deg, var(--trk) 25%, color-mix(in srgb, var(--trk) 60%, var(--bd) 40%) 50%, var(--trk) 75%)',
        backgroundSize: '200% 100%',
        animation: shouldReduce ? undefined : 'skeletonShimmer 1.6s ease-in-out infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}
