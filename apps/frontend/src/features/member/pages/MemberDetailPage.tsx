import { useState } from 'react'
import { AlertCircle, Pencil, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useMe } from '@/hooks/useMe'
import { ApiError } from '@/services/client'
import { useDeleteMember, useMemberDetail } from '../hooks'
import { MemberProfileCard } from '../components/MemberProfileCard'
import { RelativesSection } from '../components/RelativesSection'
import { TreeSection } from '../components/TreeSection'
import { memberStrings } from '../strings'
import { AttachmentsSection } from '@/features/files/components/AttachmentsSection'

export function MemberDetailPage() {
  const { id } = useParams()
  const memberId = Number(id)
  const navigate = useNavigate()
  const { data: member, isLoading, isError } = useMemberDetail(memberId)
  const deleteMember = useDeleteMember()
  const isAdmin = useAuth().user?.systemRole === 'ADMIN'
  // Hồ sơ của chính mình: tài khoản đã liên kết "Tôi là ai" với thành viên này (DECISIONS #76)
  const isSelf = useMe().data?.memberId === memberId
  const [confirming, setConfirming] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // Thông báo từ trang form (ví dụ lưu được hồ sơ nhưng chưa tải được ảnh)
  const notice = (useLocation().state as { notice?: string } | null)?.notice

  const { detail: str, remove } = memberStrings

  if (isLoading) return <FullPageSpinner />
  
  if (isError || !member) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <EmptyState 
          icon={AlertCircle} 
          title="Không tìm thấy thành viên" 
          description="Người này có thể đã bị xóa hoặc không tồn tại." 
        />
      </div>
    )
  }

  const closeDialog = () => {
    setConfirming(false)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    setDeleteError(null)
    try {
      await deleteMember.mutateAsync(member.id)
      void navigate('/thanh-vien', { replace: true })
    } catch (error) {
      setDeleteError(
        error instanceof ApiError && error.code === 'MEMBER_ON_TREE'
          ? remove.onTree
          : error instanceof ApiError
            ? error.message
            : 'Có lỗi xảy ra, vui lòng thử lại.',
      )
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8 space-y-6">
      {notice && <Alert variant="info">{notice}</Alert>}

      {(isAdmin || isSelf) && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="secondary">
            <Link to={`/thanh-vien/${member.id}/sua`}>
              <Pencil aria-hidden="true" />
              {isAdmin ? memberStrings.actions.edit : memberStrings.actions.editMine}
            </Link>
          </Button>
          {isAdmin && (
            <Button variant="danger" onClick={() => setConfirming(true)}>
              <Trash2 aria-hidden="true" />
              {memberStrings.actions.remove}
            </Button>
          )}
        </div>
      )}

      <MemberProfileCard member={member} isSelf={isSelf} />

      {member.biography && (
        <section className="rounded-card border border-border bg-surface p-4 shadow-card md:p-6">
          <h2 className="font-semibold text-lg">{str.biography}</h2>
          <p className="mt-2 whitespace-pre-line">{member.biography}</p>
        </section>
      )}
      
      <RelativesSection memberId={member.id} canEdit={isAdmin || isSelf} />

      <TreeSection memberId={member.id} isAdmin={isAdmin} />

      <AttachmentsSection memberId={member.id} canEdit={isAdmin || isSelf} />





      <ConfirmDialog
        open={confirming}
        danger
        title={remove.title}
        description={remove.description(member.fullName)}
        confirmLabel={remove.confirm}
        cancelLabel={remove.cancel}
        loading={deleteMember.isPending}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={closeDialog}
      />
    </div>
  )
}
