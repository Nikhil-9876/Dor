import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'No authorization code received from Google.',
  no_refresh_token: 'Could not get a refresh token. Try disconnecting and reconnecting.',
  server_error: 'A server error occurred. Check the backend logs.',
  access_denied: 'You denied access. Connect Gmail again to proceed.',
}

export function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const success = params.get('success')
    const error = params.get('error')
    const email = params.get('email')

    if (error) {
      setStatus('error')
      setErrorMsg(ERROR_MESSAGES[error] ?? `Error: ${error}`)
      return
    }

    if (success === 'true') {
      setStatus('success')
      // Invalidate Gmail status so the header pill updates immediately
      qc.invalidateQueries({ queryKey: ['gmail-status'] })
      toast.success(email ? `Connected: ${email}` : 'Gmail connected!')
      setTimeout(() => navigate('/settings'), 1500)
      return
    }

    // Neither success nor error — shouldn't happen, redirect home
    navigate('/')
  }, []) // eslint-disable-line

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
      <div className="card p-10 text-center max-w-sm w-full animate-fade-in">
        {status === 'loading' && (
          <>
            <Loader2 size={40} className="mx-auto mb-4 text-primary-500 animate-spin" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Connecting Gmail...</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={40} className="mx-auto mb-4 text-emerald-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gmail Connected!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Redirecting to settings...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={40} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Connection Failed</h2>
            <p className="text-sm text-red-500 mt-2">{errorMsg}</p>
            <button
              onClick={() => navigate('/settings')}
              className="mt-4 text-sm text-primary-500 hover:underline"
            >
              ← Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  )
}
