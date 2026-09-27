// Kiểm tra hợp lệ mọi thao tác dựng cây theo DECISIONS #60 và #61.
// Lớp giả lập dùng để trả ProblemDetail (mã lỗi + HTTP status), giao diện dùng để chỉ hiện nút "+" ở chỗ được phép.
import { getBranch, getSiblings } from './graph'
import type { TreeIndex, TreeNode } from './types'

export type TreeErrorCode =
  | 'TREE_NODE_NOT_FOUND'
  | 'MEMBER_ALREADY_ON_TREE'
  | 'TREE_NEEDS_CO_PARENT'
  | 'TREE_INVALID_CO_PARENT'
  | 'TREE_PARENT_ONLY_AT_TOP'
  | 'TREE_SPOUSE_NOT_ALLOWED'
  | 'TREE_SLOT_NOT_EMPTY'
  | 'TREE_SLOT_EMPTY'
  | 'TREE_SLOT_HAS_LINKS'
  | 'TREE_CYCLE'
  | 'TREE_MOVE_LINEAGE_ONLY'
  | 'TREE_NOT_A_CHILD'
  | 'TREE_ORDER_EDGE'

const MESSAGES: Record<TreeErrorCode, string> = {
  TREE_NODE_NOT_FOUND: 'Không tìm thấy ô này trên cây.',
  MEMBER_ALREADY_ON_TREE: 'Thành viên này đã có trên cây.',
  TREE_NEEDS_CO_PARENT: 'Người này có từ 2 vợ/chồng trở lên, hãy chọn đây là con với ai.',
  TREE_INVALID_CO_PARENT: 'Người được chọn không phải vợ/chồng của cha/mẹ.',
  TREE_PARENT_ONLY_AT_TOP: 'Chỉ thêm được cha/mẹ cho người gốc ở Đời 01.',
  TREE_SPOUSE_NOT_ALLOWED: 'Ô vợ/chồng không thêm được vợ/chồng.',
  TREE_SLOT_NOT_EMPTY: 'Ô này đang có người, không phải ô trống.',
  TREE_SLOT_EMPTY: 'Ô này đã là ô trống.',
  TREE_SLOT_HAS_LINKS: 'Ô trống còn con hoặc vợ/chồng nên chưa xóa được.',
  TREE_CYCLE: 'Không thể chuyển nhánh vào chính con cháu của nó.',
  TREE_MOVE_LINEAGE_ONLY: 'Chỉ chuyển được ô thuộc dòng; vợ/chồng đi theo người trong dòng.',
  TREE_NOT_A_CHILD: 'Ô này không có cha/mẹ nên không có cặp cha–mẹ.',
  TREE_ORDER_EDGE: 'Đã ở đầu hoặc cuối hàng anh em, không đổi chỗ thêm được.',
}

/** HTTP status của lỗi trả về từ API cây (không thấy ô: 404, còn lại: 409). */
export const TREE_ERROR_STATUS: Record<TreeErrorCode, number> = {
  TREE_NODE_NOT_FOUND: 404,
  MEMBER_ALREADY_ON_TREE: 409,
  TREE_NEEDS_CO_PARENT: 409,
  TREE_INVALID_CO_PARENT: 409,
  TREE_PARENT_ONLY_AT_TOP: 409,
  TREE_SPOUSE_NOT_ALLOWED: 409,
  TREE_SLOT_NOT_EMPTY: 409,
  TREE_SLOT_EMPTY: 409,
  TREE_SLOT_HAS_LINKS: 409,
  TREE_CYCLE: 409,
  TREE_MOVE_LINEAGE_ONLY: 409,
  TREE_NOT_A_CHILD: 409,
  TREE_ORDER_EDGE: 409,
}

export type TreeViolation = { ok: false; code: TreeErrorCode; message: string }
export type TreeCheck<T extends object = Record<never, never>> = ({ ok: true } & T) | TreeViolation

/** Cặp cha–mẹ đã được xác định cho một người con. */
export type ChildPair = { parentNodeId: number; coParentNodeId: number | null }

const fail = (code: TreeErrorCode): TreeViolation => ({ ok: false, code, message: MESSAGES[code] })

/** Mỗi thành viên chỉ có một ô trên cây. */
export function checkMemberFree(index: TreeIndex, memberId: number): TreeCheck {
  return index.nodeOfMember.has(memberId) ? fail('MEMBER_ALREADY_ON_TREE') : { ok: true }
}

