import type { Schemas } from '@/types/api'
import { api } from '@/services/client'
import type {
  AccountAdmin,
  AccountAdminPage,
  AccountListQuery,
  LinkRequest,
  LinkRequestStatus,
} from '@/types/api'

/** Các thao tác duyệt/quản lý tài khoản; tên khớp đường dẫn `/admin/accounts/{id}/<action>` trong openapi.yaml. */
export type AccountAction =
  | 'approve'
  | 'reject'
  | 'lock'
  | 'unlock'
  | 'grant-admin'
  | 'revoke-admin'

/** Gán hoặc hủy liên kết "Tôi là ai" ngay trên dòng tài khoản (DECISIONS #80). */
export type LinkAction = 'link' | 'unlink'

export const adminAccountsApi = {
  list: (query: AccountListQuery) => api.get<AccountAdminPage>('/admin/accounts', { query }),
  act: (id: number, action: AccountAction) =>
    api.post<AccountAdmin>(`/admin/accounts/${id}/${action}`),
  linkMember: (id: number, memberId: number) =>
    api.put<AccountAdmin>(`/admin/accounts/${id}/member-link`, { memberId }),
  unlinkMember: (id: number) => api.delete<AccountAdmin>(`/admin/accounts/${id}/member-link`),
}

/** Hàng đợi yêu cầu liên kết của Admin. */
export const linkRequestsApi = {
  list: (status?: LinkRequestStatus) =>
    api.get<LinkRequest[]>('/link-requests', { query: { status } }),
  approve: (id: number) => api.post<LinkRequest>(`/link-requests/${id}/approve`),
  reject: (id: number) => api.post<LinkRequest>(`/link-requests/${id}/reject`),
}

export const adminSettingsApi = {
  get: () => api.get<Schemas['SystemSettings']>('/admin/settings'),
  update: (settings: Schemas['SystemSettings']) => api.put<Schemas['SystemSettings']>('/admin/settings', settings),
}

export const adminDeletedMembersApi = {
  list: (query: { page?: number; size?: number }) => api.get<Schemas['PageResponseDeletedMemberSnapshotSummary']>('/admin/deleted-members', { query }),
  get: (auditId: number) => api.get<Schemas['DeletedMemberSnapshot']>(`/admin/deleted-members/${auditId}`),
}
