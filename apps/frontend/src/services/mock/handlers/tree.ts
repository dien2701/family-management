// /api/tree: xem và dựng cây (DECISIONS #60, #61). Mọi tài khoản đã duyệt xem được, chỉ Admin dựng.
// Quy tắc hợp lệ nằm ở `utils/tree` (dùng chung với giao diện); handler chỉ áp dụng rồi ghi kho.
import type { TreeNode, TreeResponse } from '@/types/api'
import {
  buildTreeIndex,
  checkAddChild,
  checkAddParent,
  checkAddRoot,
  checkAddSpouse,
  checkDeleteSlot,
  checkFillSlot,
  checkMove,
  checkRemoveMember,
  checkReorder,
  checkSetCoParent,
  TREE_ERROR_STATUS,
  type TreeIndex,
  type TreeViolation,
} from '@/utils/tree'
import type { HandlerContext } from '../context'
import { mockProblem, validationProblem } from '../problem'
import type { MockRequest, MockRouter } from '../router'
import type { MockStore, StoredTreeNode } from '../store'
import { findMember, isObject, positiveInt, requireAdmin, requireApproved } from './common'
import { buildTreeResponse, toTreeNodeDto, treeSpousesOf } from '../treeGraph'

const violation = ({ code, message }: TreeViolation) =>
  mockProblem(TREE_ERROR_STATUS[code], code, message)

const indexOf = (store: MockStore): TreeIndex => buildTreeIndex(buildTreeResponse(store))

/** Id ô trong path; không phải số thì coi như không có ô đó. */
function nodeIdParam(raw: string | undefined): number {
  const id = positiveInt(raw)
  if (id === null) throw mockProblem(404, 'TREE_NODE_NOT_FOUND', 'Không tìm thấy ô này trên cây.')
  return id
}

function bodyOf(body: unknown): Record<string, unknown> {
  return isObject(body) ? body : {}
}

function memberIdField(body: unknown): number {
  const memberId = positiveInt(bodyOf(body).memberId)
  if (memberId === null) throw validationProblem([{ field: 'memberId', message: 'Vui lòng chọn một thành viên.' }])
  return memberId
}

/** Trường id ô có thể để trống (`null`/vắng) nhưng nếu có thì phải là số nguyên dương. */
function optionalNodeField(body: unknown, field: string): number | null {
  const raw = bodyOf(body)[field]
  if (raw === undefined || raw === null) return null
  const id = positiveInt(raw)
  if (id === null) throw validationProblem([{ field, message: 'Mã ô trên cây không hợp lệ.' }])
  return id
}

const nextId = (store: MockStore) => store.tree.nodes.reduce((max, n) => Math.max(max, n.id), 0) + 1

/** Thứ tự cho người mới xếp cuối các anh em. */
const nextSortOrder = (siblings: { sortOrder: number }[]) =>
  siblings.reduce((max, n) => Math.max(max, n.sortOrder), 0) + 1

function stored(store: MockStore, id: number): StoredTreeNode {
  const node = store.tree.nodes.find((n) => n.id === id)
  if (!node) throw mockProblem(404, 'TREE_NODE_NOT_FOUND', 'Không tìm thấy ô này trên cây.')
  return node
}

async function admin(context: HandlerContext) {
  requireAdmin(await requireApproved(context))
}

async function getTree(_request: MockRequest, context: HandlerContext): Promise<TreeResponse> {
  await requireApproved(context)
  return buildTreeResponse(context.store)
}

async function addRoot({ body }: MockRequest, context: HandlerContext): Promise<TreeNode> {
  await admin(context)
  const { store } = context
  const memberId = memberIdField(body)
  findMember(store, memberId)
  const index = indexOf(store)
  const check = checkAddRoot(index, memberId)
  if (!check.ok) throw violation(check)

  const node: StoredTreeNode = {
    id: nextId(store),
    memberId,
    parentNodeId: null,
    coParentNodeId: null,
    sortOrder: nextSortOrder(index.roots),
  }
  store.tree.nodes.push(node)
  context.save()
  return toTreeNodeDto(store, node)
}

