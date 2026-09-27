import type { Schemas } from '@/types/api'
import type { HandlerContext } from '../context'
import type { MockRequest, MockRouter } from '../router'
import { mockProblem } from '../problem'
import { isObject, requireAdmin, requireApproved } from './common'

async function getSettings(_: MockRequest, context: HandlerContext): Promise<Schemas['SystemSettings']> {
  const viewer = await requireApproved(context)
  requireAdmin(viewer)
  return context.store.settings ?? {
    policyVersion: 1,
    aiQuotaUser: 15,
    aiQuotaAdmin: 30,
    uploadMaxMb: 10,
    totalQuotaMb: 1024,
  }
}

async function updateSettings(request: MockRequest, context: HandlerContext): Promise<Schemas['SystemSettings']> {
  const viewer = await requireApproved(context)
  requireAdmin(viewer)
  
  const body = request.body as Schemas['SystemSettings']
  if (!isObject(body) || typeof body.policyVersion !== 'number') {
    throw mockProblem(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ.')
  }

  const store = context.store
  store.settings = { ...body }
  context.save()

  return store.settings
}

export function registerSettingsHandlers(router: MockRouter): void {
  router.on('GET', '/admin/settings', getSettings)
  router.on('PUT', '/admin/settings', updateSettings)
}