export function checkAddRoot(index: TreeIndex, memberId: number): TreeCheck {
  return checkMemberFree(index, memberId)
}

/**
 * Xác định cặp cha–mẹ khi thêm con (hoặc chuyển nhánh vào) dưới ô `nodeId`:
 * - bấm trên ô vợ/chồng thì cặp là ô đó cùng người thuộc dòng;
 * - ô thuộc dòng có ≥ 2 vợ/chồng thì bắt buộc chọn `coParentNodeId`; có đúng 1 thì tự nhận; không có thì không có cặp.
 */
export function resolveChildPair(
  index: TreeIndex,
  nodeId: number,
  coParentNodeId: number | null = null,
): TreeCheck<ChildPair> {
  if (!index.nodes.has(nodeId)) return fail('TREE_NODE_NOT_FOUND')
  const ownerId = index.ownerOf.get(nodeId)
  if (ownerId !== undefined) {
    if (coParentNodeId !== null && coParentNodeId !== nodeId) return fail('TREE_INVALID_CO_PARENT')
    return { ok: true, parentNodeId: ownerId, coParentNodeId: nodeId }
  }
  const spouses = index.spousesOf.get(nodeId) ?? []
  if (coParentNodeId !== null) {
    if (!spouses.some((s) => s.node.id === coParentNodeId)) return fail('TREE_INVALID_CO_PARENT')
    return { ok: true, parentNodeId: nodeId, coParentNodeId }
  }
  if (spouses.length >= 2) return fail('TREE_NEEDS_CO_PARENT')
  return { ok: true, parentNodeId: nodeId, coParentNodeId: spouses[0]?.node.id ?? null }
}

export function checkAddChild(
  index: TreeIndex,
  nodeId: number,
  memberId: number,
  coParentNodeId: number | null = null,
): TreeCheck<ChildPair> {
  const pair = resolveChildPair(index, nodeId, coParentNodeId)
  if (!pair.ok) return pair
  const free = checkMemberFree(index, memberId)
  return free.ok ? pair : free
}

/** "+ Vợ/Chồng" chỉ có trên ô thuộc dòng. `order` là thứ tự của người mới (sau người cuối). */
export function checkAddSpouse(index: TreeIndex, nodeId: number, memberId: number): TreeCheck<{ order: number }> {
  if (!index.nodes.has(nodeId)) return fail('TREE_NODE_NOT_FOUND')
  if (index.ownerOf.has(nodeId)) return fail('TREE_SPOUSE_NOT_ALLOWED')
  const free = checkMemberFree(index, memberId)
  if (!free.ok) return free
  const spouses = index.spousesOf.get(nodeId) ?? []
  return { ok: true, order: (spouses.at(-1)?.order ?? 0) + 1 }
}

/** "+ Cha/Mẹ" chỉ có trên ô thuộc dòng ở Đời 01 (gốc). */
export function checkAddParent(index: TreeIndex, nodeId: number, memberId: number): TreeCheck {
  const node = index.nodes.get(nodeId)
  if (!node) return fail('TREE_NODE_NOT_FOUND')
  if (index.ownerOf.has(nodeId) || node.parentNodeId !== null) return fail('TREE_PARENT_ONLY_AT_TOP')
  return checkMemberFree(index, memberId)
}

/** Gỡ khỏi cây: ô có người thì thành ô trống, con cháu và vợ/chồng giữ nguyên. */
export function checkRemoveMember(index: TreeIndex, nodeId: number): TreeCheck {
  const node = index.nodes.get(nodeId)
  if (!node) return fail('TREE_NODE_NOT_FOUND')
  return node.memberId === null ? fail('TREE_SLOT_EMPTY') : { ok: true }
}

/** Điền ô trống bằng một thành viên chưa có trên cây. */
export function checkFillSlot(index: TreeIndex, nodeId: number, memberId: number): TreeCheck {
  const node = index.nodes.get(nodeId)
  if (!node) return fail('TREE_NODE_NOT_FOUND')
  if (node.memberId !== null) return fail('TREE_SLOT_NOT_EMPTY')
  return checkMemberFree(index, memberId)
}

