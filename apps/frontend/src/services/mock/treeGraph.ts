// Cây gia phả trong kho giả lập: dựng response `GET /api/tree` và tính đời cho danh sách thành viên.
// Kho tạo trước Đợt 15 chưa có mảng vợ/chồng nên đọc qua hàm để tự khởi tạo.
import type { TreeMember, TreeNode, TreeResponse } from '@/types/api'
import { buildTreeIndex, computeGenerations } from '@/utils/tree'
import type { MockStore, StoredMember, StoredTreeNode, StoredTreeSpouse } from './store'

export const treeSpousesOf = (store: MockStore): StoredTreeSpouse[] => (store.tree.spouses ??= [])

function toTreeMember(m: StoredMember): TreeMember {
  return {
    fullName: m.fullName,
    gender: m.gender,
    avatarUrl: m.avatarUrl,
    labels: m.labels,
    birthYear: m.birth?.year ?? null,
    isDeceased: m.isDeceased,
    deathYear: m.deathSolar?.year ?? null,
  }
}

function toTreeNode(node: StoredTreeNode, members: Map<number, StoredMember>): TreeNode {
  const member = node.memberId === null ? undefined : members.get(node.memberId)
  return {
    id: node.id,
    memberId: member ? node.memberId : null,
    member: member ? toTreeMember(member) : null,
    parentNodeId: node.parentNodeId,
    coParentNodeId: node.coParentNodeId ?? null,
    sortOrder: node.sortOrder ?? 0,
  }
}

export function toTreeNodeDto(store: MockStore, node: StoredTreeNode): TreeNode {
  return toTreeNode(node, new Map(store.members.map((m) => [m.id, m])))
}

export function buildTreeResponse(store: MockStore): TreeResponse {
  const members = new Map(store.members.map((m) => [m.id, m]))
  return {
    nodes: store.tree.nodes.map((n) => toTreeNode(n, members)),
    spouses: treeSpousesOf(store).map((s) => ({ ...s })),
  }
}

/** Đời của từng thành viên có trên cây (gốc là đời 1); người chưa có trên cây không có trong map. */
export function generationsByMember(store: MockStore): Map<number, number> {
  const result = new Map<number, number>()
  if (store.tree.nodes.length === 0) return result
  const index = buildTreeIndex(buildTreeResponse(store))
  const generations = computeGenerations(index)
  for (const node of index.nodes.values()) {
    const generation = generations.get(node.id)
    if (node.memberId !== null && generation !== undefined) result.set(node.memberId, generation)
  }
  return result
}
