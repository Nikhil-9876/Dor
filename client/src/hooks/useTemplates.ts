import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export interface Template {
  id: string
  name: string
  subject: string
  body_html: string
  body_plain?: string | null
  created_at: string
  updated_at: string
}

export function useTemplates() {
  return useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => (await api.get('/templates')).data,
  })
}

export function useTemplate(id?: string) {
  return useQuery<Template>({
    queryKey: ['templates', id],
    queryFn: async () => (await api.get(`/templates/${id}`)).data,
    enabled: !!id,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Template, 'id' | 'created_at' | 'updated_at'>) =>
      api.post('/templates', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template saved') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Template> & { id: string }) =>
      api.put(`/templates/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}
