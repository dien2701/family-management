import type { HandlerContext } from '../context'
import { mockProblem } from '../problem'
import type { MockRouter } from '../router'

async function unavailable(_request: unknown, context: HandlerContext): Promise<never> {
  await context.viewer()
  throw mockProblem(
    503,
    'SERVER_REQUIRED',
    'Cần kết nối máy chủ để xuất báo cáo. Chức năng này chưa dùng được ở chế độ giả lập.',
  )
}

export function registerReportHandlers(router: MockRouter): void {
  router.on('GET', '/reports/members.xlsx', unavailable)
  router.on('GET', '/reports/members.pdf', unavailable)
  router.on('GET', '/reports/events.xlsx', unavailable)
  router.on('GET', '/reports/memorials.pdf', unavailable)
}
