import React from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { GmailStatus } from '@/components/gmail/GmailStatus'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-7 py-4 flex-shrink-0"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 0 0 var(--border)',
      }}
    >
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && (
          <p className="text-[13px] mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2.5 ml-4 flex-shrink-0">
        {actions}
        <GmailStatus compact />
        <ThemeToggle />
      </div>
    </header>
  )
}
