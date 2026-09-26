import type { HandlerContext } from '../context'
import { mockProblem } from '../problem'
import type { MockRouter, MockRequest } from '../router'
import type { Schemas } from '@/types/api'

async function unavailable(_request: unknown, context: HandlerContext): Promise<never> {
  await context.viewer()
  throw mockProblem(
    503,
    'SERVER_REQUIRED',
    'Cần kết nối máy chủ để thực hiện chức năng này (chế độ giả lập không hỗ trợ lưu trữ tệp tin).',
  )
}

async function getQuota(_request: MockRequest, context: HandlerContext): Promise<Schemas['QuotaResponse']> {
  const viewer = await context.viewer()
  if (viewer.systemRole !== 'ADMIN') throw mockProblem(403, 'FORBIDDEN', 'Chỉ Admin.')
  return { usedMb: 0, limitMb: 1024 }
}

async function listCommonAttachments(_request: MockRequest, context: HandlerContext): Promise<Schemas['Attachment'][]> {
  await context.viewer()
  return context.store.attachments?.filter((a) => a.memberId === null) ?? []
}

async function listMemberAttachments(request: MockRequest, context: HandlerContext): Promise<Schemas['Attachment'][]> {
  await context.viewer()
  const memberId = Number(request.params['id'])
  return context.store.attachments?.filter((a) => a.memberId === memberId) ?? []
}

async function deleteAttachment(request: MockRequest, context: HandlerContext): Promise<void> {
  const viewer = await context.viewer()
  if (viewer.systemRole !== 'ADMIN') throw mockProblem(403, 'FORBIDDEN', 'Chỉ Admin mới được xóa tệp đính kèm.')
  
  const id = Number(request.params['id'])
  const index = context.store.attachments?.findIndex((a) => a.id === id) ?? -1
  if (index === -1) throw mockProblem(404, 'NOT_FOUND', 'Không tìm thấy tệp đính kèm.')
  
  context.store.attachments!.splice(index, 1)
  context.save()
}

export function registerFileHandlers(router: MockRouter): void {
  router.on('POST', '/files/sign', unavailable)
  router.on('POST', '/files/confirm', unavailable)
  router.on('GET', '/files/quota', getQuota)
  
  router.on('GET', '/attachments/common', listCommonAttachments)
  router.on('DELETE', '/attachments/:id', deleteAttachment)
  router.on('GET', '/attachments/:id/download', unavailable)
  
  router.on('GET', '/members/:id/attachments', listMemberAttachments)
}
