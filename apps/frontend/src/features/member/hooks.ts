import { useQuery } from '@tanstack/react-query'
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

export function useMemberDetail(id: number) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: () => memberApi.getMemberDetail(id),
  })
}
