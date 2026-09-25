import type { AccountAdmin, AccountListQuery } from '@/types/api'
import type { AccountAction, LinkAction } from './api'

/** Trạng thái hiển thị: khóa được ưu tiên vì tài khoản khóa vẫn giữ `approvalStatus` cũ. */
export type AccountDisplayStatus = 'waiting' | 'approved' | 'rejected' | 'locked'

export function displayStatusOf(account: AccountAdmin): AccountDisplayStatus {
  if (account.status === 'LOCKED') return 'locked'
  if (account.approvalStatus === 'REJECTED') return 'rejected'
  if (account.approvalStatus === 'APPROVED') return 'approved'
  return 'waiting'
}

/**
 * Các thao tác hợp lệ với một tài khoản, khớp `AdminAccountService`: chỉ duyệt/từ chối khi chờ duyệt,
 * duyệt lại khi bị từ chối, khóa/cấp/gỡ Admin khi đã duyệt, mở khóa khi đang khóa. Dòng của chính mình
 * không có từ chối, khóa, gỡ Admin (backend cũng chặn bằng `SELF_ACTION_FORBIDDEN`).
 */
export function actionsFor(account: AccountAdmin, selfId: number | undefined): AccountAction[] {
  const isSelf = account.id !== undefined && account.id === selfId
  switch (displayStatusOf(account)) {
    case 'waiting':
      return isSelf ? [] : ['approve', 'reject']
    case 'rejected':
      return ['approve']
    case 'locked':
      return ['unlock']
    case 'approved': {
      if (isSelf) return []
      return account.systemRole === 'ADMIN' ? ['revoke-admin', 'lock'] : ['grant-admin', 'lock']
    }
  }
}

/**
 * Thao tác liên kết "Tôi là ai" trên một dòng tài khoản (DECISIONS #80, #82): đã liên kết thì hủy được ở mọi
 * trạng thái (khóa hoặc từ chối không tự gỡ liên kết); chưa liên kết thì chỉ gán được cho tài khoản đã duyệt.
 * Dòng của chính mình không có nút: Admin tự liên kết qua trang "Tôi là ai".
 */
export function linkActionFor(account: AccountAdmin, selfId: number | undefined): LinkAction | null {
  if (account.id !== undefined && account.id === selfId) return null
  if (account.member) return 'unlink'
  return displayStatusOf(account) === 'approved' ? 'link' : null
}

/** Giá trị của ô lọc "Trạng thái" ở tab Tất cả. */
export type StatusFilter = 'WAITING' | 'APPROVED' | 'REJECTED' | 'LOCKED'

export const STATUS_FILTERS: readonly StatusFilter[] = ['WAITING', 'APPROVED', 'REJECTED', 'LOCKED']

export const isStatusFilter = (value: string | null): value is StatusFilter =>
  STATUS_FILTERS.includes(value as StatusFilter)

export const isRoleFilter = (value: string | null): value is 'ADMIN' | 'USER' =>
  value === 'ADMIN' || value === 'USER'

/** Đổi ô lọc sang tham số API: "Đã duyệt" chỉ tính tài khoản đang hoạt động, "Bị khóa" lọc theo `status`. */
export function statusFilterToQuery(filter: StatusFilter | undefined): AccountListQuery {
  switch (filter) {
    case 'WAITING':
    case 'REJECTED':
      return { approval: filter }
    case 'APPROVED':
      return { approval: 'APPROVED', status: 'ACTIVE' }
    case 'LOCKED':
      return { status: 'LOCKED' }
    default:
      return {}
  }
}
