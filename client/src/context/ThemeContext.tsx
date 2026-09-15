import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'

type Theme = 'light' | 'dark'

export interface RippleOrigin {
  x: number
  y: number
}

interface ThemeContextValue {
  theme: Theme
  toggle: (origin?: RippleOrigin) => void
  ripple: (RippleOrigin & { from: Theme }) | null
  clearRipple: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
  ripple: null,
  clearRipple: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('refmail-theme') as Theme | null
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [ripple, setRipple] = useState<(RippleOrigin & { from: Theme }) | null>(null)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('refmail-theme', theme)
  }, [theme])

  const toggle = useCallback((origin?: RippleOrigin) => {
    const currentTheme = theme
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    // Apply new theme immediately so page content renders in new colours
    setTheme(next)
    if (origin) {
      // Signal the ripple with where to expand FROM and what the OLD theme was
      setRipple({ ...origin, from: currentTheme })
    }
  }, [theme])

  const clearRipple = useCallback(() => {
    setRipple(null)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggle, ripple, clearRipple }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
