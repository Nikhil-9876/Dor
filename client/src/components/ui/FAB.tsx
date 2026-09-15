import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FABProps {
  label?: string
  to?: string
  onClick?: () => void
  className?: string
}

export function FAB({ label = 'New Campaign', to = '/campaigns/new', onClick, className }: FABProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={onClick ?? (() => navigate(to))}
      className={cn(
        'fixed bottom-8 right-8 z-50',
        'flex items-center gap-2.5 px-5 py-3.5 rounded-full',
        'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700',
        'text-white text-sm font-semibold shadow-lg hover:shadow-xl',
        'transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0',
        'focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800',
        className
      )}
      title={label}
    >
      <Plus size={18} className="flex-shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
