'use client'

import { createContext, useContext, useEffect, useState, startTransition, ReactNode } from 'react'
import { storageGet, storageSet, STORAGE_KEYS } from '@/lib/storage'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
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
    // Sync with what the ThemeScript set on <html> before hydration.
    // startTransition defers the state update to avoid the cascading-render lint warning.
    const stored = storageGet<string>(STORAGE_KEYS.THEME)
    const resolved: Theme = stored === 'light' ? 'light' : 'dark'
    document.documentElement.dataset.theme = resolved
    startTransition(() => {
      setTheme(resolved)
    })
  }, [])

  function toggleTheme() {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      storageSet(STORAGE_KEYS.THEME, next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
