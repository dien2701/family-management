import { MapPin } from 'lucide-react'
import { Alert } from '@/components/shared/Alert'
import { FullPageSpinner } from '@/components/shared/FullPageSpinner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/date'
import { AccountsSection } from '../components/AccountsSection'
import { InvitationsSection } from '../components/InvitationsSection'
import { LeaveSection } from '../components/LeaveSection'
import { useFamily } from '../hooks'
import { familyStrings as s } from '../strings'

export function FamilyPage() {
  const { user } = useAuth()
  const { data: family, isPending, isError, refetch } = useFamily()

  if (isPending) return <FullPageSpinner />
  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert className="w-full">{s.page.loadFailed}</Alert>
        <Button variant="secondary" onClick={() => void refetch()}>
          {s.page.retry}
        </Button>
      </div>
    )
  }

  const accounts = family.accounts ?? []
  // Vai trò lấy từ danh sách (đọc từ DB) chứ không từ claim, vì claim có thể cũ tới 15 phút
  const isManager = accounts.some((a) => a.id === user?.id && a.familyRole === 'MANAGER')

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <section
        aria-labelledby="family-name"
        className="rounded-card bg-primary p-4 text-primary-fg shadow-card md:p-6"
      >
        <p className="text-sm font-medium opacity-90">{s.page.infoTitle}</p>
        <h2 id="family-name" className="mt-1 text-xl leading-tight font-bold md:text-2xl">
          {family.name}
        </h2>
        {family.originPlace && (
          <p className="mt-3 flex items-center gap-2">
            <MapPin className="size-5 shrink-0" aria-hidden="true" />
            <span>
              <span className="sr-only">{s.page.originPlace}: </span>
              {family.originPlace}
            </span>
          </p>
        )}
        <p className="mt-3 whitespace-pre-line">{family.description || s.page.noDescription}</p>
        <p className="mt-3 text-sm opacity-90">
          {s.page.createdAt}: {formatDate(family.createdAt)}
        </p>
      </section>

      <AccountsSection accounts={accounts} currentUserId={user?.id} isManager={isManager} />
      {isManager && <InvitationsSection familyName={family.name ?? ''} />}
      <LeaveSection isManager={isManager} />
    </div>
  )
}
