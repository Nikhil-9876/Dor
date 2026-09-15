import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { GmailConnect } from '@/components/gmail/GmailConnect'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const [delay, setDelay] = useState('5')
  const [limit, setLimit] = useState('50')

  const saveDefaults = () => {
    localStorage.setItem('refmail-delay', delay)
    localStorage.setItem('refmail-limit', limit)
    toast.success('Defaults saved')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" subtitle="Configure your RefMail preferences" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto space-y-6">

          {/* Gmail Connection */}
          <section>
            <h2 className="section-title mb-3">Email Account</h2>
            <GmailConnect />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 leading-relaxed">
              RefMail uses the Gmail API to send emails directly from your Google account.
              Your OAuth tokens are stored in Supabase. Emails appear in your Gmail Sent folder.
            </p>
          </section>

          <div className="divider" />

          {/* Sending defaults */}
          <section>
            <h2 className="section-title mb-3">Default Send Settings</h2>
            <Card>
              <div className="space-y-4">
                <Input
                  label="Default delay between sends (seconds)"
                  type="number"
                  min="1"
                  max="60"
                  value={delay}
                  onChange={e => setDelay(e.target.value)}
                  hint="5–10 seconds is recommended to avoid spam detection"
                />
                <Input
                  label="Default daily send limit"
                  type="number"
                  min="1"
                  max="500"
                  value={limit}
                  onChange={e => setLimit(e.target.value)}
                  hint="Gmail personal accounts: ~500/day. Google Workspace: ~2,000/day"
                />
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Save size={13} />}
                  onClick={saveDefaults}
                >
                  Save Defaults
                </Button>
              </div>
            </Card>
          </section>

          <div className="divider" />

          {/* Google Cloud setup instructions */}
          <section>
            <h2 className="section-title mb-3">Google Cloud Setup</h2>
            <Card>
              <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-primary-500 hover:underline">console.cloud.google.com</a> and create a new project</li>
                <li>Enable the <strong>Gmail API</strong> for your project</li>
                <li>Go to <strong>APIs & Services → Credentials → Create OAuth 2.0 Client</strong></li>
                <li>Set application type to <strong>Web application</strong></li>
                <li>Add <code className="bg-gray-100 dark:bg-dark-elevated px-1 rounded text-xs">http://localhost:3001/api/auth/gmail/callback</code> as an authorized redirect URI</li>
                <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> to your <code className="bg-gray-100 dark:bg-dark-elevated px-1 rounded text-xs">.env</code> file</li>
              </ol>
            </Card>
          </section>

          <div className="divider" />

          {/* Supabase setup */}
          <section>
            <h2 className="section-title mb-3">Supabase Setup</h2>
            <Card>
              <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-primary-500 hover:underline">supabase.com</a></li>
                <li>Go to <strong>SQL Editor</strong> and run the migration from <code className="bg-gray-100 dark:bg-dark-elevated px-1 rounded text-xs">supabase/migrations/001_initial_schema.sql</code></li>
                <li>Go to <strong>Storage → Create bucket</strong> named <code className="bg-gray-100 dark:bg-dark-elevated px-1 rounded text-xs">resumes</code> (set to <strong>Private</strong>)</li>
                <li>Copy your <strong>Project URL</strong> and <strong>service_role key</strong> to your <code className="bg-gray-100 dark:bg-dark-elevated px-1 rounded text-xs">.env</code> file</li>
              </ol>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
