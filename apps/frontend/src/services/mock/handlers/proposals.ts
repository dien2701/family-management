import type { Schemas } from '@/types/api'
import type { HandlerContext } from '../context'
import type { MockRequest, MockRouter } from '../router'
import { requireAdmin, requireApproved } from './common'
import { ApiError } from '../router'

function getProposals(context: HandlerContext) {
  const store = context.store
  if (!store.proposals) {
    store.proposals = []
    context.save()
  }
  return store.proposals
}

async function createProposal(request: MockRequest, context: HandlerContext): Promise<Schemas['Proposal']> {
  const user = await requireApproved(context)
  const body = request.body as Schemas['ProposalInput']
  
  if (!body.targetType || !body.action) {
    throw new ApiError(400, 'ValidationError', 'Invalid input')
  }

  const proposals = getProposals(context)
  const newId = proposals.length > 0 ? Math.max(...proposals.map(p => p.id)) + 1 : 1
  
  let baseUpdatedAt: string | null = null
  if (body.targetId) {
    const event = context.store.events?.find(e => e.id === body.targetId)
    if (event) {
      baseUpdatedAt = new Date().toISOString()
    }
  }

  const newProposal: Schemas['Proposal'] = {
    id: newId,
    accountId: user.id,
    accountName: user.fullName,
    targetType: body.targetType,
    action: body.action,
    targetId: body.targetId ?? null,
    payload: body.payload ?? null,
    status: 'PENDING',
    note: null,
    baseUpdatedAt,
    conflict: false,
    createdAt: new Date().toISOString()
  }

  proposals.push(newProposal)
  context.save()

  return newProposal
}

async function getMyProposals(request: MockRequest, context: HandlerContext): Promise<Schemas['ProposalPage']> {
  const user = await requireApproved(context)
  const page = parseInt(request.url.searchParams.get('page') || '1', 10)
  const size = parseInt(request.url.searchParams.get('size') || '10', 10)

  const proposals = getProposals(context).filter(p => p.accountId === user.id)
  proposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  const start = (page - 1) * size
  const items = proposals.slice(start, start + size)

  return {
    items,
    totalPages: Math.ceil(proposals.length / size) || 1
  }
}

async function getAdminProposals(request: MockRequest, context: HandlerContext): Promise<Schemas['ProposalPage']> {
  await requireAdmin(context)
  const status = request.url.searchParams.get('status')
  const page = parseInt(request.url.searchParams.get('page') || '1', 10)
  const size = parseInt(request.url.searchParams.get('size') || '10', 10)

  let proposals = getProposals(context)
  if (status) {
    proposals = proposals.filter(p => p.status === status)
  }
  
  proposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  const start = (page - 1) * size
  const items = proposals.slice(start, start + size)

  return {
    items,
    totalPages: Math.ceil(proposals.length / size) || 1
  }
}

async function countPendingProposals(request: MockRequest, context: HandlerContext): Promise<number> {
  await requireAdmin(context)
  return getProposals(context).filter(p => p.status === 'PENDING').length
}

async function approveProposal(request: MockRequest, context: HandlerContext): Promise<void> {
  await requireAdmin(context)
  const id = parseInt(request.params.id, 10)
  const body = request.body as { modifiedPayload?: Record<string, any> } | null

  const proposals = getProposals(context)
  const p = proposals.find(x => x.id === id)
  if (!p) throw new ApiError(404, 'NotFound', 'Proposal not found')

  if (p.status !== 'PENDING') {
    throw new ApiError(409, 'Conflict', 'Đề xuất không còn ở trạng thái chờ')
  }
  if (p.conflict) {
    throw new ApiError(409, 'Conflict', 'Sự kiện đã bị sửa đổi, vui lòng tải lại')
  }

  p.status = 'APPROVED'
  p.payload = body?.modifiedPayload ?? p.payload
  
  if (p.targetType === 'EVENT' && context.store.events) {
    if (p.action === 'CREATE' && p.payload) {
      const ev = p.payload as Schemas['CustomEvent']
      const newId = context.store.events.length > 0 ? Math.max(...context.store.events.map(e => e.id)) + 1 : 1
      context.store.events.push({ ...ev, id: newId })
    } else if (p.action === 'UPDATE' && p.targetId && p.payload) {
      const idx = context.store.events.findIndex(e => e.id === p.targetId)
      if (idx >= 0) {
        context.store.events[idx] = { ...context.store.events[idx], ...(p.payload as Schemas['CustomEvent']) }
      }
    } else if (p.action === 'DELETE' && p.targetId) {
      context.store.events = context.store.events.filter(e => e.id !== p.targetId)
    }
  }

  context.save()
}

async function rejectProposal(request: MockRequest, context: HandlerContext): Promise<void> {
  await requireAdmin(context)
  const id = parseInt(request.params.id, 10)
  const body = request.body as { note: string }

  const proposals = getProposals(context)
  const p = proposals.find(x => x.id === id)
  if (!p) throw new ApiError(404, 'NotFound', 'Proposal not found')

  if (p.status !== 'PENDING') {
    throw new ApiError(409, 'Conflict', 'Đề xuất không còn ở trạng thái chờ')
  }

  p.status = 'REJECTED'
  p.note = body.note
  context.save()
}

export function registerProposalHandlers(router: MockRouter): void {
  router.on('POST', '/proposals', createProposal)
  router.on('GET', '/proposals/mine', getMyProposals)
  router.on('GET', '/proposals/count', countPendingProposals)
  router.on('GET', '/proposals', getAdminProposals)
  router.on('POST', '/proposals/:id/approve', approveProposal)
  router.on('POST', '/proposals/:id/reject', rejectProposal)
}
