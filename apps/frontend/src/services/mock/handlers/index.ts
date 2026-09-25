import { MockRouter } from '../router'
import { registerMemberHandlers } from './members'

/** Mỗi đợt FE thêm `register...Handlers` của module mình ở đây. */
export function buildRouter(): MockRouter {
  const router = new MockRouter()
  registerMemberHandlers(router)
  return router
}
