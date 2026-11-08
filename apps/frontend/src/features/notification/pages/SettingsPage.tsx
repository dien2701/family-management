import { BellRing, Clock } from 'lucide-react'
import { useEffect } from 'react'
import { Controller as RHFController, useForm as useRHF } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { SectionCard } from '@/components/shared/SectionCard'
import { StickyActions } from '@/components/shared/StickyActions'
import { Checkbox } from '@/components/ui/checkbox'
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

  const toggle = (name: 'notifyEvents' | 'notifyMemorials' | 'notifyProposals', label: string) => (
    <RHFController
      control={control}
      name={name}
      render={({ field }) => (
        <Checkbox label={label} checked={field.value as boolean} onChange={(e) => field.onChange(e.target.checked)} />
      )}
    />
  )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Cài đặt thông báo</h1>

      <PushCard />

      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(onSubmit)(e) }} className="flex flex-col gap-4">
        <SectionCard title="Nhận thông báo về" icon={BellRing}>
          {toggle('notifyEvents', 'Nhắc sự kiện (sinh nhật, sự kiện chung)')}
          {toggle('notifyMemorials', 'Nhắc ngày giỗ')}
          {toggle('notifyProposals', 'Đề xuất thay đổi (dành cho Admin và người đề xuất)')}
        </SectionCard>

        <SectionCard title="Thời gian nhắc" icon={Clock}>
          <div className="flex flex-col gap-4">
            <RHFController
              control={control}
              name="remindHour"
              render={({ field }) => (
                <FormField label="Giờ nhắc (HH:mm)">
                  <Input type="time" {...field} value={field.value as string} className="sm:w-40" />
                </FormField>
              )}
            />
            <RHFController
              control={control}
              name="remindDaysBefore"
              render={({ field }) => (
                <FormField label="Số ngày nhắc trước" hint="Cách nhau bằng dấu phẩy, VD: 7, 3, 1, 0 (0 là đúng ngày)">
                  <Input
                    inputMode="numeric"
                    value={(field.value as number[] | undefined)?.join(', ') ?? ''}
                    onChange={e => {
                      const val = e.target.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
                      field.onChange(val)
                    }}
                    className="sm:w-64"
                  />
                </FormField>
              )}
            />
          </div>
        </SectionCard>

        <StickyActions>
          <Button type="submit" disabled={!isDirty} loading={isSubmitting}>
            Lưu thay đổi
          </Button>
        </StickyActions>
      </form>
    </div>
  )
}
