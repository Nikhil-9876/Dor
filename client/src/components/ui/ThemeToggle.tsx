import { useRef } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      toggle({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    } else {
      toggle()
    }
  }

  return (
    <button
      ref={btnRef}
      id="theme-toggle-btn"
      onClick={handleClick}
      className="relative p-2 rounded-btn text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-elevated transition-all duration-150 overflow-visible"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      <span
        className="theme-toggle-icon block"
        style={{ transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease' }}
      >
        {theme === 'dark'
          ? <Sun size={16} className="text-amber-400" />
          : <Moon size={16} className="text-indigo-500" />
        }
      </span>
    </button>
  )
}
