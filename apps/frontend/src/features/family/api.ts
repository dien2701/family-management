import { api } from '@/services/client'
import type {
  CreateFamilyRequest,
  FamilyResponse,
  InvitationResponse,
  JoinFamilyRequest,
  TransferManagerRequest,
} from './legacyTypes'

export const familyApi = {
  get: () => api.get<FamilyResponse>('/family'),
  create: (body: CreateFamilyRequest) => api.post<FamilyResponse>('/family', body),
  join: (body: JoinFamilyRequest) => api.post<FamilyResponse>('/family/join', body),
  listInvitations: () => api.get<InvitationResponse[]>('/family/invitations'),
  createInvitation: () => api.post<InvitationResponse>('/family/invitations'),
  revokeInvitation: (id: number) => api.delete<void>(`/family/invitations/${id}`),
  leave: () => api.post<void>('/family/leave'),
  removeAccount: (userId: number) => api.delete<void>(`/family/accounts/${userId}`),
  transferManager: (userId: number) =>
    api.post<void>('/family/transfer-manager', {
      userId,
    } satisfies TransferManagerRequest),
}
