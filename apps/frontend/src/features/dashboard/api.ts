import { api } from '@/services/client'
import type { DashboardResponse } from '@/services/schema.d.ts' // wait, types are in '@/types/api'

// Let's actually import from '@/types/api'
import type { DashboardResponse } from '@/types/api'

export const dashboardApi = {
  getDashboard: () => api.get<DashboardResponse>('/dashboard'),
}
