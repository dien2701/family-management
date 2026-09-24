import { api } from '@/services/client'
import type { Schemas } from '@/types/api'

export const familyApi = {
  get: () => api.get<Schemas['FamilyResponse']>('/family'),
  create: (body: Schemas['CreateFamilyRequest']) =>
    api.post<Schemas['FamilyResponse']>('/family', body),
  join: (body: Schemas['JoinFamilyRequest']) =>
    api.post<Schemas['FamilyResponse']>('/family/join', body),
  listInvitations: () => api.get<Schemas['InvitationResponse'][]>('/family/invitations'),
  createInvitation: () => api.post<Schemas['InvitationResponse']>('/family/invitations'),
  revokeInvitation: (id: number) => api.delete<void>(`/family/invitations/${id}`),
  leave: () => api.post<void>('/family/leave'),
  removeAccount: (userId: number) => api.delete<void>(`/family/accounts/${userId}`),
  transferManager: (userId: number) =>
    api.post<void>('/family/transfer-manager', {
      userId,
    } satisfies Schemas['TransferManagerRequest']),
}
