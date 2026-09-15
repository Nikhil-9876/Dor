import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, Building2, Mail, Send, Trash2, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useContacts, useDeleteContact, useContact, type Contact } from '@/hooks/useContacts'
import { timeAgo, formatDateShort } from '@/lib/utils'

export function ContactsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: contacts = [], isLoading } = useContacts({
    search: search || undefined,
    company: companyFilter || undefined,
  })
  const deleteContact = useDeleteContact()

  // Get unique companies for filter chips
  const { data: allContacts = [] } = useContacts()
  const companies = [...new Set(allContacts.map(c => c.company).filter(Boolean) as string[])].sort()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Contacts"
        subtitle={`${allContacts.length} people in your network`}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Search + filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, company…"
              className="input pl-9 w-full"
            />
          </div>
          {companyFilter && (
            <button
              onClick={() => setCompanyFilter('')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-200 dark:border-primary-800"
            >
              <Building2 size={11} />
              {companyFilter}
              <span className="ml-1 text-primary-500">✕</span>
            </button>
          )}
        </div>

        {/* Company filter chips */}
        {companies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-gray-400 self-center mr-1">Filter by company:</span>
            {companies.map(co => (
              <button
                key={co}
                onClick={() => setCompanyFilter(companyFilter === co ? '' : co)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  companyFilter === co
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-elevated text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-border'
                }`}
              >
                {co}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="py-24 text-center text-sm text-gray-400">Loading contacts…</div>
        )}

        {/* Empty */}
        {!isLoading && contacts.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {search || companyFilter ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {search || companyFilter
                ? 'Try a different search or filter'
                : 'Contacts are automatically added when you add recipients to a campaign.'}
            </p>
          </div>
        )}

        {/* Contacts table */}
        {contacts.length > 0 && (
          <Card padding={false}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-elevated border-b border-gray-200 dark:border-dark-border">
                  {['Name', 'Email', 'Company', 'Role', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors cursor-pointer"
                    onClick={() => setSelectedContact(c)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {/* Initials avatar */}
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-white">
                            {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.email}</td>
                    <td className="px-4 py-3">
                      {c.company ? (
                        <button
                          onClick={e => { e.stopPropagation(); setCompanyFilter(c.company!) }}
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-dark-elevated text-gray-600 dark:text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-colors"
                        >
                          <Building2 size={10} />
                          {c.company}
                        </button>
                      ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{c.role ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Send size={11} />}
                          onClick={() => navigate('/campaigns/new')}
                        >
                          Send
                        </Button>
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                        <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Contact detail modal */}
      {selectedContact && (
        <ContactDetailModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Contact" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Remove this contact from your directory? Their send history will be preserved.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="danger" size="sm"
            loading={deleteContact.isPending}
            onClick={async () => { await deleteContact.mutateAsync(deleteId!); setDeleteId(null) }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function ContactDetailModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const { data, isLoading } = useContact(contact.id)

  return (
    <Modal open title={contact.name} onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* Contact info */}
        <div className="flex items-center gap-4 p-4 rounded-card bg-gray-50 dark:bg-dark-elevated">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-white">
              {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{contact.name}</p>
            <p className="text-sm text-gray-500">{contact.email}</p>
            {(contact.company || contact.role) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {[contact.role, contact.company].filter(Boolean).join(' @ ')}
              </p>
            )}
          </div>
        </div>

        {/* Campaign history */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Campaign History</h3>
          {isLoading && <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>}
          {!isLoading && (data?.history ?? []).length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">No emails sent to this contact yet.</p>
          )}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(data?.history ?? []).map((h: any) => (
              <div key={h.id} className="flex items-start gap-3 p-3 rounded-btn border border-gray-100 dark:border-dark-border">
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  h.status === 'sent' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {h.status === 'sent'
                    ? <CheckCircle size={12} className="text-emerald-500" />
                    : <XCircle size={12} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{h.subject}</p>
                  {h.campaigns?.name && (
                    <p className="text-xs text-primary-500">{h.campaigns.name}</p>
                  )}
                  {h.error_message && (
                    <p className="text-xs text-red-400">{h.error_message}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">{timeAgo(h.sent_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
