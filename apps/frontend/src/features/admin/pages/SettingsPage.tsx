import { zodResolver } from '@hookform/resolvers/zod'
import { HardDrive, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'
import { SectionCard } from '@/components/shared/SectionCard'
import { StickyActions } from '@/components/shared/StickyActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/services/client'
import { useSettings, useUpdateSettings } from '../hooks'

const schema = z.object({
  policyVersion: z.number('Phải là số.').int().min(1, 'Phiên bản phải lớn hơn 0.'),
  aiQuotaUser: z.number('Phải là số.').int().min(0, 'Số lượt phải lớn hơn hoặc bằng 0.'),
  aiQuotaAdmin: z.number('Phải là số.').int().min(0, 'Số lượt phải lớn hơn hoặc bằng 0.'),
  aiQuotaGuest: z.number('Phải là số.').int().min(0, 'Số lượt phải lớn hơn hoặc bằng 0.'),
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
      <Alert variant="danger">{msg}</Alert>
    )
  }

  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-text-muted">Các thông số giới hạn và quy định chung của ứng dụng.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <SectionCard title="Quy định và Chính sách" icon={ShieldCheck}>
          <FormField label="Phiên bản chính sách bảo mật" error={errors.policyVersion?.message}>
            <Input
              type="number"
              {...register('policyVersion', { valueAsNumber: true })}
              className="md:max-w-[200px]"
            />
          </FormField>
          {isPolicyChanged && (
            <div className="mt-2 rounded-field bg-warning-bg p-3 text-sm font-semibold text-warning">
              Lưu ý: Mọi tài khoản sẽ phải đồng ý lại chính sách bảo mật vì phiên bản đã thay đổi.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Giới hạn AI" icon={Sparkles}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Lượt AI của User (mỗi ngày)" error={errors.aiQuotaUser?.message}>
              <Input
                type="number"
                {...register('aiQuotaUser', { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Lượt AI của Admin (mỗi ngày)" error={errors.aiQuotaAdmin?.message}>
              <Input
                type="number"
                {...register('aiQuotaAdmin', { valueAsNumber: true })}
              />
            </FormField>
            <FormField
              label="Lượt AI của khách (mỗi ngày)"
              hint="Áp dụng cho khách chưa đăng nhập và tài khoản chưa duyệt, tính theo thiết bị. Nhập 0 để tắt Trợ lý với khách."
              error={errors.aiQuotaGuest?.message}
            >
              <Input
                type="number"
                {...register('aiQuotaGuest', { valueAsNumber: true })}
              />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard title="Dung lượng lưu trữ" icon={HardDrive}>
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
        </SectionCard>

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

        <StickyActions>
          <Button
            type="button"
            variant="secondary"
            disabled={!isDirty || updateSettings.isPending}
            onClick={() => reset(settings)}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={!isDirty || updateSettings.isPending}>
            {updateSettings.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </StickyActions>
      </form>
    </div>
  )
}
