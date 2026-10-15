import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CustomEventInput } from '@/types/api'
import { memberApi } from '../member/api'
import { formValuesToInput, memberToFormValues, type MemberFormValues } from '../member/schemas'
import { calendarApi, type UpcomingQuery } from './api'
import type { CalendarMode } from './monthNav'

/** Mọi dữ liệu lịch (sắp tới, tháng, sự kiện) cùng nằm dưới khóa này để một thao tác ghi làm mới hết. */
export const CALENDAR_KEY = ['calendar'] as const

export function useUpcoming(query: UpcomingQuery) {
  return useQuery({
    queryKey: [...CALENDAR_KEY, 'upcoming', query],
    queryFn: () => calendarApi.upcoming(query),
    placeholderData: keepPreviousData,
  })
}

export function useCalendarMonth(year: number, month: number, mode: CalendarMode, leap: boolean) {
  return useQuery({
    queryKey: [...CALENDAR_KEY, 'month', mode, year, month, leap],
    queryFn: () => calendarApi.month(year, month, mode, leap),
    placeholderData: keepPreviousData,
  })
}

export function useEvent(id: number | null) {
  return useQuery({
    queryKey: [...CALENDAR_KEY, 'event', id],
    queryFn: () => calendarApi.getEvent(id!),
    enabled: id !== null,
  })
}

function useAfterEventChange() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: CALENDAR_KEY })
}

export function useCreateEvent() {
  const done = useAfterEventChange()
  return useMutation({
    mutationFn: (input: CustomEventInput) => calendarApi.createEvent(input),
    onSuccess: done,
  })
}

export function useUpdateEvent() {
  const done = useAfterEventChange()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CustomEventInput }) =>
      calendarApi.updateEvent(id, input),
    onSuccess: done,
  })
}

/**
 * Sửa riêng nhóm ngày (sinh, mất, giỗ riêng) của một hồ sơ từ Lịch. PUT thay toàn bộ hồ sơ nên đọc bản mới nhất
 * rồi chỉ ghi đè các trường truyền vào, tránh ghi đè dữ liệu cũ trong cache.
 */
export function usePatchMemberDates() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, patch }: { memberId: number; patch: Partial<MemberFormValues> }) => {
      const member = await memberApi.getMemberDetail(memberId)
      return memberApi.updateMember(memberId, formValuesToInput({ ...memberToFormValues(member), ...patch }))
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: CALENDAR_KEY }),
        queryClient.invalidateQueries({ queryKey: ['members'] }),
      ]),
  })
}

export function useDeleteEvent() {
  const done = useAfterEventChange()
  return useMutation({ mutationFn: (id: number) => calendarApi.deleteEvent(id), onSuccess: done })
}
