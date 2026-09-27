import { AlertCircle, Lock } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { EmptyState } from '@/components/shared/EmptyState'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'
import { useAuth } from '@/hooks/useAuth'
import { useMe } from '@/hooks/useMe'
import { ApiError } from '@/services/client'
import type { MemberInput } from '@/types/api'
import { MemberForm } from '../components/MemberForm'
import { useCreateMember, useMemberDetail, useUpdateMember, useUploadAvatar } from '../hooks'
import { memberStrings } from '../strings'

/**
 * Trang thêm (`/thanh-vien/them`, chỉ Admin) và sửa (`/thanh-vien/:id/sua`) hồ sơ. Sửa: Admin sửa mọi hồ sơ;
 * User chỉ sửa hồ sơ của chính mình và nhóm "đã mất" bị khóa (DECISIONS #76). Quyền thật do máy chủ kiểm.
 */
export function MemberFormPage() {
  const { id } = useParams()
  const editing = id !== undefined
  const memberId = Number(id)
  const navigate = useNavigate()
  const { form: s } = memberStrings

  // Khi thêm mới thì không có hồ sơ để tải (id không hợp lệ nên query tắt hẳn ở hook bên dưới)
  const detail = useMemberDetail(editing ? memberId : 0, editing)
  const createMember = useCreateMember()
  const updateMember = useUpdateMember()
  const uploadAvatar = useUploadAvatar()
  const isAdmin = useAuth().user?.systemRole === 'ADMIN'
  const me = useMe()

  const save = async (input: MemberInput, avatar: File | null) => {
    const saved = editing
      ? await updateMember.mutateAsync({ id: memberId, input })
      : await createMember.mutateAsync(input)

    // Hồ sơ đã lưu rồi thì lỗi tải ảnh không được chặn việc quay về trang chi tiết
    let notice: string | undefined
    if (avatar) {
      try {
        await uploadAvatar.mutateAsync({ memberId: saved.id, file: avatar })
      } catch (error) {
        const reason = error instanceof ApiError ? error.message : 'Có lỗi xảy ra.'
        notice = s.avatarFailed(reason)
      }
    }
    void navigate(`/thanh-vien/${saved.id}`, { replace: true, state: notice ? { notice } : null })
  }

  if (editing && !isAdmin) {
    if (me.isPending) return <FullPageSpinner />
    if (me.data?.memberId !== memberId) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-12">
          <EmptyState icon={Lock} title={s.forbidden} description={s.forbiddenDesc} />
        </div>
      )
    }
  }
  if (editing && detail.isLoading) return <FullPageSpinner />
  if (editing && (detail.isError || !detail.data)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <EmptyState icon={AlertCircle} title={s.notFound} description={s.notFoundDesc} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8">
      <MemberForm
        member={detail.data}
        lockDeathFields={!isAdmin}
        submitLabel={editing ? s.editSubmit : s.createSubmit}
        onSubmit={save}
        onCancel={() => void navigate(-1)}
      />
    </div>
  )
}