async function addChild({ params, body }: MockRequest, context: HandlerContext): Promise<TreeNode> {
  await admin(context)
  const { store } = context
  const nodeId = nodeIdParam(params.id)
  const memberId = memberIdField(body)
  const coParentNodeId = optionalNodeField(body, 'coParentNodeId')
  findMember(store, memberId)
  const index = indexOf(store)
  const check = checkAddChild(index, nodeId, memberId, coParentNodeId)
  if (!check.ok) throw violation(check)

  const node: StoredTreeNode = {
    id: nextId(store),
    memberId,
    parentNodeId: check.parentNodeId,
    coParentNodeId: check.coParentNodeId,
    sortOrder: nextSortOrder(index.childrenOf.get(check.parentNodeId) ?? []),
  }
  store.tree.nodes.push(node)
  context.save()
  return toTreeNodeDto(store, node)
}

async function addSpouse({ params, body }: MockRequest, context: HandlerContext): Promise<TreeNode> {
  await admin(context)
  const { store } = context
  const nodeId = nodeIdParam(params.id)
  const memberId = memberIdField(body)
  findMember(store, memberId)
  const check = checkAddSpouse(indexOf(store), nodeId, memberId)
  if (!check.ok) throw violation(check)

  const node: StoredTreeNode = {
    id: nextId(store),
    memberId,
    parentNodeId: null,
    coParentNodeId: null,
    sortOrder: 0,
  }
  store.tree.nodes.push(node)
  treeSpousesOf(store).push({ nodeId, spouseNodeId: node.id, order: check.order })
  context.save()
  return toTreeNodeDto(store, node)
}

async function addParent({ params, body }: MockRequest, context: HandlerContext): Promise<TreeNode> {
  await admin(context)
  const { store } = context
  const nodeId = nodeIdParam(params.id)
  const memberId = memberIdField(body)
  findMember(store, memberId)
  const check = checkAddParent(indexOf(store), nodeId, memberId)
  if (!check.ok) throw violation(check)

  // Người mới thế vào chỗ của gốc cũ; gốc cũ thành con duy nhất (cả cây rời dịch xuống một đời)
  const child = stored(store, nodeId)
  const node: StoredTreeNode = {
    id: nextId(store),
    memberId,
    parentNodeId: null,
    coParentNodeId: null,
    sortOrder: child.sortOrder,
  }
  child.parentNodeId = node.id
  child.coParentNodeId = null
  child.sortOrder = 1
  store.tree.nodes.push(node)
  context.save()
  return toTreeNodeDto(store, node)
}

async function fillSlot({ params, body }: MockRequest, context: HandlerContext): Promise<TreeNode> {
  await admin(context)
  const { store } = context
  const nodeId = nodeIdParam(params.id)
  const memberId = memberIdField(body)
  findMember(store, memberId)
  const check = checkFillSlot(indexOf(store), nodeId, memberId)
  if (!check.ok) throw violation(check)

  const node = stored(store, nodeId)
  node.memberId = memberId
  context.save()
  return toTreeNodeDto(store, node)
}

async function removeMember({ params }: MockRequest, context: HandlerContext): Promise<TreeNode> {
  await admin(context)
  const { store } = context
  const nodeId = nodeIdParam(params.id)
  const check = checkRemoveMember(indexOf(store), nodeId)
  if (!check.ok) throw violation(check)

  const node = stored(store, nodeId)
  node.memberId = null
  context.save()
  return toTreeNodeDto(store, node)
}

async function deleteNode({ params }: MockRequest, context: HandlerContext): Promise<void> {
  await admin(context)
  const { store } = context
  const nodeId = nodeIdParam(params.id)
  const check = checkDeleteSlot(indexOf(store), nodeId)
  if (!check.ok) throw violation(check)

  store.tree.nodes = store.tree.nodes.filter((n) => n.id !== nodeId)
  store.tree.spouses = treeSpousesOf(store).filter((s) => s.spouseNodeId !== nodeId)
  context.save()
}

