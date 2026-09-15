import { Link, useNavigate } from 'react-router-dom'
import { Mail, Send, CheckCircle, AlertCircle, Zap, ArrowRight } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, StatCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FAB } from '@/components/ui/FAB'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useSentEmails } from '@/hooks/useCampaigns'
import { useGmail } from '@/hooks/useGmail'
import { formatDateShort, timeAgo } from '@/lib/utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: campaigns = [], isLoading } = useCampaigns()
  const { data: history } = useSentEmails()
  const { data: gmail } = useGmail()

  const totalSent    = campaigns.reduce((a, c) => a + c.sent_count, 0)
  const totalFailed  = campaigns.reduce((a, c) => a + c.failed_count, 0)
  const totalPending = campaigns.reduce((a, c) => a + (c.total_recipients - c.sent_count - c.failed_count), 0)
  const successRate  = totalSent + totalFailed > 0
    ? Math.round((totalSent / (totalSent + totalFailed)) * 100) : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Dashboard"
        subtitle="Your referral outreach overview"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Gmail warning banner */}
        {!gmail?.connected && (
          <div className="flex items-center gap-3 p-4 rounded-card bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 animate-fade-in">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Gmail not connected</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Connect your Gmail account before sending emails.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>
              Connect Gmail →
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Campaigns"   value={campaigns.length} icon={<Mail size={20} />}         color="primary" />
          <StatCard label="Emails Sent" value={totalSent}        icon={<Send size={20} />}          color="success" />
          <StatCard label="Pending"     value={totalPending}     icon={<AlertCircle size={20} />}   color="warning" />
          <StatCard label="Success Rate" value={`${successRate}%`} icon={<CheckCircle size={20} />} color="success" />
        </div>

        <div className="grid grid-cols-5 gap-6">
          {/* Campaign list */}
          <div className="col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Recent Campaigns</h2>
              <Link to="/campaigns" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
                View all <ArrowRight size={13} />
              </Link>
            </div>

            {isLoading && (
              <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>
            )}

            {!isLoading && campaigns.length === 0 && (
              <Card className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3">
                  <Zap size={24} className="text-primary-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-3 text-sm">No campaigns yet</p>
                <Button variant="primary" size="sm" onClick={() => navigate('/campaigns/new')}>
                  Create Your First Campaign
                </Button>
              </Card>
            )}

            {campaigns.slice(0, 6).map(c => {
              const pending = c.total_recipients - c.sent_count - c.failed_count
              const progress = c.total_recipients > 0 ? Math.round((c.sent_count / c.total_recipients) * 100) : 0
              return (
                <Card key={c.id} padding={false} hover onClick={() => navigate(`/campaigns/${c.id}`)}>
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: status dot + info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          c.status === 'sending'   ? 'bg-blue-500 animate-pulse' :
                          c.status === 'completed' ? 'bg-emerald-500' :
                          c.status === 'failed'    ? 'bg-red-500' :
                          c.status === 'paused'    ? 'bg-yellow-500' : 'bg-gray-300'
                        }`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-[14px]">{c.name}</p>
                            <Badge status={c.status as any} />
                          </div>
                          <p className="text-xs text-gray-400 truncate">{(c as any).templates?.name ?? 'No template'} · {formatDateShort(c.created_at)}</p>
                        </div>
                      </div>

                      {/* Right: stats */}
                      <div className="flex items-center gap-4 text-sm flex-shrink-0">
                        <div className="text-center">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-[15px]">{c.sent_count}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">sent</p>
                        </div>
                        {c.failed_count > 0 && (
                          <div className="text-center">
                            <p className="font-bold text-red-500 text-[15px]">{c.failed_count}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">failed</p>
                          </div>
                        )}
                        {pending > 0 && (
                          <div className="text-center">
                            <p className="font-bold text-yellow-600 dark:text-yellow-400 text-[15px]">{pending}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">pending</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {c.total_recipients > 0 && c.sent_count > 0 && (
                      <div className="mt-3">
                        <div className="h-1 bg-gray-100 dark:bg-dark-elevated rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${c.status === 'sending' ? 'bg-blue-400' : 'bg-emerald-400'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Recent Sends */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Recent Sends</h2>
            </div>
            <Card padding={false}>
              <div className="divide-y divide-gray-100 dark:divide-dark-border max-h-[420px] overflow-y-auto">
                {(history?.data ?? []).slice(0, 20).map((e: any) => (
                  <div key={e.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors">
                    {/* Status indicator */}
                    <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      e.status === 'sent' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${e.status === 'sent' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{e.to_name}</p>
                      <p className="text-xs text-gray-400 truncate">{e.to_email}</p>
                      {(e as any).campaigns?.name && (
                        <p className="text-[10px] text-primary-400 mt-0.5 truncate">{(e as any).campaigns.name}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(e.sent_at)}</p>
                  </div>
                ))}
                {(history?.data ?? []).length === 0 && (
                  <div className="px-4 py-12 text-center text-sm text-gray-400">No emails sent yet</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <FAB />
    </div>
  )
}
