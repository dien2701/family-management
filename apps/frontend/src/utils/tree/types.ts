import type { TreeNode, TreeResponse } from '@/types/api'

export type { TreeNode }

/** Đồ thị đúng như `GET /api/tree` trả về (đời không nằm trong đó). */
export type TreeGraph = TreeResponse

export type SpouseEntry = { node: TreeNode; order: number }

/**
 * Chỉ mục dựng một lần từ đồ thị để tra nhanh. Quy ước (xem `GET /api/tree` trong openapi.yaml):
 * ô **thuộc dòng** là ô không phải vợ/chồng của ai; `parentNodeId` của con luôn là ô thuộc dòng,
 * `coParentNodeId` là ô vợ/chồng của ô đó.
 */
export type TreeIndex = {
  nodes: ReadonlyMap<number, TreeNode>
  /** Ô vợ/chồng → ô thuộc dòng của nó. */
  ownerOf: ReadonlyMap<number, number>
  /** Ô thuộc dòng → các ô vợ/chồng, thứ tự tăng dần. */
  spousesOf: ReadonlyMap<number, SpouseEntry[]>
  /** Ô thuộc dòng → các con theo `parentNodeId`, xếp theo `sortOrder`. */
  childrenOf: ReadonlyMap<number, TreeNode[]>
  /** Các gốc (ô thuộc dòng không có cha/mẹ), xếp theo `sortOrder`. */
  roots: TreeNode[]
  /** Thành viên → ô của họ trên cây. */
  nodeOfMember: ReadonlyMap<number, number>
}
