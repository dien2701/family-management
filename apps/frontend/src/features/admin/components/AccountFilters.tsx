import { Search } from 'lucide-react'
import { FormField } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { STATUS_FILTERS, isRoleFilter, isStatusFilter, type StatusFilter } from '../accountRules'
import { adminStrings as s } from '../strings'

type AccountFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  /** Chỉ tab Tất cả có lọc trạng thái và vai trò; tab Chờ duyệt đã cố định trạng thái. */
  showFilters: boolean
  status: StatusFilter | undefined
  role: 'ADMIN' | 'USER' | undefined
  onStatusChange: (value: StatusFilter | undefined) => void
  onRoleChange: (value: 'ADMIN' | 'USER' | undefined) => void
}

export function AccountFilters({
  search,
  onSearchChange,
  showFilters,
  status,
  role,
  onStatusChange,
  onRoleChange,
}: AccountFiltersProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start">
      <div className="md:flex-1">
        <FormField label={s.accounts.search}>
          <SearchInput value={search} onChange={onSearchChange} />
        </FormField>
      </div>
      {showFilters && (
        <>
          <div className="md:w-48">
            <FormField label={s.accounts.statusFilter}>
              <Select
                value={status ?? ''}
                onChange={(e) =>
                  onStatusChange(isStatusFilter(e.target.value) ? e.target.value : undefined)
                }
              >
                <option value="">{s.accounts.allOption}</option>
                {STATUS_FILTERS.map((value) => (
                  <option key={value} value={value}>
                    {s.status[value.toLowerCase() as keyof typeof s.status]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="md:w-40">
            <FormField label={s.accounts.roleFilter}>
              <Select
                value={role ?? ''}
                onChange={(e) =>
                  onRoleChange(isRoleFilter(e.target.value) ? e.target.value : undefined)
                }
              >
                <option value="">{s.accounts.allOption}</option>
                <option value="ADMIN">{s.role.ADMIN}</option>
                <option value="USER">{s.role.USER}</option>
              </Select>
            </FormField>
          </div>
        </>
      )}
    </div>
  )
}

// FormField gắn id/invalid/aria-describedby vào phần tử con trực tiếp, nên ô tìm có icon là một
// component riêng chuyển các prop đó xuống <Input>.
function SearchInput({
  value,
  onChange,
  ...rest
}: {
  value: string
  onChange: (value: string) => void
  id?: string
  invalid?: boolean
  'aria-describedby'?: string
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
      <Input
        {...rest}
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder={s.accounts.searchPlaceholder}
        className="pl-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
