import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PrayerFill, PrayerRequest } from '@/types/api'
import { prayerApi } from './api'

const PRAYER_KEY = ['prayers'] as const

export function usePrayers() {
  return useQuery({ queryKey: [...PRAYER_KEY, 'list'], queryFn: prayerApi.list })
}

export function usePrayer(id: number) {
  return useQuery({
    queryKey: [...PRAYER_KEY, 'detail', id],
    queryFn: () => prayerApi.get(id),
    enabled: Number.isInteger(id) && id > 0,
    // 404 là kết quả (bài đã bị xóa), thử lại cũng vô ích
    retry: false,
  })
}

/** Thông tin đã điền trên server, chỉ cho tài khoản đã duyệt. */
export function usePrayerFill(id: number, enabled: boolean) {
  return useQuery({
    queryKey: [...PRAYER_KEY, 'fill', id],
    queryFn: () => prayerApi.getFill(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
    retry: false,
  })
}

function useAfterPrayerChange() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: PRAYER_KEY })
}

export function useCreatePrayer() {
  const done = useAfterPrayerChange()
  return useMutation({ mutationFn: (input: PrayerRequest) => prayerApi.create(input), onSuccess: done })
}

export function useUpdatePrayer() {
  const done = useAfterPrayerChange()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: PrayerRequest }) => prayerApi.update(id, input),
    onSuccess: done,
  })
}

export function useDeletePrayer() {
  const done = useAfterPrayerChange()
  return useMutation({ mutationFn: (id: number) => prayerApi.remove(id), onSuccess: done })
}

export function useSavePrayerFill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: PrayerFill['values'] }) =>
      prayerApi.saveFill(id, values),
    onSuccess: (data, { id }) => queryClient.setQueryData([...PRAYER_KEY, 'fill', id], data),
  })
}
