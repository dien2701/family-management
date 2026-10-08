import { useEffect } from 'react'
import { Controller as RHFController, useForm as useRHF } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../hooks'
import type { Schemas } from '@/types/api'
import { PushCard } from '../components/PushCard'

export function SettingsPage() {
  const { data: pref, isPending } = useNotificationPreferences()
  const updatePref = useUpdateNotificationPreferences()
  
  const { control, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useRHF<Schemas['NotificationPref']>({
    defaultValues: {
      notifyEvents: true,
      notifyMemorials: true,
      notifyProposals: true,
      remindDaysBefore: [7, 3, 1, 0],
      remindHour: '08:00',
    }
  })

  useEffect(() => {
    if (pref) {
      reset(pref)
    }
  }, [pref, reset])

  const onSubmit = async (values: Schemas['NotificationPref']) => {
    try {
      await updatePref.mutateAsync(values)
      reset(values) // to reset isDirty
    } catch {
      // Lỗi đã hiện ở tầng mutation; giữ nguyên form
    }
  }

  if (isPending) return <p className="text-text-muted">Đang tải...</p>

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Cài đặt thông báo</h1>

      <PushCard />

      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(onSubmit)(e) }} className="rounded-lg border border-border bg-surface p-6 shadow-sm flex flex-col gap-6">
        <h2 className="text-lg font-semibold">Tuỳ chọn nhận thông báo</h2>
        
        <div className="flex flex-col gap-4">
          <RHFController
            control={control}
            name="notifyEvents"
            render={({ field }) => (
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={field.value as boolean} onChange={e => field.onChange(e.target.checked)} className="w-4 h-4" />
                <span>Nhắc sự kiện (sinh nhật, sự kiện chung)</span>
              </label>
            )}
          />
          <RHFController
            control={control}
            name="notifyMemorials"
            render={({ field }) => (
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={field.value as boolean} onChange={e => field.onChange(e.target.checked)} className="w-4 h-4" />
                <span>Nhắc ngày giỗ</span>
              </label>
            )}
          />
          <RHFController
            control={control}
            name="notifyProposals"
            render={({ field }) => (
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={field.value as boolean} onChange={e => field.onChange(e.target.checked)} className="w-4 h-4" />
                <span>Đề xuất thay đổi (dành cho Admin và người đề xuất)</span>
              </label>
            )}
          />
        </div>

        <div className="border-t border-border pt-6 flex flex-col gap-4">
          <h3 className="font-medium">Thời gian nhắc (Sự kiện)</h3>
          <RHFController
            control={control}
            name="remindHour"
            render={({ field }) => (
              <FormField label="Giờ nhắc (HH:mm)">
                <Input type="time" {...field} value={field.value as string} className="w-32" />
              </FormField>
            )}
          />
          <RHFController
            control={control}
            name="remindDaysBefore"
            render={({ field }) => (
              <FormField label="Số ngày nhắc trước" hint="Cách nhau bằng dấu phẩy, VD: 7, 3, 1, 0 (0 là đúng ngày)">
                <Input 
                  value={(field.value as number[] | undefined)?.join(', ') ?? ''} 
                  onChange={e => {
                    const val = e.target.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
                    field.onChange(val)
                  }} 
                  className="w-full sm:w-64"
                />
              </FormField>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={!isDirty} loading={isSubmitting}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  )
}
