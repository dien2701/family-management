// Phần dùng chung của các handler: kiểm quyền, tìm thành viên, dựng MemberSummary.
import type { Me, MemberSummary } from '@/types/api'
import type { HandlerContext } from '../context'
import { mockProblem } from '../problem'
import type { MockStore, StoredMember } from '../store'

export type FieldErrors = { field: string; message: string }[]

export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Số nguyên dương từ tham số path hoặc body; không hợp lệ thì `null`. */
export function positiveInt(raw: unknown): number | null {
  const n = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : raw
  return typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : null
}

/** Đời = độ sâu của ô chứa người đó trên cây (gốc là đời 1). Chưa có trên cây thì không có trong map. */
export function generationIndex(store: MockStore): Map<number, number> {
  const byId = new Map(store.tree.nodes.map((n) => [n.id, n]))
  const result = new Map<number, number>()
  for (const node of store.tree.nodes) {
    if (node.memberId === null) continue
    let depth = 1
    let cursor = node
    const seen = new Set<number>([cursor.id])
    while (cursor.parentNodeId !== null) {
      const parent = byId.get(cursor.parentNodeId)
      if (!parent || seen.has(parent.id)) break
      seen.add(parent.id)
      cursor = parent
      depth++
    }
    result.set(node.memberId, depth)
  }
  return result
}

export function toSummary(m: StoredMember, generations: Map<number, number>): MemberSummary {
  const generation = generations.get(m.id) ?? null
  return {
    id: m.id,
    fullName: m.fullName,
    gender: m.gender,
    avatarUrl: m.avatarUrl,
    labels: m.labels,
    birthYear: m.birth?.year ?? null,
    isDeceased: m.isDeceased,
    deathYear: m.deathSolar?.year ?? null,
    generation,
    onTree: generation !== null,
    createdAt: m.createdAt,
  }
}

export async function requireApproved(context: HandlerContext): Promise<Me> {
  const viewer = await context.viewer()
  if (viewer.approvalStatus !== 'APPROVED') {
    throw mockProblem(
      403,
      'ACCOUNT_NOT_APPROVED',
      'Tài khoản của bạn đang chờ Admin duyệt nên chưa xem được dữ liệu gia phả.',
    )
  }
  return viewer
}

export function requireAdmin(viewer: Me): void {
  if (viewer.systemRole !== 'ADMIN') {
    throw mockProblem(403, 'FORBIDDEN', 'Chỉ Admin mới có quyền thực hiện thao tác này.')
  }
}

export function findMember(store: MockStore, rawId: unknown): StoredMember {
  const id = positiveInt(rawId)
  const member = id === null ? undefined : store.members.find((m) => m.id === id)
  if (!member) throw mockProblem(404, 'MEMBER_NOT_FOUND', 'Không tìm thấy thành viên này.')
  return member
}
