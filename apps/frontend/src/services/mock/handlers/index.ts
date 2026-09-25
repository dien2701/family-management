import { MockRouter } from '../router'
import { registerFileHandlers } from './files'
import { registerLinkHandlers } from './links'
import { registerMemberHandlers } from './members'
import { registerRelativeHandlers } from './relatives'

/** Mỗi đợt FE thêm `register...Handlers` của module mình ở đây. */
export function buildRouter(): MockRouter {
  const router = new MockRouter()
  registerMemberHandlers(router)
  registerRelativeHandlers(router)
  registerLinkHandlers(router)
  registerFileHandlers(router)
  return router
}
