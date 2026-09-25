import { MockRouter } from '../router'
import { registerCalendarHandlers } from './calendar'
import { registerFileHandlers } from './files'
import { registerLinkHandlers } from './links'
import { registerMemberHandlers } from './members'
import { registerRelativeHandlers } from './relatives'
import { registerTreeHandlers } from './tree'

/** Mỗi đợt FE thêm `register...Handlers` của module mình ở đây. */
export function buildRouter(): MockRouter {
  const router = new MockRouter()
  registerMemberHandlers(router)
  registerRelativeHandlers(router)
  registerLinkHandlers(router)
  registerTreeHandlers(router)
  registerFileHandlers(router)
  registerCalendarHandlers(router)
  return router
}
