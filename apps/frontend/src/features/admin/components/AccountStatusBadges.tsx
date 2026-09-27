import { Badge } from '@/components/shared/Badge'
import type { AccountAdmin } from '@/types/api'
import { displayStatusOf, type AccountDisplayStatus } from '../accountRules'
import { adminStrings as s } from '../strings'

const STATUS_TONE: Record<AccountDisplayStatus, 'success' | 'warning' | 'danger'> = {
  waiting: 'warning',
  approved: 'success',
  rejected: 'danger',
  locked: 'danger',
}

export function AccountStatusBadge({ account }: { account: AccountAdmin }) {
  const status = displayStatusOf(account)
  return <Badge tone={STATUS_TONE[status]}>{s.status[status]}</Badge>
}

export function AccountRoleBadge({ account }: { account: AccountAdmin }) {
  const role = account.systemRole ?? 'USER'
  return <Badge>{s.role[role]}</Badge>
}
