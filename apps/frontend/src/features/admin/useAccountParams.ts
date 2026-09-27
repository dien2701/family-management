import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import type { AccountListQuery } from '@/types/api'
import {
  isRoleFilter,
  isStatusFilter,
  statusFilterToQuery,
  type StatusFilter,
} from './accountRules'

export type AccountTab = 'waiting' | 'all'

export const ACCOUNT_PAGE_SIZE = 20

type Role = 'ADMIN' | 'USER'
type Patch = Partial<{
  tab: AccountTab
  q: string
  status: StatusFilter | undefined
  role: Role | undefined
  page: number
}>

/**
 * Bộ lọc của trang Tài khoản nằm trên URL (`?tab=all&q=an&status=LOCKED&role=ADMIN&page=1`) để tải lại
 * hoặc gửi link vẫn giữ nguyên màn hình. Đổi bất kỳ bộ lọc nào ngoài `page` thì về trang đầu.
 */
export function useAccountParams() {
  const [params, setParams] = useSearchParams()

  const tab: AccountTab = params.get('tab') === 'all' ? 'all' : 'waiting'
  const q = params.get('q') ?? ''
  const statusParam = params.get('status')
  const roleParam = params.get('role')
  const status = isStatusFilter(statusParam) ? statusParam : undefined
  const role = isRoleFilter(roleParam) ? roleParam : undefined
  const page = Math.max(0, Number.parseInt(params.get('page') ?? '', 10) || 0)

  const update = useCallback(
    (patch: Patch) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          const set = (key: string, value: string | undefined, fallback = '') => {
            if (value === undefined || value === fallback) next.delete(key)
            else next.set(key, value)
          }
          if ('tab' in patch) {
            set('tab', patch.tab, 'waiting')
            // Trạng thái và vai trò chỉ có nghĩa ở tab Tất cả
            next.delete('status')
            next.delete('role')
          }
          if ('q' in patch) set('q', patch.q)
          if ('status' in patch) set('status', patch.status)
          if ('role' in patch) set('role', patch.role)
          if (!('page' in patch)) next.delete('page')
          else set('page', patch.page ? String(patch.page) : undefined)
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const query: AccountListQuery = {
    ...(tab === 'waiting' ? { approval: 'WAITING' as const } : { ...statusFilterToQuery(status), role }),
    q: q.trim() || undefined,
    page,
    size: ACCOUNT_PAGE_SIZE,
  }

  return { tab, q, status, role, page, query, update }
}
