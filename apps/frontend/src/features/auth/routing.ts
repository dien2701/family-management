import type { Me } from '@/types/api'

/** Ba khu vực của app, mỗi user chỉ thuộc đúng một khu (IDEA §6.1). */
export type Area = 'admin' | 'onboarding' | 'family'

export function areaOf(user: Me): Area {
  if (user.systemRole === 'ADMIN') return 'admin'
  return user.familyId == null ? 'onboarding' : 'family'
}

const HOME: Record<Area, string> = { admin: '/quan-tri', onboarding: '/bat-dau', family: '/' }

/** Trang đích sau đăng nhập: Admin vào khu quản trị, chưa có family vào onboarding, còn lại vào Dashboard. */
export function homePathFor(user: Me): string {
  return HOME[areaOf(user)]
}

/**
 * Lấy `from` (trang định vào trước khi bị chuyển tới đăng nhập) từ state của trang hiện tại để mang theo
 * sang đăng nhập/đăng ký/xác thực OTP, nhờ vậy link mời `/moi/:code` không bị mất giữa chừng.
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
