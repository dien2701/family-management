import { api } from '@/services/client'
import type {
  CalendarMonth,
  CalendarOccurrence,
  CustomEvent,
  CustomEventInput,
  EventType,
} from '@/types/api'
import type { CalendarMode } from './monthNav'

export type UpcomingQuery = {
  days: 7 | 15 | 30 | 90 | 365
  type?: EventType
  sort: 'asc' | 'desc'
}

export const calendarApi = {
  upcoming: (q: UpcomingQuery) =>
    api.get<CalendarOccurrence[]>('/calendar/upcoming', {
      query: { days: q.days, type: q.type, sort: q.sort },
    }),
  month: (year: number, month: number, mode: CalendarMode, leap: boolean) =>
    api.get<CalendarMonth>('/calendar/month', { query: { year, month, mode, leap } }),
  getEvent: (id: number) => api.get<CustomEvent>(`/events/${id}`),
  createEvent: (input: CustomEventInput) => api.post<CustomEvent>('/events', input),
  updateEvent: (id: number, input: CustomEventInput) =>
    api.put<CustomEvent>(`/events/${id}`, input),
  deleteEvent: (id: number) => api.delete<void>(`/events/${id}`),
}
