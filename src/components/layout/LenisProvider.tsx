'use client'

import { ReactNode } from 'react'
import { ReactLenis } from 'lenis/react'

interface LenisProviderProps {
  children: ReactNode
}

/**
 * Wraps the app with Lenis smooth scroll.
 * Uses the lenis/react integration which handles RAF automatically.
 */
export function LenisProvider({ children }: LenisProviderProps) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2 }}>
      {children}
    </ReactLenis>
  )
}
