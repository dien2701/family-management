// Xóa một ô mà vẫn giữ nhánh (DECISIONS #85): hàm thuần dùng chung cho giao diện và kiểm tra khớp backend.
import { buildTreeIndex, getSiblings } from './graph'
import type { TreeGraph, TreeNode } from './types'

/**
 * Đồ thị sau khi xóa ô `nodeId` (đã kiểm `checkDeleteSlot`):
 * - ô vợ/chồng: bỏ ô, con của cặp đó thành con của một mình người thuộc dòng, đánh lại thứ tự vợ/chồng;
 * - ô thuộc dòng có vợ/chồng: người vợ/chồng thứ nhất thế vào đúng chỗ (cha/mẹ, cặp, thứ tự), giữ các vợ/chồng còn lại và con cháu;
 * - ô thuộc dòng không có vợ/chồng: con cháu lên thế chỗ, làm con của cha/mẹ của ô bị xóa (hoặc thành gốc), dịch lên một đời.
 */
export function deleteSlot(graph: TreeGraph, nodeId: number): TreeGraph {
  const index = buildTreeIndex(graph)
  const node = index.nodes.get(nodeId)
  if (!node) return graph

  const patch = new Map<number, Partial<Pick<TreeNode, 'parentNodeId' | 'coParentNodeId' | 'sortOrder'>>>()
  const set = (id: number, change: Partial<Pick<TreeNode, 'parentNodeId' | 'coParentNodeId' | 'sortOrder'>>) =>
    patch.set(id, { ...patch.get(id), ...change })
  let spouses = graph.spouses.filter((s) => s.spouseNodeId !== nodeId && s.nodeId !== nodeId)

  const ownerId = index.ownerOf.get(nodeId)
  if (ownerId !== undefined) {
    for (const n of graph.nodes) if (n.coParentNodeId === nodeId) set(n.id, { coParentNodeId: null })
    let order = 0
    spouses = graph.spouses
      .filter((s) => s.spouseNodeId !== nodeId)
      .map((s) => (s.nodeId === ownerId ? { ...s, order: ++order } : s))
  } else {
    const [heir, ...others] = index.spousesOf.get(nodeId) ?? []
    const kids = index.childrenOf.get(nodeId) ?? []
    const heirId = heir?.node.id ?? null
    const parentId = node.parentNodeId

    if (heirId !== null) {
      set(heirId, { parentNodeId: parentId, coParentNodeId: node.coParentNodeId })
      for (const kid of kids) {
        set(kid.id, { parentNodeId: heirId, ...(kid.coParentNodeId === heirId ? { coParentNodeId: null } : {}) })
      }
      spouses.push(...others.map((s, i) => ({ nodeId: heirId, spouseNodeId: s.node.id, order: i + 1 })))
    } else {
      for (const kid of kids) set(kid.id, { parentNodeId: parentId, coParentNodeId: parentId === null ? null : node.coParentNodeId })
    }

    // Người thế chỗ đứng đúng vị trí của ô cũ giữa các anh em, xếp lại 1..n
    const replacement = heirId !== null ? [heirId] : kids.map((k) => k.id)
    const merged = getSiblings(index, nodeId).flatMap((s) => (s.id === nodeId ? replacement : [s.id]))
    merged.forEach((id, i) => set(id, { sortOrder: i + 1 }))
  }

  return {
    nodes: graph.nodes.filter((n) => n.id !== nodeId).map((n) => (patch.has(n.id) ? { ...n, ...patch.get(n.id) } : n)),
    spouses,
  }
}
