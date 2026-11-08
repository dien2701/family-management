import { zodResolver } from '@hookform/resolvers/zod'
import {
  ImageIcon,
  KeyRound,
  Link2,
  Trash2,
  UserCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Alert } from '@/components/shared/Alert'
import { AvatarUpload } from '@/components/shared/AvatarUpload'
import { Badge } from '@/components/shared/Badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FormField } from '@/components/shared/FormField'
import { ListGroup, ListRow } from '@/components/shared/ListRow'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { SectionCard } from '@/components/shared/SectionCard'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/features/auth/components/LogoutButton'
import { useChangePassword } from '@/features/auth/hooks'
import { changePasswordSchema } from '@/features/auth/schemas'
import { useLinkedMember } from '@/features/link/hooks'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/client'
import { useRemoveMyAvatar, useUploadMyAvatar } from '../hooks'

type PasswordForm = z.infer<typeof changePasswordSchema>

const STATUS_TEXT = {
  ACTIVE: 'Đang hoạt động',
  PENDING: 'Chờ xác thực',
  LOCKED: 'Đã khóa',
} as const

function Card({ title, icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <SectionCard title={title} icon={icon}>
      <div className="flex flex-col gap-4">{children}</div>
    </SectionCard>
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
    if (error.status === 409)
      return 'Tài khoản này đăng nhập bằng Google nên chưa có mật khẩu để đổi.'
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
    <Card title="Đổi mật khẩu" icon={KeyRound}>
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
        {change.isSuccess && <Alert variant="success">Đã đổi mật khẩu.</Alert>}
        {errorText && <Alert>{errorText}</Alert>}
        <FormField label="Mật khẩu hiện tại" error={errors.currentPassword?.message}>
          <PasswordInput autoComplete="current-password" {...register('currentPassword')} />
        </FormField>
        <FormField
          label="Mật khẩu mới"
          hint="Từ 8 đến 72 ký tự."
          error={errors.newPassword?.message}
        >
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

function avatarErrorText(error: unknown): string | null {
  if (!error) return null
  if (error instanceof ApiError) return error.message
  return 'Không xử lý được ảnh này, vui lòng chọn ảnh khác hoặc thử lại.'
}

/** Ảnh riêng của tài khoản (độc lập với ảnh thành viên): chọn, xem trước, rồi bấm Lưu mới tải lên. */
function AvatarCard() {
  const { user } = useAuth()
  const upload = useUploadMyAvatar()
  const remove = useRemoveMyAvatar()
  const [file, setFile] = useState<File | null>(null)
  const [askRemove, setAskRemove] = useState(false)
  if (!user) return null

  const errorText = avatarErrorText(upload.error ?? remove.error)
  const busy = upload.isPending || remove.isPending

  return (
    <Card title="Ảnh đại diện" icon={ImageIcon}>
      {errorText && <Alert>{errorText}</Alert>}
      {/* key theo ảnh hiện tại: lưu hoặc gỡ xong thì component chọn ảnh làm lại từ đầu */}
      <AvatarUpload
        key={user.avatarUrl ?? 'none'}
        label={file ? 'Ảnh mới (chưa lưu)' : 'Ảnh hiện tại'}
        name={user.fullName ?? ''}
        currentUrl={user.avatarUrl}
        file={file}
        onChange={setFile}
        disabled={busy}
        hint="JPG, PNG hoặc WebP. Ảnh được cắt vuông ở giữa và thu nhỏ trước khi tải lên."
        labels={{
          choose: 'Chọn ảnh',
          change: 'Đổi ảnh',
          clear: 'Bỏ ảnh đã chọn',
          badType: 'Chỉ nhận ảnh JPG, PNG hoặc WebP.',
          tooBig: 'Ảnh quá lớn, tối đa 10 MB. Hãy chọn ảnh nhỏ hơn.',
        }}
      />
      <div className="flex flex-wrap gap-2">
        {file && (
          <Button
            type="button"
            loading={upload.isPending}
            disabled={busy}
            onClick={() => upload.mutate(file, { onSuccess: () => setFile(null) })}
          >
            Lưu ảnh
          </Button>
        )}
        {!file && user.avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            className="text-danger"
            loading={remove.isPending}
            disabled={busy}
            onClick={() => {
              remove.reset()
              setAskRemove(true)
            }}
          >
            <Trash2 aria-hidden="true" />
            Gỡ ảnh
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={askRemove}
        title="Gỡ ảnh đại diện?"
        description="Ảnh hiện tại của tài khoản sẽ bị gỡ."
        confirmLabel="Gỡ ảnh"
        cancelLabel="Hủy"
        danger
        loading={remove.isPending}
        error={remove.error ? avatarErrorText(remove.error) : null}
        onConfirm={() => remove.mutate(undefined, { onSuccess: () => setAskRemove(false) })}
        onCancel={() => setAskRemove(false)}
      />
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
      <Card title="Thông tin tài khoản" icon={UserRound}>
        <div className="flex items-center gap-4">
          <UserAvatar url={user.avatarUrl} name={user.fullName} className="size-16 text-2xl" />
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

      <AvatarCard />

      <SectionCard title="Liên kết với thành viên" icon={Link2}>
        <ListGroup>
          <ListRow
            to="/them/toi-la-ai"
            icon={UserCheck}
            label={memberId == null ? 'Chưa liên kết' : (member.data?.fullName ?? 'Đang tải…')}
            description={
              memberId == null
                ? 'Gửi yêu cầu "Đây là tôi" để tự sửa hồ sơ của mình'
                : 'Xem, sửa hoặc hủy liên kết'
            }
          />
        </ListGroup>
      </SectionCard>

      <ChangePasswordCard />

      <LogoutButton className="w-full sm:w-auto" />
    </div>
  )
}
