import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/services/client'
import type { MemberPage } from '@/types/api'

/** Số kết quả tối đa của hộp chọn thành viên; muốn thấy người khác thì gõ thêm để thu hẹp. */
export const MEMBER_SEARCH_SIZE = 20

/** Tìm thành viên theo tên (không cần gõ dấu) cho các hộp chọn thành viên. */
export function useMemberSearch(q: string, enabled = true) {
  const keyword = q.trim()
  return useQuery({
    queryKey: ['members', 'search', keyword],
    queryFn: () =>
      api.get<MemberPage>('/members', {
        query: { q: keyword || undefined, sort: 'name', size: MEMBER_SEARCH_SIZE },
      }),
    enabled,
    placeholderData: keepPreviousData,
  })
}
