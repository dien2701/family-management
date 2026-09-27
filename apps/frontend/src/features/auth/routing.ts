import type { Me } from '@/types/api'

/** Nơi một tài khoản được phép ở, theo trạng thái duyệt (DECISIONS #56). */
export type ApprovalArea = 'waiting' | 'rejected' | 'app'

/** Chỉ `APPROVED` mới vào app; thiếu hoặc lạ thì coi là chờ duyệt để không mở cửa nhầm. */
export function approvalAreaOf(user: Me): ApprovalArea {
  if (user.approvalStatus === 'APPROVED') return 'app'
  if (user.approvalStatus === 'REJECTED') return 'rejected'
  return 'waiting'
}

const HOME: Record<ApprovalArea, string> = {
  waiting: '/cho-duyet',
  rejected: '/khong-duoc-duyet',
  app: '/',
}

/** Trang đích sau đăng nhập: chờ duyệt, không được duyệt, hoặc Tổng quan. */
export function homePathFor(user: Me): string {
  return HOME[approvalAreaOf(user)]
}

export const isAdmin = (user: Me | null): boolean => user?.systemRole === 'ADMIN'

/**
 * Lấy `from` (trang định vào trước khi bị chuyển tới đăng nhập) từ state của trang hiện tại để mang theo
 * sang đăng nhập/đăng ký/xác thực OTP, nhờ vậy link sâu không bị mất giữa chừng.
 */
export function carryFrom(state: unknown): { from: string } | undefined {
  const from = safeInternalPath((state as { from?: unknown } | null)?.from)
  return from ? { from } : undefined
}

/** Chỉ nhận đường dẫn nội bộ để không bị chuyển hướng ra trang ngoài (open redirect). */
export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}
