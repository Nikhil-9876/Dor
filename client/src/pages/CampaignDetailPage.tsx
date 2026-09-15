import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, UserPlus, Send, Pause, Upload, Eye, CheckCircle, XCircle, Clock, RefreshCw, RotateCcw, MessageCircle, Users } from 'lucide-react'
import Papa from 'papaparse'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import {
  useCampaign, useAddRecipients, useSendCampaign, usePauseCampaign, useRetryFailed, usePreview, useSentEmails, useCheckReplies, type Recipient
} from '@/hooks/useCampaigns'
import { useContacts } from '@/hooks/useContacts'
import { useGmail } from '@/hooks/useGmail'
import { formatDate, timeAgo, pluralize } from '@/lib/utils'
import toast from 'react-hot-toast'

interface RecipientRow { name: string; email: string; company?: string; role?: string }

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: campaign, isLoading, refetch } = useCampaign(id)
  const { data: sentEmails } = useSentEmails(id)
  const { data: gmail } = useGmail()
  const addRecipients = useAddRecipients()
  const sendCampaign = useSendCampaign()
  const pauseCampaign = usePauseCampaign()
  const retryFailed = useRetryFailed()
  const checkReplies = useCheckReplies(id)
  const previewMutation = usePreview(id)

  const [addOpen, setAddOpen] = useState(false)
  const [contactPickerOpen, setContactPickerOpen] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewRecipient, setPreviewRecipient] = useState<Recipient | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [newRecipients, setNewRecipients] = useState<RecipientRow[]>([])
  const [form, setForm] = useState<RecipientRow>({ name: '', email: '', company: '', role: '' })
  const csvRef = useRef<HTMLInputElement>(null)

  const handleCsv = (file: File) => {
    Papa.parse<RecipientRow>(file, {
      header: true, skipEmptyLines: true,
      complete: (r) => {
        const rows = r.data.map((row: any) => ({
          name: row.name ?? row.Name ?? '', email: row.email ?? row.Email ?? '',
          company: row.company ?? row.Company, role: row.role ?? row.Role,
        })).filter(r => r.name && r.email)
        setNewRecipients(p => [...p, ...rows])
        toast.success(`${rows.length} parsed`)
      },
    })
  }

  const handleAddSend = async () => {
    if (!id) return
    const all = [...newRecipients]
    if (form.name && form.email) all.push(form)
    if (all.length === 0) return toast.error('Add at least one recipient')
    await addRecipients.mutateAsync({ campaignId: id, data: all })
    setNewRecipients([])
    setForm({ name: '', email: '', company: '', role: '' })
    setAddOpen(false)
    refetch()
  }

  const handlePreview = async (recipient: Recipient) => {
    setPreviewRecipient(recipient)
    const data = await previewMutation.mutateAsync(recipient.id)
    setPreviewData(data)
    setPreviewOpen(true)
  }

  const pendingCount = campaign?.recipients?.filter(r => r.status === 'pending').length ?? 0
  const sentCount = campaign?.sent_count ?? 0
  const failedCount = campaign?.failed_count ?? 0
  const total = campaign?.total_recipients ?? 0
  const progress = total > 0 ? Math.round((sentCount / total) * 100) : 0

  // For the contacts picker: detect company from recipients
  const campaignCompany = campaign?.recipients?.find(r => r.company)?.company
  const { data: contacts = [] } = useContacts({ company: campaignCompany || undefined })
  const existingEmails = new Set((campaign?.recipients ?? []).map(r => r.email))
  const filteredContacts = contacts
    .filter(c => !existingEmails.has(c.email))
    .filter(c => !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.email.toLowerCase().includes(contactSearch.toLowerCase()) || (c.company ?? '').toLowerCase().includes(contactSearch.toLowerCase()))

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center text-gray-400">Loading campaign...</div>
  )
  if (!campaign) return (
    <div className="flex-1 flex items-center justify-center text-gray-400">Campaign not found</div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={campaign.name}
        subtitle={(campaign as any).templates?.name ?? 'Campaign'}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<UserPlus size={13} />} onClick={() => setAddOpen(true)}>
              + Add Recipients
            </Button>
            {failedCount > 0 && campaign.status !== 'sending' && (
              <Button
                variant="danger" size="sm" icon={<RotateCcw size={13} />}
                loading={retryFailed.isPending}
                onClick={() => id && retryFailed.mutate(id)}
              >
                Retry {failedCount} Failed
              </Button>
            )}
            <Button
              variant="secondary" size="sm" icon={<MessageCircle size={13} />}
              loading={checkReplies.isPending}
              onClick={() => id && checkReplies.mutate()}
              title="Check if any recipients replied to your emails"
            >
              Check Replies
            </Button>
            {campaign.status === 'sending' ? (
              <Button variant="danger" size="sm" icon={<Pause size={13} />}
                loading={pauseCampaign.isPending} onClick={() => id && pauseCampaign.mutate(id)}>
                Pause
              </Button>
            ) : (
              <Button
                variant="primary" size="sm" icon={<Send size={13} />}
                disabled={pendingCount === 0 || !gmail?.connected}
                loading={sendCampaign.isPending}
                onClick={() => id && sendCampaign.mutate(id)}
              >
                {pendingCount > 0 ? `Send to ${pendingCount} Pending` : 'No Pending'}
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {([
            { label: 'Total', value: total, color: 'primary' as const,
              icon: <Clock strokeWidth={1.8} size={17} /> },
            { label: 'Sent', value: sentCount, color: 'success' as const,
              icon: <CheckCircle strokeWidth={1.8} size={17} /> },
            { label: 'Failed', value: failedCount, color: 'danger' as const,
              icon: <XCircle strokeWidth={1.8} size={17} /> },
            { label: 'Pending', value: pendingCount, color: 'warning' as const,
              icon: <RefreshCw strokeWidth={1.8} size={17} /> },
          ] as const).map(({ label, value, icon, color }) => {
            const bg: Record<string, string> = {
              primary: 'var(--primary-light)',
              success: 'var(--success-light)',
              danger:  'var(--danger-light)',
              warning: 'var(--warning-light)',
            }
            const fg: Record<string, string> = {
              primary: 'var(--primary)',
              success: 'var(--success)',
              danger:  'var(--danger)',
              warning: 'var(--warning)',
            }
            return (
              <div key={label} className="card card-accent p-4 flex flex-col gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: bg[color], color: fg[color] }}>
                  {icon}
                </div>
                <div>
                  <p className="stat-number text-[2rem]" style={{ color: fg[color] }}>{value}</p>
                  <p className="stat-label mt-0.5">{label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress bar (shown when sending or > 0 sent) */}
        {(campaign.status === 'sending' || sentCount > 0) && (
          <Card feature>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge status={campaign.status as any} />
                <span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>{sentCount} of {total} sent</span>
              </div>
              <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-el)' }}>
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  campaign.status === 'sending' ? 'animate-pulse-slow' : ''
                }`}
                style={{
                  width: `${progress}%`,
                  background: campaign.status === 'sending'
                    ? 'linear-gradient(90deg, var(--primary) 0%, #6B9FFF 100%)'
                    : 'linear-gradient(90deg, var(--success) 0%, #0BBFA0 100%)',
                }}
              />
            </div>
          </Card>
        )}

        {/* Recipients table */}
        <Card padding={false} feature>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="section-title">Recipients</h2>
            <Badge status={campaign.status as any} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-el)', borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Email', 'Company', 'Role', 'Status', 'Sent At', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(campaign.recipients ?? []).map(r => (
                  <tr key={r.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-el)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td className="px-4 py-3 font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>{r.name}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{r.email}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: 'var(--text-muted)' }}>{r.company ?? '—'}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: 'var(--text-muted)' }}>{r.role ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge status={r.status} />
                      {r.error_message && (
                        <p className="text-[11px] mt-1 max-w-[200px] truncate" style={{ color: 'var(--danger)' }} title={r.error_message}>
                          {r.error_message}
                        </p>
                      )}
                      {/* Check if this recipient replied by matching their email in sentEmails */}
                      {(sentEmails?.data ?? []).find((se: any) => se.to_email === r.email && se.replied) && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                          <MessageCircle size={9} /> Replied
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {r.sent_at ? timeAgo(r.sent_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handlePreview(r as Recipient)}
                        className="text-[12px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
                        style={{ color: 'var(--primary)' }}
                      >
                        <Eye size={11} /> Preview
                      </button>
                    </td>
                  </tr>
                ))}
                {(campaign.recipients ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                      No recipients yet. Click "+ Add Recipients" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Sent emails audit log */}
        {sentEmails?.data?.length > 0 && (
          <Card padding={false}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="section-title">Send History</h2>
            </div>
            <div>
              {sentEmails.data.map((e: any) => (
                <div key={e.id} className="px-5 py-3 flex items-center gap-3.5 transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--surface-el)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = '')}>
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: e.status === 'sent' ? 'var(--success-light)' : 'var(--danger-light)' }}
                  >
                    {e.status === 'sent' ? (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M2.5 2.5L6.5 6.5M6.5 2.5L2.5 6.5" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>{e.to_name}</span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{e.to_email}</span>
                    </div>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{e.subject}</p>
                    {e.error_message && <p className="text-[11px] mt-0.5" style={{ color: 'var(--danger)' }}>{e.error_message}</p>}
                  </div>
                  <p className="text-[11px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{timeAgo(e.sent_at)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Add Recipients Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add More Recipients" size="lg">
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" icon={<Upload size={13} />} onClick={() => csvRef.current?.click()}>
              Upload CSV
            </Button>
            <input ref={csvRef} type="file" accept=".csv" hidden onChange={e => e.target.files?.[0] && handleCsv(e.target.files[0])} />
            {contacts.length > 0 && (
              <Button
                variant="secondary" size="sm" icon={<Users size={13} />}
                onClick={() => setContactPickerOpen(p => !p)}
              >
                From Contacts {campaignCompany ? `(${campaignCompany})` : ''}
              </Button>
            )}
            <span className="text-xs text-gray-400 self-center">or add manually below</span>
          </div>

          {/* Contact picker */}
          {contactPickerOpen && (
            <div className="border border-gray-200 dark:border-dark-border rounded-card overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 dark:bg-dark-elevated border-b border-gray-200 dark:border-dark-border">
                <input
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Search contacts…"
                  className="w-full text-sm bg-transparent outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
                />
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-border">
                {filteredContacts.length === 0 && (
                  <p className="px-4 py-3 text-xs text-gray-400">No contacts found{campaignCompany ? ` at ${campaignCompany}` : ''}</p>
                )}
                {filteredContacts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setNewRecipients(p => [
                        ...p.filter(r => r.email !== c.email),
                        { name: c.name, email: c.email, company: c.company, role: c.role }
                      ])
                      toast.success(`Added ${c.name}`)
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-white">
                        {c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                      <p className="text-xs text-gray-400 truncate">{c.email}{c.company ? ` · ${c.company}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input placeholder="Company" value={form.company ?? ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            <Input placeholder="Role" value={form.role ?? ''} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          </div>

          {newRecipients.length > 0 && (
            <p className="text-sm text-gray-500">{pluralize(newRecipients.length, 'recipient')} from CSV ready to add</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" icon={<UserPlus size={13} />}
              loading={addRecipients.isPending} onClick={handleAddSend}>
              Add Recipients
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title={`Preview — ${previewRecipient?.name}`} size="xl">
        {previewData && (
          <div className="space-y-3">
            <div className="p-3 rounded-btn bg-gray-50 dark:bg-dark-elevated">
              <span className="text-xs font-medium text-gray-500 mr-2">Subject:</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">{previewData.subject}</span>
            </div>
            <div
              className="text-sm leading-relaxed prose dark:prose-invert max-w-none p-4 border border-gray-100 dark:border-dark-border rounded-btn"
              dangerouslySetInnerHTML={{ __html: previewData.body_html }}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
