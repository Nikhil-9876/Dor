import type { ReactElement } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'pending' | 'sent' | 'failed' | 'bounced' | 'draft' | 'sending' | 'paused' | 'completed'

// SVG icons: small, crisp, purposeful
const ICONS: Record<BadgeVariant, ReactElement> = {
  pending: (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <circle cx="4" cy="4" r="3" fill="currentColor" opacity="0.4"/>
      <circle cx="4" cy="4" r="1.5" fill="currentColor"/>
    </svg>
  ),
  sent: (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  failed: (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M2 2L6 6M6 2L2 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  bounced: (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M4 1.5V4.5M4 6V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  draft: (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <rect x="1.5" y="2" width="5" height="1" rx="0.5" fill="currentColor" opacity="0.5"/>
      <rect x="1.5" y="4" width="3.5" height="1" rx="0.5" fill="currentColor" opacity="0.5"/>
      <rect x="1.5" y="6" width="2" height="1" rx="0.5" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
  sending: (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="animate-spin" style={{ animationDuration: '1.5s' }}>
      <circle cx="4" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="6 4"/>
    </svg>
  ),
  paused: (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <rect x="2" y="2" width="1.4" height="4" rx="0.5" fill="currentColor"/>
      <rect x="4.6" y="2" width="1.4" height="4" rx="0.5" fill="currentColor"/>
    </svg>
  ),
  completed: (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

const LABEL: Record<BadgeVariant, string> = {
  pending:   'Pending',
  sent:      'Sent',
  failed:    'Failed',
  bounced:   'Bounced',
  draft:     'Draft',
  sending:   'Sending',
  paused:    'Paused',
  completed: 'Completed',
}

const STYLES: Record<BadgeVariant, string> = {
  pending:   'badge-pending',
  sent:      'badge-sent',
  failed:    'badge-failed',
  bounced:   'badge-bounced',
  draft:     'badge-draft',
  sending:   'badge-sending',
  paused:    'badge-paused',
  completed: 'badge-completed',
}

export function Badge({ status, className }: { status: BadgeVariant; className?: string }) {
  return (
    <span className={cn(STYLES[status], className)}>
      {ICONS[status]}
      {LABEL[status]}
    </span>
  )
}
