import { MockRouter } from '../router'
import { registerCalendarHandlers } from './calendar'
import { registerFileHandlers } from './files'
import { registerLinkHandlers } from './links'
import { registerMemberHandlers } from './members'
import { registerRelativeHandlers } from './relatives'
import { registerTreeHandlers } from './tree'
import { registerDashboardHandlers } from './dashboard'
import { registerProposalHandlers } from './proposals'
import { registerNotificationHandlers } from './notifications'
import { registerReportHandlers } from './reports'
import { registerSettingsHandlers } from './settings'
import { registerDeletedMembersHandlers } from './deleted'
import { registerAiHandlers } from './ai'
import { registerAuthHandlers } from './auth'

/** Mỗi đợt FE thêm `register...Handlers` của module mình ở đây. */
export function buildRouter(): MockRouter {
  const router = new MockRouter()
  registerAuthHandlers(router)
  registerMemberHandlers(router)
  registerRelativeHandlers(router)
  registerLinkHandlers(router)
  registerTreeHandlers(router)
  registerFileHandlers(router)
  registerCalendarHandlers(router)
  registerDashboardHandlers(router)
  registerProposalHandlers(router)
  registerNotificationHandlers(router)
  registerReportHandlers(router)
  registerSettingsHandlers(router)
  registerDeletedMembersHandlers(router)
  registerAiHandlers(router)
  return router
}
