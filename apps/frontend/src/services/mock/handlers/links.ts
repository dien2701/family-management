// Liên kết tài khoản ↔ thành viên ("Tôi là ai"). Luật theo IDEA §6.3 và DECISIONS #79–#82:
// quan hệ 1–1; hai cách liên kết (User gửi yêu cầu rồi Admin duyệt, hoặc Admin gán trực tiếp); User tự hủy,
// Admin hủy được của bất kỳ ai; khi liên kết có hiệu lực thì chép email tài khoản sang hồ sơ nếu hồ sơ chưa có.
// Tài khoản nằm ở backend thật nên `/me` và `/admin/accounts` được "bọc" để gắn thông tin liên kết từ kho giả lập.
import type { AccountAdmin, AccountAdminPage, LinkRequest, Me } from '@/types/api'
import type { HandlerContext } from '../context'
import {
  accountIdLinkedTo,
  applyLink,
  cancelPendingRequests,
  linkedMemberIdOf,
  linkRequestsOf,
  removeLink,
  toLinkedMember,
  toLinkRequest,
} from '../links'
import { mockProblem, validationProblem } from '../problem'
import type { MockRequest, MockRouter } from '../router'
import type { MockStore, StoredLinkRequest } from '../store'
import { findMember, isObject, positiveInt, requireAdmin, requireApproved } from './common'

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const

const accountAlreadyLinked = () =>
  mockProblem(
    409,
    'ACCOUNT_ALREADY_LINKED',
    'Tài khoản này đã liên kết với một thành viên. Hãy hủy liên kết cũ trước.',
  )

const memberAlreadyLinked = () =>
  mockProblem(409, 'MEMBER_ALREADY_LINKED', 'Thành viên này đã có tài khoản khác liên kết.')

const notLinked = () => mockProblem(409, 'NOT_LINKED', 'Tài khoản này chưa liên kết với thành viên nào.')

/** Gắn thành viên đang liên kết vào dòng tài khoản của backend thật. */
function withMember(store: MockStore, account: AccountAdmin): AccountAdmin {
  const memberId = linkedMemberIdOf(store, account.id)
  return {
    ...account,
    memberId: memberId ?? account.memberId,
    member: memberId === null ? null : toLinkedMember(store, memberId),
  }
}

/** Backend chưa có "lấy một tài khoản" nên duyệt lần lượt các trang của danh sách. */
async function findAccount(context: HandlerContext, rawId: string | undefined): Promise<AccountAdmin> {
  const id = positiveInt(rawId)
  for (let page = 0; id !== null; page++) {
    const result = await context.real<AccountAdminPage>('GET', '/admin/accounts', {
      query: { page, size: 100 },
    })
    const found = result.items?.find((a) => a.id === id)
    if (found) return found
    if (page + 1 >= (result.totalPages ?? 0)) break
  }
  throw mockProblem(404, 'ACCOUNT_NOT_FOUND', 'Không tìm thấy tài khoản này.')
}

function memberIdFromBody(body: unknown): number {
  const memberId = positiveInt(isObject(body) ? body.memberId : undefined)
  if (memberId === null) throw validationProblem([{ field: 'memberId', message: 'Vui lòng chọn một thành viên.' }])
  return memberId
}

function findRequest(store: MockStore, rawId: string | undefined): StoredLinkRequest {
  const id = positiveInt(rawId)
  const request = linkRequestsOf(store).find((r) => r.id === id)
  if (!request) throw mockProblem(404, 'LINK_REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu liên kết này.')
  return request
}

function requirePending(request: StoredLinkRequest): void {
  if (request.status !== 'PENDING') {
    throw mockProblem(
      409,
      'LINK_REQUEST_NOT_PENDING',
      'Yêu cầu này đã được xử lý rồi. Danh sách đã được tải lại.',
    )
  }
}

// ---------- Bọc backend thật ----------

async function getMe(_request: MockRequest, context: HandlerContext): Promise<Me> {
  return context.viewer()
}

async function listAccounts(
  { query }: MockRequest,
  context: HandlerContext,
): Promise<AccountAdminPage> {
  const page = await context.real<AccountAdminPage>('GET', '/admin/accounts', { query })
  return { ...page, items: (page.items ?? []).map((a) => withMember(context.store, a)) }
}

// ---------- Yêu cầu "Đây là tôi" ----------

