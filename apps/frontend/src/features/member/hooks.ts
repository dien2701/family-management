import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MemberInput, RelativeInput } from '@/types/api'
import { useSearchParams } from 'react-router'
import { memberApi, type MemberListQuery } from './api'

export function useMemberFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: MemberListQuery = {
    q: searchParams.get('q') || undefined,
    sort: (searchParams.get('sort') as MemberListQuery['sort']) || 'name',
    ageMin: searchParams.has('ageMin') ? Number(searchParams.get('ageMin')) : undefined,
    ageMax: searchParams.has('ageMax') ? Number(searchParams.get('ageMax')) : undefined,
    generation: searchParams.has('generation') ? Number(searchParams.get('generation')) : undefined,
    deceased: searchParams.has('deceased') ? searchParams.get('deceased') === 'true' : undefined,
    onTree: searchParams.has('onTree') ? searchParams.get('onTree') === 'true' : undefined,
    page: searchParams.has('page') ? Number(searchParams.get('page')) : 0,
    size: searchParams.has('size') ? Number(searchParams.get('size')) : 20,
  }

  const setFilters = (newFilters: Partial<MemberListQuery>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    // Trở về trang 0 nếu đổi bộ lọc khác
    if (!('page' in newFilters)) {
      params.delete('page')
    }
    setSearchParams(params)
  }

  return { filters, setFilters }
}

export function useMembers(query: MemberListQuery) {
  return useQuery({
    queryKey: ['members', query],
    queryFn: () => memberApi.getMembers(query),
  })
}

export function useMemberDetail(id: number, enabled = true) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: () => memberApi.getMemberDetail(id),
    enabled,
  })
}

/** Sau khi ghi dữ liệu thì mọi danh sách và hồ sơ đang cache đều cũ. */
function useInvalidateMembers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['members'] })
}

export function useCreateMember() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: (input: MemberInput) => memberApi.createMember(input),
    onSuccess: invalidate,
  })
}

export function useUpdateMember() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: MemberInput }) =>
      memberApi.updateMember(id, input),
    onSuccess: invalidate,
  })
}

export function useUploadAvatar() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: ({ memberId, file }: { memberId: number; file: File }) =>
      memberApi.uploadAvatar(memberId, file),
    onSuccess: invalidate,
  })
}

export function useDeleteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => memberApi.deleteMember(id),
    // Không refetch ngay: trang chi tiết đang mở sẽ gặp 404 trước khi kịp chuyển đi
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'], refetchType: 'none' }),
  })
}

const relativesKey = (memberId: number) => ['members', memberId, 'relatives'] as const

/** Danh sách người thân của một hồ sơ (mọi tài khoản đã duyệt đều xem được). */
export function useRelatives(memberId: number) {
  return useQuery({
    queryKey: relativesKey(memberId),
    queryFn: () => memberApi.getRelatives(memberId),
  })
}

export function useAddRelative(memberId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RelativeInput) => memberApi.addRelative(memberId, input),
    // Lỗi 409 (người này đã có trong danh sách từ nơi khác) cũng nên tải lại danh sách cho khớp
    onSettled: () => queryClient.invalidateQueries({ queryKey: relativesKey(memberId) }),
  })
}

export function useUpdateRelative(memberId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ relativeId, label }: { relativeId: number; label: string }) =>
      memberApi.updateRelative(memberId, relativeId, label),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: relativesKey(memberId) }),
  })
}

export function useDeleteRelative(memberId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (relativeId: number) => memberApi.deleteRelative(memberId, relativeId),
    // Lỗi 404 (dòng đã bị xóa ở nơi khác) cũng nên tải lại danh sách cho khớp
    onSettled: () => queryClient.invalidateQueries({ queryKey: relativesKey(memberId) }),
  })
}
