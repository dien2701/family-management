import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight, UserCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Link } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { Badge } from '@/components/shared/Badge'
import { FormField } from '@/components/shared/FormField'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/features/auth/components/LogoutButton'
import { useChangePassword } from '@/features/auth/hooks'
import { changePasswordSchema } from '@/features/auth/schemas'
import { useLinkedMember } from '@/features/link/hooks'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/client'
import { initialOf } from '@/utils/text'

type PasswordForm = z.infer<typeof changePasswordSchema>

const STATUS_TEXT = { ACTIVE: 'Đang hoạt động', PENDING: 'Chờ xác thực', LOCKED: 'Đã khóa' } as const

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card md:p-6"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className="min-w-0 font-medium break-words">{children}</dd>
    </div>
  )
}

function changeErrorText(error: unknown): string | null {
  if (!error) return null
  if (error instanceof ApiError) {
    if (error.status === 409) return 'Tài khoản này đăng nhập bằng Google nên chưa có mật khẩu để đổi.'
    if (error.status === 400 || error.status === 401) return error.message
  }
  return 'Không đổi được mật khẩu, vui lòng thử lại.'
}

function ChangePasswordCard() {
  const change = useChangePassword()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(changePasswordSchema) })

  const submit = handleSubmit((values) => {
    change.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess: () => reset() },
    )
  })
  const errorText = changeErrorText(change.error)

  return (
    <Card title="Đổi mật khẩu">
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
        {change.isSuccess && <Alert variant="success">Đã đổi mật khẩu.</Alert>}
        {errorText && <Alert>{errorText}</Alert>}
        <FormField label="Mật khẩu hiện tại" error={errors.currentPassword?.message}>
          <PasswordInput autoComplete="current-password" {...register('currentPassword')} />
        </FormField>
        <FormField label="Mật khẩu mới" hint="Từ 8 đến 72 ký tự." error={errors.newPassword?.message}>
          <PasswordInput autoComplete="new-password" {...register('newPassword')} />
        </FormField>
        <FormField label="Nhập lại mật khẩu mới" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...register('confirmPassword')} />
        </FormField>
        <Button type="submit" loading={change.isPending} className="w-full sm:w-auto sm:self-start">
          Đổi mật khẩu
        </Button>
      </form>
    </Card>
  )
}

/** Hồ sơ cá nhân của TÀI KHOẢN đang đăng nhập (khác hồ sơ thành viên ở trang Thành viên). */
export function ProfilePage() {
  const { user } = useAuth()
  const memberId = user?.memberId ?? undefined
  const member = useLinkedMember(memberId)
  if (!user) return null

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Card title="Thông tin tài khoản">
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl font-semibold text-secondary-fg">
            {initialOf(user.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xl leading-tight font-bold">{user.fullName}</p>
            <p className="truncate text-text-muted">{user.email}</p>
          </div>
        </div>
        <dl className="flex flex-col gap-3 border-t border-border pt-4">
          <Row label="Vai trò">
            <Badge>{user.systemRole === 'ADMIN' ? 'Admin' : 'User'}</Badge>
          </Row>
          <Row label="Trạng thái">
            <Badge tone={user.status === 'ACTIVE' ? 'success' : 'warning'}>
              {user.status ? STATUS_TEXT[user.status] : '—'}
            </Badge>
          </Row>
        </dl>
      </Card>

      <Card title="Liên kết với thành viên">
        <Link
          to="/them/toi-la-ai"
          className="flex min-h-14 items-center gap-3 rounded-field border border-border p-3 transition-colors hover:bg-surface-muted"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-fg">
            <UserCheck className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">
              {memberId == null ? 'Chưa liên kết' : (member.data?.fullName ?? 'Đang tải…')}
            </span>
            <span className="block text-sm text-text-muted">
              {memberId == null
                ? 'Gửi yêu cầu "Đây là tôi" để tự sửa hồ sơ của mình'
                : 'Xem, sửa hoặc hủy liên kết'}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
        </Link>
      </Card>

      <ChangePasswordCard />

      <LogoutButton className="w-full sm:w-auto" />
    </div>
  )
}
