import { api } from '@/services/client'
import type { Prayer, PrayerFill, PrayerRequest, PrayerSummary } from '@/types/api'

export const prayerApi = {
  list: () => api.get<PrayerSummary[]>('/prayers'),
  get: (id: number) => api.get<Prayer>(`/prayers/${id}`),
  create: (input: PrayerRequest) => api.post<Prayer>('/prayers', input),
  update: (id: number, input: PrayerRequest) => api.put<Prayer>(`/prayers/${id}`, input),
  remove: (id: number) => api.delete<void>(`/prayers/${id}`),
  getFill: (id: number) => api.get<PrayerFill>(`/prayers/${id}/fill`),
  saveFill: (id: number, values: PrayerFill['values']) =>
    api.put<PrayerFill>(`/prayers/${id}/fill`, { values }),
}
