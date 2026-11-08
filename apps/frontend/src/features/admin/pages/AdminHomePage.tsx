import { FileCheck, Link2, Settings, Trash2, Users } from 'lucide-react'
import { IconTile } from '@/components/shared/IconTile'
import { SectionCard } from '@/components/shared/SectionCard'
import { useAuth } from '@/hooks/useAuth'
import { usePendingProposalsCount } from '../../proposal/hooks'
import { usePendingLinkRequests, useWaitingCount } from '../hooks'
import { adminStrings as s } from '../strings'

// `/quan-tri`: trang vào khu Quản trị, lưới ô lối tắt 4 cột kèm số việc đang chờ (DESIGN §9)
export function AdminHomePage() {
  const { user } = useAuth()
  const approvalRequired = user?.approvalRequired !== false
  const waiting = useWaitingCount()
  const linkRequests = usePendingLinkRequests()
  const proposals = usePendingProposalsCount()
  const waitingLabel = (n: number) => `${n} việc đang chờ`

  return (
    <SectionCard title={s.menu} className="mx-auto w-full max-w-3xl">
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        <IconTile
          to="/quan-tri/tai-khoan"
          icon={Users}
          label={s.nav.accounts}
          count={approvalRequired ? waiting.data : undefined}
          countLabel={waitingLabel}
        />
        <IconTile
          to="/quan-tri/yeu-cau-lien-ket"
          icon={Link2}
          label={s.nav.linkRequests}
          count={linkRequests.data?.length}
          countLabel={waitingLabel}
        />
        <IconTile
          to="/quan-tri/de-xuat"
          icon={FileCheck}
          label={s.nav.proposals}
          count={proposals.data}
          countLabel={waitingLabel}
        />
        <IconTile to="/quan-tri/da-xoa" icon={Trash2} label={s.nav.deleted} />
        <IconTile to="/quan-tri/cau-hinh" icon={Settings} label={s.nav.settings} />
      </div>
    </SectionCard>
  )
}
