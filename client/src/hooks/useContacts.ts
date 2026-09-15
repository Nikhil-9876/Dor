import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export interface Contact {
  id: string
  name: string
  email: string
  company?: string
  role?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ContactDetail extends Contact {
  history: Array<{
    id: string
    to_email: string
    subject: string
    status: string
    sent_at: string
    error_message?: string
    campaigns?: { name: string; status: string }
  }>
}

export function useContacts(params?: { search?: string; company?: string }) {
  const query = new URLSearchParams()
  if (params?.search)  query.set('search',  params.search)
  if (params?.company) query.set('company', params.company)
  const qs = query.toString() ? `?${query.toString()}` : ''

  return useQuery<Contact[]>({
    queryKey: ['contacts', params],
    queryFn: async () => (await api.get(`/contacts${qs}`)).data,
  })
}

export function useContact(id?: string) {
  return useQuery<ContactDetail>({
    queryKey: ['contacts', id],
    queryFn: async () => (await api.get(`/contacts/${id}`)).data,
    enabled: !!id,
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Contact> & { id: string }) =>
      api.put(`/contacts/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Contact updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Contact deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
