import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api } from '@/services/client'
import type { TreeResponse } from '@/types/api'
import { buildTreeIndex, computeGenerations } from '@/utils/tree'

export const TREE_KEY = ['tree'] as const

/** Toàn bộ đồ thị cây (mọi tài khoản đã duyệt xem được). Trang Cây và hồ sơ thành viên dùng chung. */
export function useTree() {
  return useQuery({
    queryKey: TREE_KEY,
    queryFn: () => api.get<TreeResponse>('/tree'),
  })
}

/** Chỉ mục và đời của đồ thị cây, dựng lại khi dữ liệu đổi. */
export function useTreeModel(graph: TreeResponse | undefined) {
  return useMemo(() => {
    if (!graph) return null
    const index = buildTreeIndex(graph)
    return { graph, index, generations: computeGenerations(index) }
  }, [graph])
}
