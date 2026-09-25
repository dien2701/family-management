import { fetchApi } from '@/utils/api'
import type { Schemas } from '@/types/api'

export const proposalApi = {
  create: (data: Schemas['ProposalInput']) =>
    fetchApi('/api/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMine: (page: number, size: number) =>
    fetchApi(`/api/proposals/mine?page=${page}&size=${size}`),
  getAll: (page: number, size: number, status?: string) =>
    fetchApi(`/api/proposals?page=${page}&size=${size}${status ? `&status=${status}` : ''}`),
  getCount: () => fetchApi('/api/proposals/count'),
  approve: (id: number, modifiedPayload?: Record<string, any>) =>
    fetchApi(`/api/proposals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ modifiedPayload }),
    }),
  reject: (id: number, note: string) =>
    fetchApi(`/api/proposals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),
}