async function moveNode({ params, body }: MockRequest, context: HandlerContext): Promise<TreeNode> {
  await admin(context)
  const { store } = context
  const nodeId = nodeIdParam(params.id)
  // `newParentNodeId` bắt buộc có mặt (null là thành gốc mới)
  if (!('newParentNodeId' in bodyOf(body))) {
    throw validationProblem([{ field: 'newParentNodeId', message: 'Vui lòng chọn nơi đến.' }])
  }
  const newParentNodeId = optionalNodeField(body, 'newParentNodeId')
  const coParentNodeId = optionalNodeField(body, 'coParentNodeId')
  const index = indexOf(store)
  const check = checkMove(index, nodeId, newParentNodeId, coParentNodeId)
  if (!check.ok) throw violation(check)

  const siblings =
    check.parentNodeId === null ? index.roots : (index.childrenOf.get(check.parentNodeId) ?? [])
  const node = stored(store, nodeId)
  node.parentNodeId = check.parentNodeId
  node.coParentNodeId = check.coParentNodeId
  node.sortOrder = nextSortOrder(siblings.filter((n) => n.id !== nodeId))
  context.save()
  return toTreeNodeDto(store, node)
}

async function reorderNode({ params, body }: MockRequest, context: HandlerContext): Promise<TreeNode> {
  await admin(context)
  const { store } = context
  const nodeId = nodeIdParam(params.id)
  const direction = bodyOf(body).direction
  if (direction !== 'LEFT' && direction !== 'RIGHT') {
    throw validationProblem([{ field: 'direction', message: 'Hướng chỉ nhận LEFT hoặc RIGHT.' }])
  }
  const check = checkReorder(indexOf(store), nodeId, direction)
  if (!check.ok) throw violation(check)

  // Đánh số lại cả hàng anh em rồi đổi chỗ hai người, tránh nhầm khi các `sortOrder` đang trùng nhau
  const order = check.siblings.map((n) => n.id)
  ;[order[check.from], order[check.to]] = [order[check.to]!, order[check.from]!]
  order.forEach((id, i) => {
    stored(store, id).sortOrder = i + 1
  })
  context.save()
  return toTreeNodeDto(store, stored(store, nodeId))
}

async function setCoParent({ params, body }: MockRequest, context: HandlerContext): Promise<TreeNode> {
  await admin(context)
  const { store } = context
  const nodeId = nodeIdParam(params.id)
  if (!('coParentNodeId' in bodyOf(body))) {
    throw validationProblem([{ field: 'coParentNodeId', message: 'Vui lòng chọn cặp cha–mẹ.' }])
  }
  const coParentNodeId = optionalNodeField(body, 'coParentNodeId')
  const check = checkSetCoParent(indexOf(store), nodeId, coParentNodeId)
  if (!check.ok) throw violation(check)

  const node = stored(store, nodeId)
  node.coParentNodeId = check.coParentNodeId
  context.save()
  return toTreeNodeDto(store, node)
}

export function registerTreeHandlers(router: MockRouter): void {
  router.on('GET', '/tree', getTree)
  router.on('POST', '/tree/roots', addRoot)
  router.on('POST', '/tree/nodes/:id/children', addChild)
  router.on('POST', '/tree/nodes/:id/spouses', addSpouse)
  router.on('POST', '/tree/nodes/:id/parent', addParent)
  router.on('PUT', '/tree/nodes/:id/member', fillSlot)
  router.on('DELETE', '/tree/nodes/:id/member', removeMember)
  router.on('DELETE', '/tree/nodes/:id', deleteNode)
  router.on('POST', '/tree/nodes/:id/move', moveNode)
  router.on('PUT', '/tree/nodes/:id/order', reorderNode)
  router.on('PUT', '/tree/nodes/:id/co-parent', setCoParent)
}
