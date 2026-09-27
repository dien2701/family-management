import { api } from '@/services/client'
import type { DashboardResponse } from '@/types/api'

export const dashboardApi = {
  getDashboard: () => api.get<DashboardResponse>('/dashboard'),
}
