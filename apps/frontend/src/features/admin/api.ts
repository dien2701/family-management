import { api } from '@/services/client'
import type { AccountAdmin, AccountAdminPage, AccountListQuery } from '@/types/api'

/** Các thao tác duyệt/quản lý tài khoản; tên khớp đường dẫn `/admin/accounts/{id}/<action>` trong openapi.yaml. */
export type AccountAction =
  | 'approve'
  | 'reject'
  | 'lock'
  | 'unlock'
  | 'grant-admin'
  | 'revoke-admin'

export const adminAccountsApi = {
  list: (query: AccountListQuery) => api.get<AccountAdminPage>('/admin/accounts', { query }),
  act: (id: number, action: AccountAction) =>
    api.post<AccountAdmin>(`/admin/accounts/${id}/${action}`),
}
