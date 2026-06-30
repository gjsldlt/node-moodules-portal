'use client'

import { createContext, useContext, useEffect, useState, startTransition, ReactNode } from 'react'
import { storageGet, storageSet, STORAGE_KEYS } from '@/lib/storage'

export type Theme = 'dark' | 'light' | 'cyberpunk'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  activateCyberpunk: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  activateCyberpunk: () => {},
})

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = storageGet<string>(STORAGE_KEYS.THEME)
    const resolved: Theme =
      stored === 'light' ? 'light' :
      stored === 'cyberpunk' ? 'cyberpunk' :
      'dark'
    document.documentElement.dataset.theme = resolved
    startTransition(() => setTheme(resolved))
  }, [])

  function apply(next: Theme) {
    document.documentElement.dataset.theme = next
    storageSet(STORAGE_KEYS.THEME, next)
    setTheme(next)
  }

  function toggleTheme() {
    const next: Theme =
      theme === 'cyberpunk' ? 'dark' :
      theme === 'dark'      ? 'light' :
      'dark'
    apply(next)
  }

  function activateCyberpunk() {
    apply(theme === 'cyberpunk' ? 'dark' : 'cyberpunk')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, activateCyberpunk }}>
      {children}
    </ThemeContext.Provider>
  )
}
