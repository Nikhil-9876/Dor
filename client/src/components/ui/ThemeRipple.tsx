import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/context/ThemeContext'

// Solid background colors matching CSS tokens
const BG: Record<'light' | 'dark', string> = {
  light: '#FAFAFA',
  dark:  '#0F0F12',
}

export function ThemeRipple() {
  const { ripple, clearRipple } = useTheme()
  const [coverFrom, setCoverFrom] = useState<'light' | 'dark' | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!ripple) return

    const root = document.getElementById('root')
    if (!root) return

    if (timerRef.current) clearTimeout(timerRef.current)

    const { x, y, from } = ripple
    const W = window.innerWidth
    const H = window.innerHeight
    const maxR = Math.ceil(
      Math.max(
        Math.hypot(x, y),
        Math.hypot(W - x, y),
        Math.hypot(x, H - y),
        Math.hypot(W - x, H - y),
      )
    ) + 20

    // Show old-theme cover BEFORE clipping root (prevents flash of white/black)
    setCoverFrom(from)

    // Step 1: instantly collapse root to 0px clip — hides new-theme content momentarily
    root.style.transition = 'none'
    root.style.clipPath = `circle(0px at ${x}px ${y}px)`

    // Step 2: one rAF later — animate clip-path expanding to reveal new-theme content
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.style.transition = `clip-path 1200ms cubic-bezier(0.22, 1, 0.36, 1)`
        root.style.clipPath = `circle(${maxR}px at ${x}px ${y}px)`
      })
    })

    // Step 3: after animation — remove clip-path restriction and cover
    timerRef.current = setTimeout(() => {
      root.style.transition = 'none'
      root.style.clipPath = ''
      setCoverFrom(null)
      clearRipple()
    }, 1260)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ripple])

  if (!coverFrom) return null

  // Portal: renders the old-theme cover OUTSIDE #root so it's not clipped
  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,          // behind #root (which starts at z-index 0)
        background: BG[coverFrom],
        pointerEvents: 'none',
      }}
    />,
    document.body
  )
}
