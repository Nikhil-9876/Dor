import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link2, Save, Trash2, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, type Template
} from '@/hooks/useTemplates'
import { Card } from '@/components/ui/Card'
import { formatDateShort } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Header } from '@/components/layout/Header'

const PLACEHOLDERS = [
  { label: '{{first_name}}', desc: 'First name' },
  { label: '{{name}}', desc: 'Full name' },
  { label: '{{company}}', desc: 'Company' },
  { label: '{{role}}', desc: 'Role/position' },
  { label: '{{email}}', desc: 'Email address' },
]

function ToolbarBtn({ onClick, active, children, title }: {
  onClick: () => void; active?: boolean; children: React.ReactNode; title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${active
        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-elevated hover:text-gray-700 dark:hover:text-gray-200'}`}
    >
      {children}
    </button>
  )
}

interface EditorPanelProps {
  template: Partial<Template>
  onChange: (t: Partial<Template>) => void
}

function EditorPanel({ template, onChange }: EditorPanelProps) {
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
    content: template.body_html || '<p>Hi {{first_name}},</p><p></p>',
    onUpdate: ({ editor }) => onChange({ ...template, body_html: editor.getHTML() }),
  })

  const insertPlaceholder = (ph: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(ph).run()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Placeholder buttons */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Insert placeholder</p>
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map(p => (
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

      {/* Rich text editor */}
      <div className="border border-gray-200 dark:border-dark-border rounded-btn overflow-hidden tiptap-editor">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-elevated">
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold">
            <Bold size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic">
            <Italic size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Underline">
            <UnderlineIcon size={14} />
          </ToolbarBtn>
          <div className="w-px h-4 bg-gray-200 dark:bg-dark-border mx-1" />
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet list">
            <List size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Ordered list">
            <ListOrdered size={14} />
          </ToolbarBtn>
          <div className="w-px h-4 bg-gray-200 dark:bg-dark-border mx-1" />
          <ToolbarBtn
            onClick={() => {
              const previousUrl = editor?.getAttributes('link').href
              const url = window.prompt('Enter URL:', previousUrl)
              if (url === null) return
              if (url === '') {
                editor?.chain().focus().extendMarkRange('link').unsetLink().run()
                return
              }
              const validUrl = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')
                ? url
                : `https://${url}`
              editor?.chain().focus().extendMarkRange('link').setLink({ href: validUrl }).run()
            }}
            active={editor?.isActive('link')}
            title="Insert link"
          >
            <Link2 size={14} />
          </ToolbarBtn>
        </div>
        <EditorContent editor={editor} className="bg-white dark:bg-dark-surface" />
      </div>
    </div>
  )
}

export function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates()
  const createMutation = useCreateTemplate()
  const updateMutation = useUpdateTemplate()
  const deleteMutation = useDeleteTemplate()

  const [selected, setSelected] = useState<Partial<Template> | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)

  const isNew = selected && !selected.id
  const isDirty = selected !== null

  const startNew = () => setSelected({ name: 'New Template', subject: '', body_html: '' })
  const startEdit = (t: Template) => setSelected({ ...t })

  const handleSave = async () => {
    if (!selected) return
    if (isNew) {
      await createMutation.mutateAsync({
        name: selected.name ?? 'Untitled',
        subject: selected.subject ?? '',
        body_html: selected.body_html ?? '',
        body_plain: selected.body_plain,
      })
    } else {
      await updateMutation.mutateAsync({ id: selected.id!, ...selected })
    }
    setSelected(null)
  }

  const handleDelete = async () => {
    if (deleteId) { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Templates"
        subtitle="Create and manage your email templates"
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={startNew}>
            New Template
          </Button>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Template list */}
        <div className="w-64 border-r border-gray-200 dark:border-dark-border flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {isLoading && (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Loading...</div>
            )}
            {!isLoading && templates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">No templates yet</p>
                <button onClick={startNew} className="text-sm text-primary-500 mt-2 hover:underline">
                  Create your first one →
                </button>
              </div>
            )}
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => startEdit(t)}
                className={`w-full text-left px-3 py-2.5 rounded-btn transition-colors ${selected?.id === t.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-dark-elevated text-gray-700 dark:text-gray-300'}`}
              >
                <p className="text-sm font-medium truncate">{t.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{t.subject}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDateShort(t.updated_at)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
                <Plus size={28} className="text-primary-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">Select a template to edit</p>
              <Button variant="primary" size="sm" onClick={startNew}>Create Template</Button>
            </div>
          )}

          {selected && (
            <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="section-title">{isNew ? 'New Template' : 'Edit Template'}</h2>
                <div className="flex items-center gap-2">
                  {!isNew && (
                    <Button variant="danger" size="sm" icon={<Trash2 size={13} />}
                      onClick={() => setDeleteId(selected.id!)}>
                      Delete
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => setPreview(!preview)}>
                    {preview ? 'Edit' : 'Preview'}
                  </Button>
                  <Button
                    variant="primary" size="sm" icon={<Save size={13} />}
                    loading={createMutation.isPending || updateMutation.isPending}
                    disabled={!isDirty}
                    onClick={handleSave}
                  >
                    {isNew ? 'Create' : 'Save'}
                  </Button>
                </div>
              </div>

              <Input label="Template Name" value={selected.name ?? ''} onChange={e => setSelected(s => ({ ...s!, name: e.target.value }))} placeholder="e.g. Software Engineering Referral" />
              <Input label="Subject Line" value={selected.subject ?? ''} onChange={e => setSelected(s => ({ ...s!, subject: e.target.value }))} placeholder="Referral Request — {{company}}" />

              {preview ? (
                <div>
                  <label className="label">Preview</label>
                  <div
                    className="border border-gray-200 dark:border-dark-border rounded-btn p-5 bg-white dark:bg-dark-surface text-sm leading-relaxed prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selected.body_html ?? '' }}
                  />
                </div>
              ) : (
                <div>
                  <label className="label">Email Body</label>
                  <EditorPanel key={selected.id ?? 'new-template'} template={selected} onChange={setSelected} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Template" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Are you sure you want to delete this template? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteMutation.isPending} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
