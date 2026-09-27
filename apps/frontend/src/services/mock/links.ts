// Việc chung của người thân và liên kết tài khoản ↔ thành viên (DECISIONS #75, #79–#82) trên kho giả lập.
// Kho tạo trước Đợt 13 chưa có các mảng này nên đọc qua hàm để tự khởi tạo.
import type { LinkedMember, LinkRequest, Me } from '@/types/api'
import type { MockStore, StoredLinkRequest, StoredRelative } from './store'

export const relativesOf = (store: MockStore): StoredRelative[] => (store.relatives ??= [])
export const linksOf = (store: MockStore) => (store.links ??= [])
export const linkRequestsOf = (store: MockStore): StoredLinkRequest[] => (store.linkRequests ??= [])

export function linkedMemberIdOf(store: MockStore, accountId: number | undefined): number | null {
  if (accountId === undefined) return null
  return linksOf(store).find((l) => l.accountId === accountId)?.memberId ?? null
}

export function accountIdLinkedTo(store: MockStore, memberId: number): number | null {
  return linksOf(store).find((l) => l.memberId === memberId)?.accountId ?? null
}

/** `/api/me` của backend thật chưa biết liên kết (Đợt 28 mới có), nên gắn `memberId` từ kho giả lập. */
export function withLinkedMember(store: MockStore, me: Me): Me {
  const memberId = linkedMemberIdOf(store, me.id)
  return memberId === null ? me : { ...me, memberId }
}

export function toLinkedMember(store: MockStore, memberId: number): LinkedMember | null {
  const member = store.members.find((m) => m.id === memberId)
  return member ? { id: member.id, fullName: member.fullName } : null
}

export function toLinkRequest(store: MockStore, r: StoredLinkRequest): LinkRequest {
  return {
    id: r.id,
    accountId: r.accountId,
    accountFullName: r.accountFullName,
    accountEmail: r.accountEmail,
    member: toLinkedMember(store, r.memberId) ?? { id: r.memberId, fullName: '' },
    status: r.status,
    createdAt: r.createdAt,
    decidedAt: r.decidedAt,
  }
}

/**
 * Liên kết có hiệu lực (Admin duyệt yêu cầu hoặc gán trực tiếp). Hồ sơ chưa có email thì chép email tài khoản
 * sang một lần; đã có thì giữ nguyên (DECISIONS #81). Không chép họ tên, ảnh, SĐT.
 */
export function applyLink(
  store: MockStore,
  accountId: number,
  memberId: number,
  accountEmail: string | undefined,
): void {
  linksOf(store).push({ accountId, memberId })
  const member = store.members.find((m) => m.id === memberId)
  if (member && !member.email && accountEmail) {
    member.email = accountEmail
    member.updatedAt = new Date().toISOString()
  }
}

/** Gỡ liên kết của tài khoản. Không đụng tới email đã chép sang hồ sơ. */
export function removeLink(store: MockStore, accountId: number): void {
  store.links = linksOf(store).filter((l) => l.accountId !== accountId)
}

/** Hủy các yêu cầu đang chờ khi chúng không còn ý nghĩa (Admin gán trực tiếp, thành viên bị xóa). */
export function cancelPendingRequests(
  store: MockStore,
  match: (r: StoredLinkRequest) => boolean,
): void {
  const now = new Date().toISOString()
  for (const r of linkRequestsOf(store)) {
    if (r.status === 'PENDING' && match(r)) {
      r.status = 'CANCELLED'
      r.decidedAt = now
    }
  }
}

/**
 * Dọn dấu vết của một thành viên sắp bị xóa: dòng người thân ở cả hai phía, liên kết tài khoản (tài khoản vẫn còn)
 * và yêu cầu liên kết đang chờ. Trả về các dòng người thân đã xóa để lưu vào bản sao.
 */
export function removeMemberRelations(store: MockStore, memberId: number): StoredRelative[] {
  const all = relativesOf(store)
  const touched = (r: StoredRelative) => r.memberId === memberId || r.relativeMemberId === memberId
  const removed = all.filter(touched)
  store.relatives = all.filter((r) => !touched(r))
  store.links = linksOf(store).filter((l) => l.memberId !== memberId)
  cancelPendingRequests(store, (r) => r.memberId === memberId)
  return removed
}
