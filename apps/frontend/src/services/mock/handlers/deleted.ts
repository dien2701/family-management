import type { Schemas } from '@/types/api'
import type { HandlerContext } from '../context'
import type { MockRequest, MockRouter } from '../router'
import { mockProblem } from '../problem'
import { positiveInt, requireAdmin, requireApproved } from './common'

type PageResponse = Schemas['PageResponseDeletedMemberSnapshotSummary']

async function listDeletedMembers(request: MockRequest, context: HandlerContext): Promise<PageResponse> {
  const viewer = await requireApproved(context)
  requireAdmin(viewer)

  const deleted = context.store.deleted ?? []
  
  const rawPage = request.query['page']
  const rawSize = request.query['size']
  
  const page = (typeof rawPage === 'string' || typeof rawPage === 'number') ? Number(rawPage) : 0
  const size = (typeof rawSize === 'string' || typeof rawSize === 'number') ? Number(rawSize) : 20

  const items = deleted
    .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())
    .slice(page * size, (page + 1) * size)
    .map((s): Schemas['DeletedMemberSnapshotSummary'] => ({
      auditId: s.member.id, // using member.id as mock auditId
      deletedAt: s.deletedAt,
      deletedBy: s.deletedBy ? `Admin ${s.deletedBy}` : 'Unknown',
      fullName: s.member.fullName,
    }))

  return {
    items,
    page,
    size,
    totalElements: deleted.length,
    totalPages: Math.ceil(deleted.length / size),
  }
}

async function getDeletedMemberSnapshot(request: MockRequest, context: HandlerContext): Promise<Schemas['DeletedMemberSnapshot']> {
  const viewer = await requireApproved(context)
  requireAdmin(viewer)

  const auditId = positiveInt(request.params['auditId'])
  if (auditId === null) throw mockProblem(400, 'VALIDATION_ERROR', 'auditId không hợp lệ')

  const deleted = context.store.deleted ?? []
  const snapshot = deleted.find(s => s.member.id === auditId)
  if (!snapshot) {
    throw mockProblem(404, 'NOT_FOUND', 'Không tìm thấy snapshot.')
  }

  return {
    member: {
      ...snapshot.member,
      generation: null,
      onTree: false,
    },
    relations: snapshot.relations as unknown as Schemas['Relative'][],
    attachments: [],
  } as unknown as Schemas['DeletedMemberSnapshot']
}

export function registerDeletedMembersHandlers(router: MockRouter): void {
  router.on('GET', '/admin/deleted-members', listDeletedMembers)
  router.on('GET', '/admin/deleted-members/:auditId', getDeletedMemberSnapshot)
}
