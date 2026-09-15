import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  padding?: boolean
  accent?: boolean   // adds the coloured top-border line
  feature?: boolean  // heavier shadow for priority panels
}

export function Card({ children, className, onClick, hover = false, padding = true, accent = false, feature = false }: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={cn(
        'card',
        accent && 'card-accent',
        feature && 'card-feature',
        padding && 'p-5',
        (hover || onClick) && 'cursor-pointer hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        className
      )}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4 flex items-center justify-between', className)}>{children}</div>
}

// ── Stat Card — refined with gradient icon backgrounds and typographic weight ──

const ICON_GRADIENTS: Record<string, string> = {
  primary: 'from-primary-500 to-primary-600',
  success: 'from-[#0D9E7E] to-[#0BBFA0]',
  warning: 'from-[#C97D08] to-[#F5A623]',
  danger:  'from-[#C73B3B] to-[#D95656]',
}

// Background wash per color — softer than flat tinted squares
const BG_WASH: Record<string, string> = {
  primary: 'bg-gradient-to-br from-[#EAF0FF] to-[#D3E2FF] dark:from-[#3366E8]/15 dark:to-[#3366E8]/8',
  success: 'bg-gradient-to-br from-[#E4F7F3] to-[#CCEFE9] dark:from-[#0D9E7E]/15 dark:to-[#0D9E7E]/8',
  warning: 'bg-gradient-to-br from-[#FEF5E0] to-[#FDECC8] dark:from-[#C97D08]/15 dark:to-[#C97D08]/8',
  danger:  'bg-gradient-to-br from-[#FDEAEA] to-[#FADADA] dark:from-[#C73B3B]/15 dark:to-[#C73B3B]/8',
}

const ICON_COLOR: Record<string, string> = {
  primary: 'text-primary-500 dark:text-primary-400',
  success: 'text-[#0D9E7E] dark:text-[#12C99E]',
  warning: 'text-[#C97D08] dark:text-[#F5A623]',
  danger:  'text-[#C73B3B] dark:text-[#EF6060]',
}

const VALUE_COLOR: Record<string, string> = {
  primary: 'text-gray-900 dark:text-gray-50',
  success: 'text-[#0A7A61] dark:text-[#12C99E]',
  warning: 'text-[#8A5500] dark:text-[#F5A623]',
  danger:  'text-[#9E2C2C] dark:text-[#EF6060]',
}

export function StatCard({
  label,
  value,
  icon,
  color = 'primary',
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  return (
    <div className="card card-accent p-5 flex flex-col gap-4">
      {/* Icon with gradient wash */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
        BG_WASH[color]
      )}>
        <span className={cn('flex items-center justify-center [&>svg]:w-[18px] [&>svg]:h-[18px]', ICON_COLOR[color])}>
          {icon}
        </span>
      </div>

      {/* Value + label stacked */}
      <div>
        <p className={cn('stat-number', VALUE_COLOR[color])}>{value}</p>
        <p className="stat-label mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />
}
