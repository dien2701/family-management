import type { Schemas } from '@/types/api'
import type { HandlerContext } from '../context'
import { mockProblem } from '../problem'
import type { MockRouter } from '../router'
import { requireApproved } from './common'

const VN_OFFSET_MS = 7 * 3600_000
const DAY_MS = 86_400_000

/** 0h giờ Việt Nam kế tiếp, dạng ISO UTC. */
function nextResetAt(now = Date.now()): string {
  const next = (Math.floor((now + VN_OFFSET_MS) / DAY_MS) + 1) * DAY_MS - VN_OFFSET_MS
  return new Date(next).toISOString()
}

async function quota(_: unknown, context: HandlerContext): Promise<Schemas['AiQuota']> {
  const viewer = await requireApproved(context)
  const settings = context.store.settings
  const limit =
    viewer.systemRole === 'ADMIN' ? (settings?.aiQuotaAdmin ?? 30) : (settings?.aiQuotaUser ?? 15)
  return { limit, used: 0, remaining: limit, resetAt: nextResetAt() }
}

async function messages(_: unknown, context: HandlerContext): Promise<Schemas['AiMessage'][]> {
  await requireApproved(context)
  return []
}

// Trả lời của AI và các thao tác trên bản nháp cần máy chủ (DECISIONS #72)
async function unavailable(_: unknown, context: HandlerContext): Promise<never> {
  await requireApproved(context)
  throw mockProblem(
    503,
    'SERVER_REQUIRED',
    'Cần kết nối máy chủ để dùng Trợ lý. Chức năng này chưa dùng được ở chế độ giả lập.',
  )
}

export function registerAiHandlers(router: MockRouter): void {
  router.on('GET', '/ai/quota', quota)
  router.on('GET', '/ai/messages', messages)
  router.on('POST', '/ai/chat', unavailable)
  router.on('POST', '/ai/drafts/:id/submit', unavailable)
  router.on('POST', '/ai/drafts/:id/apply', unavailable)
}
