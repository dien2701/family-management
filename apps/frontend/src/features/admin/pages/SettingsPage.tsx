import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/services/client'
import { useSettings, useUpdateSettings } from '../hooks'

const schema = z.object({
  policyVersion: z.number('Phải là số.').int().min(1, 'Phiên bản phải lớn hơn 0.'),
  aiQuotaUser: z.number('Phải là số.').int().min(0, 'Số lượt phải lớn hơn hoặc bằng 0.'),
  aiQuotaAdmin: z.number('Phải là số.').int().min(0, 'Số lượt phải lớn hơn hoặc bằng 0.'),
  uploadMaxMb: z.number('Phải là số.').int().min(1, 'Dung lượng phải lớn hơn 0.'),
  totalQuotaMb: z.number('Phải là số.').int().min(1, 'Dung lượng phải lớn hơn 0.'),
})

type FormValues = z.infer<typeof schema>

export function SettingsPage() {
  const { data: settings, isLoading, isError, error } = useSettings()
  const updateSettings = useUpdateSettings()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: settings,
  })

  useEffect(() => {
    if (settings) {
      reset(settings)
    }
  }, [settings, reset])

  const onSubmit = (data: FormValues) => {
    updateSettings.mutate(data)
  }

  const currentPolicyVersion = watch('policyVersion')
  const isPolicyChanged = settings && currentPolicyVersion !== settings.policyVersion

  if (isLoading) return <FullPageSpinner />

  if (isError) {
    const msg = error instanceof ApiError ? error.message : 'Có lỗi khi tải cấu hình.'
    return (
      <div className="flex justify-center p-8">
        <Alert variant="danger">{msg}</Alert>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold text-text">Cấu hình hệ thống</h1>
        <p className="text-text-muted">Các thông số giới hạn và quy định chung của ứng dụng.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-text">Quy định và Chính sách</h2>
          <FormField label="Phiên bản chính sách bảo mật" error={errors.policyVersion?.message}>
            <Input
              type="number"
              {...register('policyVersion', { valueAsNumber: true })}
              className="max-w-[200px]"
            />
          </FormField>
          {isPolicyChanged && (
            <div className="mt-2 text-sm text-warning font-semibold">
              Lưu ý: Mọi tài khoản sẽ phải đồng ý lại chính sách bảo mật vì phiên bản đã thay đổi.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-text">Giới hạn AI</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Lượt AI của User (mỗi tháng)" error={errors.aiQuotaUser?.message}>
              <Input
                type="number"
                {...register('aiQuotaUser', { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Lượt AI của Admin (mỗi tháng)" error={errors.aiQuotaAdmin?.message}>
              <Input
                type="number"
                {...register('aiQuotaAdmin', { valueAsNumber: true })}
              />
            </FormField>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-text">Dung lượng lưu trữ</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Tối đa mỗi tệp tải lên (MB)" error={errors.uploadMaxMb?.message}>
              <Input
                type="number"
                {...register('uploadMaxMb', { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Tổng dung lượng gia phả (MB)" error={errors.totalQuotaMb?.message}>
              <Input
                type="number"
                {...register('totalQuotaMb', { valueAsNumber: true })}
              />
            </FormField>
          </div>
        </div>

        {updateSettings.isError && (
          <Alert variant="danger">
            {updateSettings.error instanceof ApiError
              ? updateSettings.error.message
              : 'Cập nhật thất bại. Vui lòng thử lại.'}
          </Alert>
        )}
        
        {updateSettings.isSuccess && (
          <Alert variant="success">Cập nhật cấu hình thành công.</Alert>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={!isDirty || updateSettings.isPending}>
            {updateSettings.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || updateSettings.isPending}
            onClick={() => reset(settings)}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  )
}
