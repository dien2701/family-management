// /api/files/sign và /api/files/confirm: cần Cloudinary nên lớp giả lập không làm được (DECISIONS #72).
import type { HandlerContext } from '../context'
import { mockProblem } from '../problem'
import type { MockRouter } from '../router'

async function unavailable(_request: unknown, context: HandlerContext): Promise<never> {
  await context.viewer()
  throw mockProblem(
    503,
    'SERVER_REQUIRED',
    'Cần kết nối máy chủ để tải tệp lên. Chức năng này chưa dùng được ở chế độ giả lập.',
  )
}

export function registerFileHandlers(router: MockRouter): void {
  router.on('POST', '/files/sign', unavailable)
  router.on('POST', '/files/confirm', unavailable)
}
