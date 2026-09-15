import { Link, useNavigate } from 'react-router-dom'
import { Plus, Mail, ChevronRight, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { FAB } from '@/components/ui/FAB'
import { useCampaigns, useDeleteCampaign } from '@/hooks/useCampaigns'
import { formatDateShort } from '@/lib/utils'
import { useState } from 'react'

export function CampaignsListPage() {
  const navigate = useNavigate()
  const { data: campaigns = [], isLoading } = useCampaigns()
  const deleteCampaign = useDeleteCampaign()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Campaigns"
        subtitle="All your referral email campaigns"
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/campaigns/new')}>
            New Campaign
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Loading...</div>
        )}

        {!isLoading && campaigns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
              <Mail size={28} className="text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">No campaigns yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first campaign to start sending referral emails.</p>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/campaigns/new')}>
              Create Campaign
            </Button>
          </div>
        )}

        {campaigns.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-3">
            {campaigns.map(c => {
              const pending = c.total_recipients - c.sent_count - c.failed_count
              return (
                <Card key={c.id} padding={false} hover onClick={() => navigate(`/campaigns/${c.id}`)}>
                  <div className="px-5 py-4 flex items-center gap-4">
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      c.status === 'sending' ? 'bg-blue-500 animate-pulse' :
                      c.status === 'completed' ? 'bg-emerald-500' :
                      c.status === 'failed' ? 'bg-red-500' :
                      c.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-300'
                    }`} />

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                        <Badge status={c.status as any} />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {(c as any).templates?.name ?? 'Unknown template'} · {formatDateShort(c.created_at)}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm flex-shrink-0">
                      <div className="text-center">
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">{c.sent_count}</p>
                        <p className="text-xs text-gray-400">sent</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-semibold ${c.failed_count > 0 ? 'text-red-500' : 'text-gray-400 dark:text-gray-600'}`}>{c.failed_count}</p>
                        <p className="text-xs text-gray-400">failed</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-semibold ${pending > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`}>{pending}</p>
                        <p className="text-xs text-gray-400">pending</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="p-2 rounded-btn text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete campaign"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                    </div>
                  </div>

                  {/* Progress bar for active campaigns */}
                  {(c.status === 'sending' || c.sent_count > 0) && c.total_recipients > 0 && (
                    <div className="mx-5 mb-4">
                      <div className="h-1 bg-gray-100 dark:bg-dark-elevated rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${c.status === 'sending' ? 'bg-blue-400' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.round((c.sent_count / c.total_recipients) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Campaign" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Are you sure? This will permanently delete the campaign and all its recipients and history.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="danger" size="sm"
            loading={deleteCampaign.isPending}
            onClick={async () => { await deleteCampaign.mutateAsync(deleteId!); setDeleteId(null) }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <FAB />
    </div>
  )
}
