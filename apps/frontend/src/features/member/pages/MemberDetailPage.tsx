import { useParams } from 'react-router'
import { useMemberDetail } from '../hooks'
import { MemberProfileCard } from '../components/MemberProfileCard'
import { memberStrings } from '../strings'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { AlertCircle } from 'lucide-react'

export function MemberDetailPage() {
  const { id } = useParams()
  const memberId = Number(id)
  const { data: member, isLoading, isError } = useMemberDetail(memberId)
  
  const { detail: str } = memberStrings

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8 space-y-6">
      <MemberProfileCard member={member} />
      
      {/* Khối Đợt 13: Người thân */}
      <section className="rounded-card border border-border bg-surface p-4 shadow-card opacity-60">
        <h2 className="font-semibold text-lg">{str.sections.relatives}</h2>
        <p className="text-text-muted mt-2 text-sm">{str.comingSoon}</p>
      </section>

      {/* Khối Đợt 16: Trên cây */}
      <section className="rounded-card border border-border bg-surface p-4 shadow-card opacity-60">
        <h2 className="font-semibold text-lg">{str.sections.tree}</h2>
        <p className="text-text-muted mt-2 text-sm">{str.comingSoon}</p>
      </section>

      {/* Khối Đợt 22: Tệp đính kèm */}
      <section className="rounded-card border border-border bg-surface p-4 shadow-card opacity-60">
        <h2 className="font-semibold text-lg">{str.sections.attachments}</h2>
        <p className="text-text-muted mt-2 text-sm">{str.comingSoon}</p>
      </section>
    </div>
  )
}
