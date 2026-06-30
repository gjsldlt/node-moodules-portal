'use client'

import { createContext, useContext, useEffect, useState, startTransition, ReactNode } from 'react'
import { storageGet, storageSet, STORAGE_KEYS } from '@/lib/storage'

export type Theme = 'dark' | 'light' | 'cyberpunk' | 'lotr'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  cycleSecretTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  cycleSecretTheme: () => {},
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
      stored === 'light'     ? 'light'     :
      stored === 'cyberpunk' ? 'cyberpunk' :
      stored === 'lotr'      ? 'lotr'      :
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
    // Secret themes both exit to dark on left-click
    const next: Theme =
      theme === 'cyberpunk' || theme === 'lotr' ? 'dark' :
      theme === 'dark' ? 'light' :
      'dark'
    apply(next)
  }

  function cycleSecretTheme() {
    // Right-click cycles: dark/light → cyberpunk → lotr → dark
    if (theme === 'cyberpunk') {
      apply('lotr')
    } else if (theme === 'lotr') {
      apply('dark')
    } else {
      apply('cyberpunk')
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, cycleSecretTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