/** Chỉ xóa được ô trống không còn con (theo cả cha/mẹ và cặp cha–mẹ) và không còn vợ/chồng. */
export function checkDeleteSlot(index: TreeIndex, nodeId: number): TreeCheck {
  const node = index.nodes.get(nodeId)
  if (!node) return fail('TREE_NODE_NOT_FOUND')
  if (node.memberId !== null) return fail('TREE_SLOT_NOT_EMPTY')
  const hasSpouses = (index.spousesOf.get(nodeId)?.length ?? 0) > 0
  const hasChildren = [...index.nodes.values()].some(
    (n) => n.parentNodeId === nodeId || n.coParentNodeId === nodeId,
  )
  return hasSpouses || hasChildren ? fail('TREE_SLOT_HAS_LINKS') : { ok: true }
}

/**
 * Di chuyển nhánh: ô thuộc dòng đi kèm vợ/chồng và con cháu, tới làm con của `newParentNodeId`
 * (ô thuộc dòng hoặc ô vợ/chồng, cặp xác định như khi thêm con) hoặc thành gốc mới khi là `null`. Chặn vòng.
 */
export function checkMove(
  index: TreeIndex,
  nodeId: number,
  newParentNodeId: number | null,
  coParentNodeId: number | null = null,
): TreeCheck<ChildPair | { parentNodeId: null; coParentNodeId: null }> {
  if (!index.nodes.has(nodeId)) return fail('TREE_NODE_NOT_FOUND')
  if (index.ownerOf.has(nodeId)) return fail('TREE_MOVE_LINEAGE_ONLY')
  if (newParentNodeId === null) return { ok: true, parentNodeId: null, coParentNodeId: null }
  if (!index.nodes.has(newParentNodeId)) return fail('TREE_NODE_NOT_FOUND')
  if (getBranch(index, nodeId).some((n) => n.id === newParentNodeId)) return fail('TREE_CYCLE')
  return resolveChildPair(index, newParentNodeId, coParentNodeId)
}

/** Đổi cặp cha–mẹ của một người con: `coParentNodeId` phải là vợ/chồng của cha/mẹ hiện tại. */
export function checkSetCoParent(
  index: TreeIndex,
  nodeId: number,
  coParentNodeId: number | null,
): TreeCheck<ChildPair> {
  const node = index.nodes.get(nodeId)
  if (!node) return fail('TREE_NODE_NOT_FOUND')
  if (node.parentNodeId === null || index.ownerOf.has(nodeId)) return fail('TREE_NOT_A_CHILD')
  return resolveChildPair(index, node.parentNodeId, coParentNodeId)
}

export type OrderDirection = 'LEFT' | 'RIGHT'

/**
 * Đổi thứ tự anh em: chỉ ô thuộc dòng, đổi chỗ với người kề bên. Trả `siblings` (đã xếp) và vị trí của ô
 * để nơi gọi biết người bị đổi chỗ cùng.
 */
export function checkReorder(
  index: TreeIndex,
  nodeId: number,
  direction: OrderDirection,
): TreeCheck<{ siblings: TreeNode[]; from: number; to: number }> {
  if (!index.nodes.has(nodeId)) return fail('TREE_NODE_NOT_FOUND')
  if (index.ownerOf.has(nodeId)) return fail('TREE_MOVE_LINEAGE_ONLY')
  const siblings = getSiblings(index, nodeId)
  const from = siblings.findIndex((n) => n.id === nodeId)
  const to = direction === 'LEFT' ? from - 1 : from + 1
  if (from < 0 || to < 0 || to >= siblings.length) return fail('TREE_ORDER_EDGE')
  return { ok: true, siblings, from, to }
}

export type AddOptions = {
  /** Có thể thêm con (luôn được, kể cả ô trống). */
  child: {
    /** Người có ≥ 2 vợ/chồng: phải hỏi "Con với ai" trong `coParentChoices`. */
    needsCoParent: boolean
    coParentChoices: TreeNode[]
  }
  spouse: boolean
  parent: boolean
}

/** Ba nút "+" nào được hiện trên một ô (ô không có trên cây thì không nút nào). */
export function getAddOptions(index: TreeIndex, nodeId: number): AddOptions {
  const node = index.nodes.get(nodeId)
  if (!node) return { child: { needsCoParent: false, coParentChoices: [] }, spouse: false, parent: false }
  const isSpouse = index.ownerOf.has(nodeId)
  const choices = isSpouse ? [] : (index.spousesOf.get(nodeId) ?? []).map((s) => s.node)
  return {
    child: { needsCoParent: choices.length >= 2, coParentChoices: choices },
    spouse: !isSpouse,
    parent: !isSpouse && node.parentNodeId === null,
  }
}
