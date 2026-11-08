import { Search } from 'lucide-react'
import { FilterBar } from '@/components/shared/FilterBar'
import { FilterChip } from '@/components/shared/FilterChip'
import { Input } from '@/components/ui/input'
import { STATUS_FILTERS, isRoleFilter, isStatusFilter, type StatusFilter } from '../accountRules'
import { adminStrings as s } from '../strings'

type AccountFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  /** Chỉ tab Tất cả có lọc trạng thái và vai trò; tab Chờ duyệt đã cố định trạng thái. */
  showFilters: boolean
  /** Tắt duyệt tài khoản thì không còn trạng thái Chờ duyệt để lọc. */
  hideWaitingOption?: boolean
  status: StatusFilter | undefined
  role: 'ADMIN' | 'USER' | undefined
  onStatusChange: (value: StatusFilter | undefined) => void
  onRoleChange: (value: 'ADMIN' | 'USER' | undefined) => void
}

const statusText = (value: StatusFilter) => s.status[value.toLowerCase() as keyof typeof s.status]

// Cùng kiểu thanh lọc của Thành viên và Sự kiện: ô tìm + chip chọn, gọn một hàng từ md
export function AccountFilters({
  search,
  onSearchChange,
  showFilters,
  hideWaitingOption = false,
  status,
  role,
  onStatusChange,
  onRoleChange,
}: AccountFiltersProps) {
  const searchBox = (
    <>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
      <Input
        type="search"
        inputMode="search"
        autoComplete="off"
        aria-label={s.accounts.search}
        placeholder={s.accounts.searchPlaceholder}
        className="pl-10"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </>
  )

  if (!showFilters) {
    return (
      <div className="rounded-card border border-border bg-surface p-3 shadow-card">
        <div className="relative">{searchBox}</div>
      </div>
    )
  }

  return (
    <FilterBar label={s.accounts.filtersLabel} search={searchBox}>
      <FilterChip
        widthClass="w-auto shrink-0 md:w-48"
        label={s.accounts.statusFilter}
        face={status ? statusText(status) : s.accounts.statusFilter}
        active={status !== undefined}
        value={status ?? ''}
        options={[
          { value: 'all', text: s.accounts.allOption },
          ...STATUS_FILTERS.filter((v) => !(hideWaitingOption && v === 'WAITING')).map((v) => ({
            value: v,
            text: statusText(v),
          })),
        ]}
        onChange={(v) => onStatusChange(isStatusFilter(v) ? v : undefined)}
      />
      <FilterChip
        widthClass="w-auto shrink-0 md:w-40"
        label={s.accounts.roleFilter}
        face={role ? s.role[role] : s.accounts.roleFilter}
        active={role !== undefined}
        value={role ?? ''}
        options={[
          { value: 'all', text: s.accounts.allOption },
          { value: 'ADMIN', text: s.role.ADMIN },
          { value: 'USER', text: s.role.USER },
        ]}
        onChange={(v) => onRoleChange(isRoleFilter(v) ? v : undefined)}
      />
    </FilterBar>
  )
}
