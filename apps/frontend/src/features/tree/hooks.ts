import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TREE_KEY } from '@/hooks/useTree'
import type { TreeChildInput, TreeCoParentInput, TreeMoveInput, TreeOrderInput } from '@/types/api'
import { treeApi } from './api'

/** Số kết quả tối đa của hộp chọn; muốn thấy người khác thì gõ thêm để thu hẹp. */
export const OFF_TREE_SEARCH_SIZE = 20

/** Thành viên chưa có trên cây, tìm không dấu. */
export function useOffTreeSearch(q: string, enabled = true) {
  const keyword = q.trim()
  return useQuery({
    queryKey: ['members', 'search', 'off-tree', keyword],
    queryFn: () => treeApi.searchOffTree(keyword, OFF_TREE_SEARCH_SIZE),
    enabled,
    placeholderData: keepPreviousData,
  })
}

/**
 * Sau mỗi thao tác cây, cây và danh sách thành viên (đời, "có trên cây") đều cũ. Lỗi 409 cũng tải lại vì người
 * khác có thể vừa sửa cây.
 */
function useAfterTreeChange() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: TREE_KEY }),
      queryClient.invalidateQueries({ queryKey: ['members'] }),
    ])
}

export function useAddRoot() {
  const done = useAfterTreeChange()
  return useMutation({ mutationFn: (memberId: number) => treeApi.addRoot(memberId), onSettled: done })
}

export function useAddChild() {
  const done = useAfterTreeChange()
  return useMutation({
    mutationFn: ({ nodeId, input }: { nodeId: number; input: TreeChildInput }) =>
      treeApi.addChild(nodeId, input),
    onSettled: done,
  })
}

export function useAddSpouse() {
  const done = useAfterTreeChange()
  return useMutation({
    mutationFn: ({ nodeId, memberId }: { nodeId: number; memberId: number }) =>
      treeApi.addSpouse(nodeId, memberId),
    onSettled: done,
  })
}

export function useAddParent() {
  const done = useAfterTreeChange()
  return useMutation({
    mutationFn: ({ nodeId, memberId }: { nodeId: number; memberId: number }) =>
      treeApi.addParent(nodeId, memberId),
    onSettled: done,
  })
}

export function useFillSlot() {
  const done = useAfterTreeChange()
  return useMutation({
    mutationFn: ({ nodeId, memberId }: { nodeId: number; memberId: number }) =>
      treeApi.fillSlot(nodeId, memberId),
    onSettled: done,
  })
}

export function useRemoveMember() {
  const done = useAfterTreeChange()
  return useMutation({ mutationFn: (nodeId: number) => treeApi.removeMember(nodeId), onSettled: done })
}

export function useDeleteNode() {
  const done = useAfterTreeChange()
  return useMutation({ mutationFn: (nodeId: number) => treeApi.deleteNode(nodeId), onSettled: done })
}

export function useMoveNode() {
  const done = useAfterTreeChange()
  return useMutation({
    mutationFn: ({ nodeId, input }: { nodeId: number; input: TreeMoveInput }) =>
      treeApi.moveNode(nodeId, input),
    onSettled: done,
  })
}

export function useReorderNode() {
  const done = useAfterTreeChange()
  return useMutation({
    mutationFn: ({ nodeId, input }: { nodeId: number; input: TreeOrderInput }) =>
      treeApi.reorderNode(nodeId, input),
    onSettled: done,
  })
}

export function useSetCoParent() {
  const done = useAfterTreeChange()
  return useMutation({
    mutationFn: ({ nodeId, input }: { nodeId: number; input: TreeCoParentInput }) =>
      treeApi.setCoParent(nodeId, input),
    onSettled: done,
  })
}
