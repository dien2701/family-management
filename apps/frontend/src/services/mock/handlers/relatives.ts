// /api/members/{id}/relatives: danh sách người thân trong hồ sơ. Luật theo IDEA §6.2 và DECISIONS #75:
// một chiều, mỗi người chỉ một dòng, không tự thêm chính mình, nhãn bắt buộc ≤ 50 ký tự;
// chủ hồ sơ (theo `memberId` của `/api/me`) và Admin được ghi, mọi tài khoản đã duyệt được xem.
import type { Me, Relative } from '@/types/api'
import type { HandlerContext } from '../context'
import { relativesOf } from '../links'
import { mockProblem, validationProblem } from '../problem'
import type { MockRequest, MockRouter } from '../router'
import type { StoredMember, StoredRelative } from '../store'
import {
  findMember,
  generationIndex,
  isObject,
  positiveInt,
  requireApproved,
  toSummary,
} from './common'

const MAX_LABEL = 50

function toRelative(row: StoredRelative, context: HandlerContext): Relative {
  const member = context.store.members.find((m) => m.id === row.relativeMemberId)
  // Người thân luôn còn trong danh sách thành viên: xóa thành viên đã dọn các dòng trỏ tới họ
  if (!member) throw mockProblem(404, 'MEMBER_NOT_FOUND', 'Không tìm thấy thành viên này.')
  return {
    id: row.id,
    relative: toSummary(member, generationIndex(context.store)),
    label: row.label,
    createdAt: row.createdAt,
  }
}

function requireOwnerOrAdmin(viewer: Me, owner: StoredMember): void {
  if (viewer.systemRole === 'ADMIN' || viewer.memberId === owner.id) return
  throw mockProblem(
    403,
    'FORBIDDEN',
    'Chỉ chủ hồ sơ hoặc Admin mới sửa được danh sách người thân.',
  )
}

/** Nhãn: cắt khoảng trắng hai đầu, bắt buộc, tối đa 50 ký tự. */
function parseLabel(raw: unknown): { label: string } | { message: string } {
  const label = typeof raw === 'string' ? raw.trim() : ''
  if (!label) return { message: 'Vui lòng nhập nhãn, ví dụ "cha", "vợ", "chú họ".' }
  if (label.length > MAX_LABEL) return { message: `Nhãn tối đa ${MAX_LABEL} ký tự.` }
  return { label }
}

function findRow(context: HandlerContext, owner: StoredMember, rawId: string | undefined) {
  const id = positiveInt(rawId)
  const row = relativesOf(context.store).find((r) => r.id === id && r.memberId === owner.id)
  if (!row) throw mockProblem(404, 'RELATIVE_NOT_FOUND', 'Không tìm thấy dòng người thân này.')
  return row
}

async function listRelatives(
  { params }: MockRequest,
  context: HandlerContext,
): Promise<Relative[]> {
  await requireApproved(context)
  const owner = findMember(context.store, params.id)
  return relativesOf(context.store)
    .filter((r) => r.memberId === owner.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
    .map((row) => toRelative(row, context))
}

async function addRelative(
  { params, body }: MockRequest,
  context: HandlerContext,
): Promise<Relative> {
  const viewer = await requireApproved(context)
  const owner = findMember(context.store, params.id)
  requireOwnerOrAdmin(viewer, owner)

  const input = isObject(body) ? body : {}
  const errors: { field: string; message: string }[] = []
  const relativeId = positiveInt(input.relativeMemberId)
  if (relativeId === null) {
    errors.push({ field: 'relativeMemberId', message: 'Vui lòng chọn một thành viên.' })
  } else if (relativeId === owner.id) {
    errors.push({ field: 'relativeMemberId', message: 'Không thể thêm chính chủ hồ sơ làm người thân.' })
  }
  const label = parseLabel(input.label)
  if ('message' in label) errors.push({ field: 'label', message: label.message })
  if (errors.length || relativeId === null || 'message' in label) throw validationProblem(errors)

  findMember(context.store, relativeId)
  const rows = relativesOf(context.store)
  if (rows.some((r) => r.memberId === owner.id && r.relativeMemberId === relativeId)) {
    throw mockProblem(
      409,
      'RELATIVE_EXISTS',
      'Người này đã có trong danh sách người thân. Muốn đổi nhãn thì sửa dòng cũ.',
    )
  }

  const now = new Date().toISOString()
  const row: StoredRelative = {
    id: rows.reduce((max, r) => Math.max(max, r.id), 0) + 1,
    memberId: owner.id,
    relativeMemberId: relativeId,
    label: label.label,
    createdAt: now,
    updatedAt: now,
  }
  rows.push(row)
  context.save()
  return toRelative(row, context)
}

async function updateRelative(
  { params, body }: MockRequest,
  context: HandlerContext,
): Promise<Relative> {
  const viewer = await requireApproved(context)
  const owner = findMember(context.store, params.id)
  requireOwnerOrAdmin(viewer, owner)
  const row = findRow(context, owner, params.relativeId)

  const label = parseLabel(isObject(body) ? body.label : undefined)
  if ('message' in label) throw validationProblem([{ field: 'label', message: label.message }])

  row.label = label.label
  row.updatedAt = new Date().toISOString()
  context.save()
  return toRelative(row, context)
}

async function deleteRelative({ params }: MockRequest, context: HandlerContext): Promise<void> {
  const viewer = await requireApproved(context)
  const owner = findMember(context.store, params.id)
  requireOwnerOrAdmin(viewer, owner)
  const row = findRow(context, owner, params.relativeId)
  context.store.relatives = relativesOf(context.store).filter((r) => r.id !== row.id)
  context.save()
}

export function registerRelativeHandlers(router: MockRouter): void {
  router.on('GET', '/members/:id/relatives', listRelatives)
  router.on('POST', '/members/:id/relatives', addRelative)
  router.on('PUT', '/members/:id/relatives/:relativeId', updateRelative)
  router.on('DELETE', '/members/:id/relatives/:relativeId', deleteRelative)
}
