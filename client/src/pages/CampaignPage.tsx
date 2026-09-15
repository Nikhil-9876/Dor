import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, UserPlus, FileText, Send, ChevronRight, CheckCircle, AlertCircle, Plus, Users,
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link2
} from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Papa from 'papaparse'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useTemplates, useCreateTemplate } from '@/hooks/useTemplates'
import {
  useCreateCampaign, useAddRecipients, useUploadResume, useSendCampaign, usePreview
} from '@/hooks/useCampaigns'
import { useContacts } from '@/hooks/useContacts'
import { useGmail } from '@/hooks/useGmail'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const STEPS = ['Template', 'Resume', 'Recipients', 'Settings', 'Preview & Send']

interface RecipientRow { name: string; email: string; company?: string; role?: string }

export function CampaignPage() {
  const navigate = useNavigate()
  const { data: templates = [] } = useTemplates()
  const { data: gmailStatus } = useGmail()
  const createCampaign = useCreateCampaign()
  const addRecipients = useAddRecipients()
  const uploadResume = useUploadResume()
  const sendCampaign = useSendCampaign()

  const [step, setStep] = useState(0)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [campaignName, setCampaignName] = useState('New Referral Campaign')
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [recipients, setRecipients] = useState<RecipientRow[]>([])
  const [delay, setDelay] = useState(5)
  const [dailyLimit, setDailyLimit] = useState(50)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false)
  const [contactPickerOpen, setContactPickerOpen] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const createTemplateMutation = useCreateTemplate()

  const fileRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)

  const previewMutation = usePreview(campaignId ?? undefined)

  const handleCsvUpload = (file: File) => {
    Papa.parse<RecipientRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map((r: any) => ({
          name: r.name ?? r.Name ?? '',
          email: r.email ?? r.Email ?? '',
          company: r.company ?? r.Company,
          role: r.role ?? r.Role,
        })).filter(r => r.name && r.email)
        setRecipients(prev => [...prev, ...rows])
        toast.success(`${rows.length} recipients parsed from CSV`)
      },
    })
  }

  const goNext = async () => {
    // Step 0 → 1: create campaign
    if (step === 0) {
      if (!selectedTemplate) return toast.error('Select a template first')
      if (!campaignId) {
        const c = await createCampaign.mutateAsync({ template_id: selectedTemplate, name: campaignName })
        setCampaignId(c.id)
      }
    }
    // Step 1 → 2: upload resume
    if (step === 1 && resumeFile && campaignId) {
      await uploadResume.mutateAsync({ campaignId, file: resumeFile })
    }
    // Step 2 → 3: add recipients
    if (step === 2 && recipients.length > 0 && campaignId) {
      await addRecipients.mutateAsync({ campaignId, data: recipients })
    }
    // Step 4: preview
    if (step === 3 && campaignId) {
      // Fetch preview for first recipient
      const previewData = await previewMutation.mutateAsync('first').catch(() => null)
      if (previewData) {
        setPreviewHtml(previewData.body_html)
        setPreviewSubject(previewData.subject)
      }
    }
    setStep(s => s + 1)
  }

  const handleSend = async () => {
    if (!campaignId) return
    await sendCampaign.mutateAsync(campaignId)
    setShowConfirm(false)
    navigate(`/campaigns/${campaignId}`)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="New Campaign" subtitle="Set up and send your referral outreach" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Stepper */}
          <div className="flex items-center gap-1 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors',
                  i < step ? 'bg-primary-500 text-white' :
                  i === step ? 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/30' :
                  'bg-gray-200 dark:bg-dark-elevated text-gray-500 dark:text-gray-400'
                )}>
                  {i < step ? <CheckCircle size={12} /> : i + 1}
                </div>
                <span className={cn('text-xs truncate hidden sm:block',
                  i === step ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-400'
                )}>{s}</span>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border ml-1" />}
              </div>
            ))}
          </div>

          {/* Step 0: Template */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="section-title">Choose a Template</h2>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => setShowCreateTemplateModal(true)}
                >
                  Create Template
                </Button>
              </div>
              <Input
                label="Campaign Name"
                value={campaignName}
                onChange={e => { setCampaignName(e.target.value); setNameManuallyEdited(true) }}
                placeholder="e.g. Cargill Referral Batch"
              />
              <div className="space-y-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t.id)
                      // Auto-fill campaign name from template name only if user hasn't manually edited it
                      if (!nameManuallyEdited) {
                        setCampaignName(t.name)
                      }
                    }}
                    className={cn(
                      'w-full text-left p-4 rounded-card border-2 transition-all',
                      selectedTemplate === t.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-dark-surface'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{t.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.subject}</p>
                      </div>
                      {selectedTemplate === t.id && <CheckCircle size={18} className="text-primary-500 flex-shrink-0" />}
                    </div>
                  </button>
                ))}

                {/* Whole clickable + card to add a new template */}
                <button
                  type="button"
                  onClick={() => setShowCreateTemplateModal(true)}
                  className="w-full text-left p-4 rounded-card border-2 border-dashed border-gray-300 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 transition-all flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 bg-gray-50/50 dark:bg-dark-surface/50 group cursor-pointer mt-2"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={16} />
                  </div>
                  <span className="font-medium text-sm">+ Create New Template</span>
                </button>

                {templates.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm mb-3">No templates yet.</p>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={() => setShowCreateTemplateModal(true)}
                    >
                      Create First Template
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Resume */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="section-title">Upload Your Resume</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your resume will be attached to every email sent.</p>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-card p-10 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
              >
                <Upload size={32} className="mx-auto mb-3 text-gray-400" />
                {resumeFile ? (
                  <div>
                    <p className="font-medium text-primary-600 dark:text-primary-400">{resumeFile.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Click to upload PDF</p>
                    <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".pdf" hidden onChange={e => e.target.files?.[0] && setResumeFile(e.target.files[0])} />
            </div>
          )}

          {/* Step 2: Recipients */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="section-title">Add Recipients</h2>
                <span className="text-sm text-gray-500">{recipients.length} added</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" size="sm" icon={<Upload size={13} />} onClick={() => csvRef.current?.click()}>
                  Upload CSV
                </Button>
                <input ref={csvRef} type="file" accept=".csv" hidden onChange={e => e.target.files?.[0] && handleCsvUpload(e.target.files[0])} />
                <ContactsPickerButton
                  recipients={recipients}
                  onAdd={r => setRecipients(prev => [...prev, r])}
                  contactPickerOpen={contactPickerOpen}
                  setContactPickerOpen={setContactPickerOpen}
                  contactSearch={contactSearch}
                  setContactSearch={setContactSearch}
                />
              </div>
              <p className="text-xs text-gray-400">CSV columns: <code className="bg-gray-100 dark:bg-dark-elevated px-1 rounded">name, email, company, role</code></p>

              {/* Manual add */}
              <AddRecipientForm onAdd={(r) => setRecipients(prev => [...prev, r])} />

              {recipients.length > 0 && (
                <div className="border border-gray-200 dark:border-dark-border rounded-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-dark-elevated border-b border-gray-200 dark:border-dark-border">
                        {['Name', 'Email', 'Company', 'Role', ''].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map((r, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-elevated">
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{r.name}</td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{r.email}</td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{r.company ?? '—'}</td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{r.role ?? '—'}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => setRecipients(p => p.filter((_, j) => j !== i))}
                              className="text-xs text-red-400 hover:text-red-600">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Settings */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="section-title">Send Settings</h2>
              <Card>
                <div className="space-y-4">
                  <Input label="Delay Between Sends (seconds)" type="number" min="1" max="60" value={delay}
                    onChange={e => setDelay(Number(e.target.value))}
                    hint="Recommended: 5-10 seconds to avoid spam detection" />
                  <Input label="Daily Send Limit" type="number" min="1" max="500" value={dailyLimit}
                    onChange={e => setDailyLimit(Number(e.target.value))}
                    hint="Gmail personal limit: ~500/day. Google Workspace: ~2000/day" />
                </div>
              </Card>
              {!gmailStatus?.connected && (
                <div className="flex items-start gap-3 p-4 rounded-card bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Gmail is not connected. Go to <a href="/settings" className="underline font-medium">Settings</a> to connect your Gmail account before sending.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Preview & Send */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="section-title">Preview & Confirm</h2>
              <Card>
                <p className="text-xs text-gray-500 mb-1">Subject</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-4">{previewSubject || '(preview not available)'}</p>
                <p className="text-xs text-gray-500 mb-2">Body</p>
                <div
                  className="text-sm leading-relaxed prose dark:prose-invert max-w-none border border-gray-100 dark:border-dark-border rounded-btn p-4 bg-gray-50 dark:bg-dark-elevated"
                  dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-gray-400">No preview available. The rendered email will appear here.</p>' }}
                />
              </Card>
              <div className="flex items-center justify-between p-4 rounded-card bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                <div>
                  <p className="font-medium text-primary-800 dark:text-primary-200">{recipients.length} recipients</p>
                  <p className="text-sm text-primary-600 dark:text-primary-400">Each will get a personalized email</p>
                </div>
                <Button
                  variant="primary"
                  icon={<Send size={14} />}
                  onClick={() => setShowConfirm(true)}
                  disabled={!gmailStatus?.connected}
                >
                  Send Campaign
                </Button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="secondary" onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/campaigns')}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < 4 && (
              <Button
                variant="primary"
                icon={<ChevronRight size={14} />}
                loading={createCampaign.isPending || uploadResume.isPending || addRecipients.isPending}
                onClick={goNext}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm send modal */}
      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Send" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          You're about to send <strong>{recipients.length} individual emails</strong> from <strong>{gmailStatus?.email}</strong>.
          This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowConfirm(false)}>Cancel</Button>
          <Button variant="primary" size="sm" icon={<Send size={13} />} loading={sendCampaign.isPending} onClick={handleSend}>
            Send Now
          </Button>
        </div>
      </Modal>

      {/* Create Template modal */}
      {showCreateTemplateModal && (
        <CreateTemplateModal
          open={showCreateTemplateModal}
          onClose={() => setShowCreateTemplateModal(false)}
          onCreated={(newTemplateId) => {
            setSelectedTemplate(newTemplateId)
            setShowCreateTemplateModal(false)
          }}
        />
      )}
    </div>
  )
}

function AddRecipientForm({ onAdd }: { onAdd: (r: RecipientRow) => void }) {
  const [form, setForm] = useState<RecipientRow>({ name: '', email: '', company: '', role: '' })
  const submit = () => {
    if (!form.name || !form.email) return toast.error('Name and email are required')
    onAdd(form)
    setForm({ name: '', email: '', company: '', role: '' })
  }
  return (
    <div className="grid grid-cols-2 gap-3 p-4 rounded-card border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-elevated">
      <Input placeholder="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      <Input placeholder="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      <Input placeholder="Company" value={form.company ?? ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
      <Input placeholder="Role" value={form.role ?? ''} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
      <div className="col-span-2">
        <Button variant="secondary" size="sm" icon={<UserPlus size={13} />} onClick={submit} className="w-full justify-center">
          Add Recipient
        </Button>
      </div>
    </div>
  )
}

const PLACEHOLDERS = [
  { label: '{{first_name}}', desc: 'First name' },
  { label: '{{name}}', desc: 'Full name' },
  { label: '{{company}}', desc: 'Company' },
  { label: '{{role}}', desc: 'Role/position' },
  { label: '{{email}}', desc: 'Email address' },
]

function CreateTemplateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (templateId: string) => void
}) {
  const createMutation = useCreateTemplate()
  const [name, setName] = useState('New Template')
  const [subject, setSubject] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-primary-500 underline',
        },
      }),
    ],
    content: '<p>Hi {{first_name}},</p><p></p>',
  })

  const insertPlaceholder = (ph: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(ph).run()
  }

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Template name is required')
    if (!subject.trim()) return toast.error('Subject line is required')
    const bodyHtml = editor?.getHTML() ?? ''
    const newTemp = await createMutation.mutateAsync({
      name,
      subject,
      body_html: bodyHtml,
    })
    if (newTemp?.id) {
      onCreated(newTemp.id)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create New Template" size="lg">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <Input
          label="Template Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Software Referral Request"
        />
        <Input
          label="Subject Line *"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Referral Request — {{company}}"
        />

        <div>
          <label className="label">Email Body</label>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Insert placeholder
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => insertPlaceholder(p.label)}
                    title={p.desc}
                    className="px-2 py-1 text-xs rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors font-mono"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 dark:border-dark-border rounded-btn overflow-hidden tiptap-editor">
              <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-elevated">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`p-1.5 rounded text-sm transition-colors ${
                    editor?.isActive('bold')
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Bold"
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`p-1.5 rounded text-sm transition-colors ${
                    editor?.isActive('italic')
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Italic"
                >
                  <Italic size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className={`p-1.5 rounded text-sm transition-colors ${
                    editor?.isActive('underline')
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Underline"
                >
                  <UnderlineIcon size={14} />
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-dark-border mx-1" />
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`p-1.5 rounded text-sm transition-colors ${
                    editor?.isActive('bulletList')
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Bullet list"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={`p-1.5 rounded text-sm transition-colors ${
                    editor?.isActive('orderedList')
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Ordered list"
                >
                  <ListOrdered size={14} />
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-dark-border mx-1" />
                <button
                  type="button"
                  onClick={() => {
                    const previousUrl = editor?.getAttributes('link').href
                    const url = window.prompt('Enter URL:', previousUrl)
                    if (url === null) return
                    if (url === '') {
                      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
                      return
                    }
                    const validUrl =
                      url.startsWith('http://') ||
                      url.startsWith('https://') ||
                      url.startsWith('mailto:')
                        ? url
                        : `https://${url}`
                    editor
                      ?.chain()
                      .focus()
                      .extendMarkRange('link')
                      .setLink({ href: validUrl })
                      .run()
                  }}
                  className={`p-1.5 rounded text-sm transition-colors ${
                    editor?.isActive('link')
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Insert link"
                >
                  <Link2 size={14} />
                </button>
              </div>
              <EditorContent editor={editor} className="bg-white dark:bg-dark-surface" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-dark-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={createMutation.isPending}
            onClick={handleSave}
          >
            Create &amp; Select
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Contacts Picker Button ───────────────────────────────────────────────────
interface ContactsPickerButtonProps {
  recipients: { name: string; email: string; company?: string; role?: string }[]
  onAdd: (r: { name: string; email: string; company?: string; role?: string }) => void
  contactPickerOpen: boolean
  setContactPickerOpen: (v: (prev: boolean) => boolean) => void
  contactSearch: string
  setContactSearch: (v: string) => void
}

function ContactsPickerButton({
  recipients, onAdd, contactPickerOpen, setContactPickerOpen, contactSearch, setContactSearch
}: ContactsPickerButtonProps) {
  const { data: contacts = [] } = useContacts()
  const existingEmails = new Set(recipients.map(r => r.email))
  const filtered = contacts
    .filter(c => !existingEmails.has(c.email))
    .filter(c => !contactSearch ||
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (c.company ?? '').toLowerCase().includes(contactSearch.toLowerCase())
    )

  if (contacts.length === 0) return null

  return (
    <div className="relative">
      <Button
        variant="secondary" size="sm" icon={<Users size={13} />}
        onClick={() => setContactPickerOpen(p => !p)}
      >
        From Contacts ({filtered.length})
      </Button>
      {contactPickerOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 z-50 border border-gray-200 dark:border-dark-border rounded-card overflow-hidden shadow-xl bg-white dark:bg-dark-surface">
          <div className="px-3 py-2 bg-gray-50 dark:bg-dark-elevated border-b border-gray-200 dark:border-dark-border">
            <input
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
              placeholder="Search contacts…"
              autoFocus
              className="w-full text-sm bg-transparent outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
            />
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-border">
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-xs text-gray-400">No more contacts to add</p>
            )}
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  onAdd({ name: c.name, email: c.email, company: c.company, role: c.role })
                  toast.success(`Added ${c.name}`)
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-white">
                    {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 truncate">{c.email}{c.company ? ` · ${c.company}` : ''}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
