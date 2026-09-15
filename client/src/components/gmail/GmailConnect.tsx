import { Mail, Unlink, ExternalLink } from 'lucide-react'
import { useGmail } from '@/hooks/useGmail'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

export function GmailConnect() {
  const { data, isLoading, connect, disconnect } = useGmail()

  const handleConnect = async () => {
    try {
      await connect()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      toast.success('Gmail disconnected')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <Card className="max-w-md">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${data?.connected
          ? 'bg-emerald-50 dark:bg-emerald-900/20'
          : 'bg-gray-100 dark:bg-dark-elevated'}`}>
          <Mail size={20} className={data?.connected
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-gray-500 dark:text-gray-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Gmail Account</h3>
          {data?.connected ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 truncate">{data.email}</p>
              {data.connected_at && (
                <p className="text-xs text-gray-400 mt-0.5">Connected {formatDate(data.connected_at)}</p>
              )}
              <Button
                variant="danger"
                size="sm"
                icon={<Unlink size={13} />}
                className="mt-3"
                onClick={handleDisconnect}
                loading={isLoading}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Connect your Gmail to send referral emails directly from your account.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<ExternalLink size={13} />}
                className="mt-3"
                onClick={handleConnect}
                loading={isLoading}
              >
                Connect Gmail
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
