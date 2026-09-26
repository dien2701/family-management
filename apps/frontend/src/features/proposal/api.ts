import { api } from '@/services/client'
import type { Proposal, ProposalInput, ProposalPage } from '@/types/api'

export const proposalApi = {
  create: (data: ProposalInput) => api.post<Proposal>('/proposals', data),
  getMine: (page: number, size: number) =>
    api.get<ProposalPage>('/proposals/mine', { query: { page, size } }),
  getAll: (page: number, size: number, status?: string) =>
    api.get<ProposalPage>('/proposals', { query: { page, size, status: status || undefined } }),
  getCount: () => api.get<number>('/proposals/count'),
  approve: (id: number, modifiedPayload?: Record<string, unknown>) =>
    api.post<Proposal>(`/proposals/${id}/approve`, { modifiedPayload }),
  reject: (id: number, note: string) => api.post<Proposal>(`/proposals/${id}/reject`, { note }),
}
