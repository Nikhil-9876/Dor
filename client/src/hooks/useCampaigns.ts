import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export interface Recipient {
  id: string
  campaign_id: string
  name: string
  email: string
  company?: string
  role?: string
  custom_fields: Record<string, string>
  status: 'pending' | 'sent' | 'failed' | 'bounced'
  sent_at?: string
  error_message?: string
  created_at: string
}

export interface Campaign {
  id: string
  template_id: string
  name: string
  resume_file_path?: string
  delay_seconds: number
  daily_limit: number
  status: 'draft' | 'sending' | 'paused' | 'completed' | 'failed'
  total_recipients: number
  sent_count: number
  failed_count: number
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  templates?: { name: string; subject: string }
  recipients?: Recipient[]
}

export function useCampaigns() {
  return useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => (await api.get('/campaigns')).data,
  })
}

export function useCampaign(id?: string) {
  return useQuery<Campaign>({
    queryKey: ['campaigns', id],
    queryFn: async () => (await api.get(`/campaigns/${id}`)).data,
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'sending' ? 3000 : false
    },
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { template_id: string; name?: string; delay_seconds?: number; daily_limit?: number }) =>
      api.post('/campaigns', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/campaigns/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); toast.success('Campaign deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useSendCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/send`).then(r => r.data),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['campaigns', id] })
      toast.success('Send job started!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function usePauseCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/pause`),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['campaigns', id] })
      toast.success('Pause requested')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useRetryFailed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/retry-failed`).then(r => r.data),
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['campaigns', id] })
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success(`Retrying ${data.retried} failed email(s)`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAddRecipients() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: FormData | object[] }) => {
      if (data instanceof FormData) {
        return api.post(`/campaigns/${campaignId}/recipients`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data)
      }
      return api.post(`/campaigns/${campaignId}/recipients`, data).then(r => r.data)
    },
    onSuccess: (_d, { campaignId }) => {
      qc.invalidateQueries({ queryKey: ['campaigns', campaignId] })
      toast.success('Recipients added')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUploadResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ campaignId, file }: { campaignId: string; file: File }) => {
      const fd = new FormData()
      fd.append('resume', file)
      return api.post(`/campaigns/${campaignId}/upload-resume`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data)
    },
    onSuccess: (_d, { campaignId }) => {
      qc.invalidateQueries({ queryKey: ['campaigns', campaignId] })
      toast.success('Resume uploaded')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function usePreview(campaignId?: string) {
  return useMutation({
    mutationFn: (recipient_id: string) =>
      api.post(`/campaigns/${campaignId}/preview`, { recipient_id }).then(r => r.data),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useSentEmails(campaignId?: string) {
  return useQuery({
    queryKey: ['sent-emails', campaignId],
    queryFn: async () => {
      const params = campaignId ? `?campaign_id=${campaignId}` : ''
      return (await api.get(`/sent-emails${params}`)).data
    },
    staleTime: 5000,
  })
}

export function useCheckReplies(campaignId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.get(`/campaigns/${campaignId}/check-replies`).then(r => r.data),
    onSuccess: (data: { checked: number; newReplies: number }) => {
      qc.invalidateQueries({ queryKey: ['sent-emails', campaignId] })
      qc.invalidateQueries({ queryKey: ['campaigns', campaignId] })
      if (data.newReplies > 0) {
        toast.success(`🎉 ${data.newReplies} new repl${data.newReplies === 1 ? 'y' : 'ies'} detected!`)
      } else {
        toast(`Checked ${data.checked} emails — no new replies yet`, { icon: '📭' })
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

