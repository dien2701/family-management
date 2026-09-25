import { useEffect } from 'react'
import { Controller, useForm } from 'react-router-dom' // Wait, I need react-hook-form
import { Controller as RHFController, useForm as useRHF } from 'react-hook-form'
import { Bell, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { Alert } from '@/components/shared/Alert'
import { useNotificationPreferences, useUpdateNotificationPreferences, useTestPush, useSubscribePush } from '../hooks'
import type { Schemas } from '@/types/api'
import { ApiError } from '@/services/client'
import { registerPush } from '../push'

export function SettingsPage() {
  const { data: pref, isPending, refetch } = useNotificationPreferences()
  const updatePref = useUpdateNotificationPreferences()
  const testPush = useTestPush()
  
  const { control, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useRHF<Schemas['NotificationPref']>({
    defaultValues: {
      eventReminders: true,
      systemUpdates: true,
      proposals: true,
      remindDays: [7, 3, 1, 0],
      remindTime: '08:00'
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
    } catch (e) {
      // handle error
    }
  }

  const handlePushTest = async () => {
    try {
      await registerPush()
      await testPush.mutateAsync()
      alert('Đã gửi thử thông báo push. Vui lòng kiểm tra.')
    } catch (e) {
      if (e instanceof ApiError) {
        alert('Lỗi: ' + e.message)
      } else {
        alert('Có lỗi xảy ra khi đăng ký nhận thông báo.')
      }
    }
  }

  if (isPending) return <p className="text-text-muted">Đang tải...</p>

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Cài đặt thông báo</h1>

      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5" /> Trình duyệt (Web Push)
        </h2>
        <p className="text-sm text-text-muted mb-4">
          Nhận thông báo đẩy trực tiếp trên thiết bị này ngay cả khi không mở ứng dụng (yêu cầu cho phép thông báo).
        </p>
        <Button onClick={() => void handlePushTest()} variant="secondary">
          <Bell className="w-4 h-4 mr-2" /> Bật và thử gửi thông báo
        </Button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(onSubmit)(e) }} className="rounded-lg border border-border bg-surface p-6 shadow-sm flex flex-col gap-6">
        <h2 className="text-lg font-semibold">Tuỳ chọn nhận thông báo</h2>
        
        <div className="flex flex-col gap-4">
          <RHFController
            control={control}
            name="eventReminders"
            render={({ field }) => (
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} className="w-4 h-4" />
                <span>Nhắc sự kiện (Giỗ, sinh nhật, sự kiện chung)</span>
              </label>
            )}
          />
          <RHFController
            control={control}
            name="systemUpdates"
            render={({ field }) => (
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} className="w-4 h-4" />
                <span>Cập nhật hệ thống</span>
              </label>
            )}
          />
          <RHFController
            control={control}
            name="proposals"
            render={({ field }) => (
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} className="w-4 h-4" />
                <span>Đề xuất thay đổi (dành cho Admin và người đề xuất)</span>
              </label>
            )}
          />
        </div>

        <div className="border-t border-border pt-6 flex flex-col gap-4">
          <h3 className="font-medium">Thời gian nhắc (Sự kiện)</h3>
          <RHFController
            control={control}
            name="remindTime"
            render={({ field }) => (
              <FormField label="Giờ nhắc (HH:mm)">
                <Input type="time" {...field} className="w-32" />
              </FormField>
            )}
          />
          <RHFController
            control={control}
            name="remindDays"
            render={({ field }) => (
              <FormField label="Số ngày nhắc trước" hint="Cách nhau bằng dấu phẩy, VD: 7, 3, 1, 0 (0 là đúng ngày)">
                <Input 
                  value={field.value?.join(', ') || ''} 
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
