import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useGmail } from '@/hooks/useGmail'

export function GmailStatus({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useGmail()

  if (isLoading) return (
    <div
      className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{
        background: 'var(--surface-el)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border-strong)',
      }}
    >
      <Loader2 size={11} className="animate-spin" />
      {!compact && 'Checking…'}
    </div>
  )

  if (!data?.connected) return (
    <div
      className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{
        background: 'var(--danger-light)',
        color: 'var(--danger)',
        border: '1px solid rgb(199 59 59 / 0.2)',
      }}
    >
      <AlertCircle size={11} />
      {compact ? 'Gmail' : 'Gmail not connected'}
    </div>
  )

  return (
    <div
      className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{
        background: 'var(--success-light)',
        color: 'var(--success)',
        border: '1px solid rgb(13 158 126 / 0.2)',
      }}
    >
      <CheckCircle size={11} />
      {compact ? data.email?.split('@')[0] : data.email}
    </div>
  )
}
