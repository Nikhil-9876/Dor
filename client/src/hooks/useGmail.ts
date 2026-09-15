import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface GmailStatusData {
  connected: boolean
  email?: string
  connected_at?: string
}

export function useGmail() {
  const query = useQuery<GmailStatusData>({
    queryKey: ['gmail-status'],
    queryFn: async () => {
      const res = await api.get('/auth/gmail/status')
      return res.data
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  })

  const connect = async () => {
    const res = await api.get('/auth/gmail/url')
    window.location.href = res.data.url
  }

  const disconnect = async () => {
    await api.post('/auth/gmail/disconnect')
    query.refetch()
  }

  return { ...query, connect, disconnect }
}
