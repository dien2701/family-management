// Mô hình cây thuần (DECISIONS #34, #60): dùng chung cho lớp giả lập và giao diện.
import type { SpouseEntry, TreeGraph, TreeIndex, TreeNode } from './types'

const bySortOrder = (a: TreeNode, b: TreeNode) => a.sortOrder - b.sortOrder || a.id - b.id

export function buildTreeIndex(graph: TreeGraph): TreeIndex {
  const nodes = new Map<number, TreeNode>()
  for (const node of graph.nodes) nodes.set(node.id, node)

  const ownerOf = new Map<number, number>()
  const spousesOf = new Map<number, SpouseEntry[]>()
  for (const link of graph.spouses) {
    const spouse = nodes.get(link.spouseNodeId)
    if (!spouse || !nodes.has(link.nodeId) || ownerOf.has(link.spouseNodeId)) continue
    ownerOf.set(link.spouseNodeId, link.nodeId)
    const list = spousesOf.get(link.nodeId) ?? []
    list.push({ node: spouse, order: link.order })
    spousesOf.set(link.nodeId, list)
  }
  for (const list of spousesOf.values()) list.sort((a, b) => a.order - b.order || a.node.id - b.node.id)

  const childrenOf = new Map<number, TreeNode[]>()
  const roots: TreeNode[] = []
  const nodeOfMember = new Map<number, number>()
  for (const node of nodes.values()) {
    if (node.memberId !== null) nodeOfMember.set(node.memberId, node.id)
    if (ownerOf.has(node.id)) continue
    if (node.parentNodeId !== null && nodes.has(node.parentNodeId)) {
      const siblings = childrenOf.get(node.parentNodeId) ?? []
      siblings.push(node)
      childrenOf.set(node.parentNodeId, siblings)
    } else {
      roots.push(node)
    }
  }
  for (const list of childrenOf.values()) list.sort(bySortOrder)
  roots.sort(bySortOrder)

  return { nodes, ownerOf, spousesOf, childrenOf, roots, nodeOfMember }
}

/** Ô thuộc dòng của một ô: chính nó, hoặc người mà nó là vợ/chồng. */
export function lineageIdOf(index: TreeIndex, nodeId: number): number {
  return index.ownerOf.get(nodeId) ?? nodeId
}

/**
 * Đời = độ sâu, tính riêng cho từng cây rời (gốc là 1). Ô vợ/chồng cùng đời với người kia.
 * Ô không nối được tới gốc nào (dữ liệu hỏng, có vòng) không có trong kết quả.
 */
export function computeGenerations(index: TreeIndex): Map<number, number> {
  const result = new Map<number, number>()
  const visit = (node: TreeNode, generation: number) => {
    if (result.has(node.id)) return
    result.set(node.id, generation)
    for (const spouse of index.spousesOf.get(node.id) ?? []) result.set(spouse.node.id, generation)
    for (const child of index.childrenOf.get(node.id) ?? []) visit(child, generation + 1)
  }
  for (const root of index.roots) visit(root, 1)
  return result
}

/** Tổ tiên theo dòng (cha/mẹ thuộc dòng), gần nhất trước. Ô vợ/chồng không có tổ tiên trên cây. */
export function getAncestors(index: TreeIndex, nodeId: number): TreeNode[] {
  const result: TreeNode[] = []
  let cursor = index.nodes.get(nodeId)
  if (!cursor || index.ownerOf.has(nodeId)) return result
  const seen = new Set<number>([cursor.id])
  while (cursor.parentNodeId !== null) {
    const parent = index.nodes.get(cursor.parentNodeId)
    if (!parent || seen.has(parent.id)) break
    seen.add(parent.id)
    result.push(parent)
    cursor = parent
  }
  return result
}

/** Con cháu thuộc dòng ở mọi đời (không gồm chính nó và vợ/chồng), theo thứ tự duyệt rộng. */
export function getDescendants(index: TreeIndex, nodeId: number): TreeNode[] {
  const result: TreeNode[] = []
  if (index.ownerOf.has(nodeId)) return result
  const queue = [...(index.childrenOf.get(nodeId) ?? [])]
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i]
    if (!node) break
    result.push(node)
    queue.push(...(index.childrenOf.get(node.id) ?? []))
  }
  return result
}

/**
 * Cả nhánh của một ô (theo #61): ô thuộc dòng cùng vợ/chồng của nó, rồi con cháu kèm vợ/chồng của họ.
 * Bấm vào ô vợ/chồng thì tính nhánh của người thuộc dòng.
 */
export function getBranch(index: TreeIndex, nodeId: number): TreeNode[] {
  const start = index.nodes.get(lineageIdOf(index, nodeId))
  if (!start) return []
  const result: TreeNode[] = []
  const queue = [start]
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i]
    if (!node) break
    result.push(node, ...(index.spousesOf.get(node.id) ?? []).map((s) => s.node))
    queue.push(...(index.childrenOf.get(node.id) ?? []))
  }
  return result
}

/** Thành viên chưa có ô nào trên cây (nguồn cho hộp chọn khi thêm vào cây). */
export function membersNotOnTree<T extends { id: number }>(members: readonly T[], index: TreeIndex): T[] {
  return members.filter((m) => !index.nodeOfMember.has(m.id))
}

/** Đồ thị con chỉ gồm các ô được giữ; ô mất cha/mẹ thành gốc, ô mất cặp thành con của một mình cha/mẹ. */
export function subGraph(graph: TreeGraph, keep: ReadonlySet<number>): TreeGraph {
  return {
    nodes: graph.nodes
      .filter((n) => keep.has(n.id))
      .map((n) => ({
        ...n,
        parentNodeId: n.parentNodeId !== null && keep.has(n.parentNodeId) ? n.parentNodeId : null,
        coParentNodeId: n.coParentNodeId !== null && keep.has(n.coParentNodeId) ? n.coParentNodeId : null,
      })),
    spouses: graph.spouses.filter((s) => keep.has(s.nodeId) && keep.has(s.spouseNodeId)),
  }
}

/**
 * Đồ thị "tổ tiên của tôi": ô này cùng vợ/chồng, và đường đi lên tới gốc (mỗi đời chỉ giữ người trong
 * đường đi cùng vợ/chồng của họ). Ô vợ/chồng thì chỉ giữ cặp của mình vì không có tổ tiên trên cây.
 */
export function ancestorGraph(graph: TreeGraph, nodeId: number): TreeGraph {
  const index = buildTreeIndex(graph)
  const start = lineageIdOf(index, nodeId)
  const chain = index.ownerOf.has(nodeId) ? [start] : [start, ...getAncestors(index, start).map((n) => n.id)]
  const keep = new Set<number>()
  for (const id of chain) {
    keep.add(id)
    for (const spouse of index.spousesOf.get(id) ?? []) keep.add(spouse.node.id)
  }
  return subGraph(graph, keep)
}
