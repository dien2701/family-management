import { api } from '@/services/client'
import type {
  MemberPage,
  TreeChildInput,
  TreeCoParentInput,
  TreeMoveInput,
  TreeNode,
  TreeOrderInput,
} from '@/types/api'

export const treeApi = {
  addRoot: (memberId: number) => api.post<TreeNode>('/tree/roots', { memberId }),
  addChild: (nodeId: number, input: TreeChildInput) =>
    api.post<TreeNode>(`/tree/nodes/${nodeId}/children`, input),
  addSpouse: (nodeId: number, memberId: number) =>
    api.post<TreeNode>(`/tree/nodes/${nodeId}/spouses`, { memberId }),
  addParent: (nodeId: number, memberId: number) =>
    api.post<TreeNode>(`/tree/nodes/${nodeId}/parent`, { memberId }),
  fillSlot: (nodeId: number, memberId: number) =>
    api.put<TreeNode>(`/tree/nodes/${nodeId}/member`, { memberId }),
  removeMember: (nodeId: number) => api.delete<TreeNode>(`/tree/nodes/${nodeId}/member`),
  deleteNode: (nodeId: number) => api.delete<void>(`/tree/nodes/${nodeId}`),
  moveNode: (nodeId: number, input: TreeMoveInput) =>
    api.post<TreeNode>(`/tree/nodes/${nodeId}/move`, input),
  reorderNode: (nodeId: number, input: TreeOrderInput) =>
    api.put<TreeNode>(`/tree/nodes/${nodeId}/order`, input),
  setCoParent: (nodeId: number, input: TreeCoParentInput) =>
    api.put<TreeNode>(`/tree/nodes/${nodeId}/co-parent`, input),
  /** Thành viên chưa có trên cây, tìm không dấu (nguồn cho hộp chọn khi thêm vào cây). */
  searchOffTree: (q: string, size: number) =>
    api.get<MemberPage>('/members', {
      query: { q: q || undefined, onTree: false, sort: 'name', size },
    }),
}