async function createLinkRequest(
  { body }: MockRequest,
  context: HandlerContext,
): Promise<LinkRequest> {
  const viewer = await requireApproved(context)
  const { store } = context
  const accountId = viewer.id
  if (accountId === undefined) throw mockProblem(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập lại.')

  const memberId = memberIdFromBody(body)
  findMember(store, memberId)
  if (linkedMemberIdOf(store, accountId) !== null) throw accountAlreadyLinked()
  if (accountIdLinkedTo(store, memberId) !== null) throw memberAlreadyLinked()
  if (linkRequestsOf(store).some((r) => r.accountId === accountId && r.status === 'PENDING')) {
    throw mockProblem(
      409,
      'LINK_REQUEST_EXISTS',
      'Bạn đã gửi yêu cầu và đang chờ Admin duyệt. Hãy chờ kết quả hoặc nhờ Admin từ chối để gửi lại.',
    )
  }

  const rows = linkRequestsOf(store)
  const request: StoredLinkRequest = {
    id: rows.reduce((max, r) => Math.max(max, r.id), 0) + 1,
    accountId,
    accountFullName: viewer.fullName ?? viewer.email ?? '',
    accountEmail: viewer.email ?? '',
    memberId,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    decidedAt: null,
  }
  rows.push(request)
  context.save()
  return toLinkRequest(store, request)
}

async function myLinkRequests(_request: MockRequest, context: HandlerContext): Promise<LinkRequest[]> {
  const viewer = await requireApproved(context)
  return linkRequestsOf(context.store)
    .filter((r) => r.accountId === viewer.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .map((r) => toLinkRequest(context.store, r))
}

async function listLinkRequests(
  { query }: MockRequest,
  context: HandlerContext,
): Promise<LinkRequest[]> {
  requireAdmin(await requireApproved(context))
  const status = query.status
  if (status !== undefined && status !== '' && !(STATUSES as readonly unknown[]).includes(status)) {
    throw validationProblem([{ field: 'status', message: `status chỉ nhận: ${STATUSES.join(', ')}.` }])
  }
  return linkRequestsOf(context.store)
    .filter((r) => !status || r.status === status)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
    .map((r) => toLinkRequest(context.store, r))
}

async function approveLinkRequest(
  { params }: MockRequest,
  context: HandlerContext,
): Promise<LinkRequest> {
  requireAdmin(await requireApproved(context))
  const { store } = context
  const request = findRequest(store, params.id)
  requirePending(request)
  findMember(store, request.memberId)
  if (linkedMemberIdOf(store, request.accountId) !== null) throw accountAlreadyLinked()
  if (accountIdLinkedTo(store, request.memberId) !== null) throw memberAlreadyLinked()

  applyLink(store, request.accountId, request.memberId, request.accountEmail)
  request.status = 'APPROVED'
  request.decidedAt = new Date().toISOString()
  context.save()
  return toLinkRequest(store, request)
}

async function rejectLinkRequest(
  { params }: MockRequest,
  context: HandlerContext,
): Promise<LinkRequest> {
  requireAdmin(await requireApproved(context))
  const request = findRequest(context.store, params.id)
  requirePending(request)
  request.status = 'REJECTED'
  request.decidedAt = new Date().toISOString()
  context.save()
  return toLinkRequest(context.store, request)
}

// ---------- Hủy và gán trực tiếp ----------

async function unlinkMe(_request: MockRequest, context: HandlerContext): Promise<void> {
  const viewer = await requireApproved(context)
  if (viewer.id === undefined || linkedMemberIdOf(context.store, viewer.id) === null) throw notLinked()
  removeLink(context.store, viewer.id)
  context.save()
}

async function adminLinkMember(
  { params, body }: MockRequest,
  context: HandlerContext,
): Promise<AccountAdmin> {
  requireAdmin(await requireApproved(context))
  const { store } = context
  const memberId = memberIdFromBody(body)
  const account = await findAccount(context, params.id)
  findMember(store, memberId)
  const accountId = account.id!

  // Chỉ tài khoản đã duyệt và đang hoạt động (DECISIONS #80)
  if (account.status !== 'ACTIVE' || account.approvalStatus !== 'APPROVED') {
    throw mockProblem(
      409,
      'INVALID_ACCOUNT_STATE',
      'Chỉ gán được thành viên cho tài khoản đã duyệt và đang hoạt động.',
    )
  }
  if (linkedMemberIdOf(store, accountId) !== null) throw accountAlreadyLinked()
  if (accountIdLinkedTo(store, memberId) !== null) throw memberAlreadyLinked()

  cancelPendingRequests(store, (r) => r.accountId === accountId)
  applyLink(store, accountId, memberId, account.email)
  context.save()
  return withMember(store, account)
}

async function adminUnlinkMember(
  { params }: MockRequest,
  context: HandlerContext,
): Promise<AccountAdmin> {
  requireAdmin(await requireApproved(context))
  const account = await findAccount(context, params.id)
  const accountId = account.id!
  if (linkedMemberIdOf(context.store, accountId) === null) throw notLinked()
  removeLink(context.store, accountId)
  context.save()
  return withMember(context.store, account)
}

export function registerLinkHandlers(router: MockRouter): void {
  router.on('GET', '/me', getMe)
  router.on('GET', '/admin/accounts', listAccounts)
  router.on('POST', '/link-requests', createLinkRequest)
  router.on('GET', '/link-requests', listLinkRequests)
  router.on('GET', '/link-requests/mine', myLinkRequests)
  router.on('POST', '/link-requests/:id/approve', approveLinkRequest)
  router.on('POST', '/link-requests/:id/reject', rejectLinkRequest)
  router.on('DELETE', '/me/member-link', unlinkMe)
  router.on('PUT', '/admin/accounts/:id/member-link', adminLinkMember)
  router.on('DELETE', '/admin/accounts/:id/member-link', adminUnlinkMember)
}
