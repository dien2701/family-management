import { Hourglass, RefreshCw } from 'lucide-react'
import { Alert } from '@/components/shared/Alert'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { formatTime } from '@/utils/date'
import { ApprovalStatusCard } from '../components/ApprovalStatusCard'
import { ConsentForm } from '../components/ConsentForm'
import { LogoutButton } from '../components/LogoutButton'
import { useApprovalWatch } from '../hooks'
import { authStrings as s } from '../strings'

// `/cho-duyet`: tài khoản WAITING chỉ thấy trang này (IDEA §5). Tự kiểm tra lại, được duyệt thì guard đưa vào app.
export function WaitingApprovalPage() {
  const { user } = useAuth()
  const { refetch, isFetching, isError, dataUpdatedAt } = useApprovalWatch()

  return (
    <ApprovalStatusCard
      icon={Hourglass}
      tone="warning"
      title={s.waiting.title}
      description={s.waiting.description}
    >
      {user?.email && (
        <p className="truncate text-sm font-medium">{s.waiting.signedInAs(user.email)}</p>
      )}
      {user?.consentRequired && <ConsentForm />}
      {isError && <Alert>{s.waiting.checkFailed}</Alert>}
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="secondary"
          className="w-full"
          loading={isFetching}
          onClick={() => void refetch()}
        >
          <RefreshCw aria-hidden="true" />
          {s.waiting.checkNow}
        </Button>
        {dataUpdatedAt > 0 && (
          <p role="status" className="text-sm text-text-muted">
            {s.waiting.lastChecked(formatTime(dataUpdatedAt))}
          </p>
        )}
      </div>
      <LogoutButton className="w-full" />
    </ApprovalStatusCard>
  )
}
