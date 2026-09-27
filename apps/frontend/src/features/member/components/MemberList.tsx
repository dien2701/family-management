import { Link } from 'react-router'
import { Users } from 'lucide-react'
import type { MemberSummary } from '@/types/api'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/shared/Badge'
import { Pagination } from '@/components/shared/Pagination'
import { memberStrings } from '../strings'

type MemberListProps = {
  members: MemberSummary[]
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  isError?: boolean
  isFiltered?: boolean
}

function MemberCard({ member }: { member: MemberSummary }) {
  return (
    <Link
      to={`/thanh-vien/${member.id}`}
      className="block rounded-card border border-border bg-surface p-4 shadow-card hover:border-accent transition-colors focus-visible:outline-accent"
    >
      <div className="flex gap-4">
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt="" className="size-12 rounded-full object-cover" />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-fg font-semibold text-lg">
            {member.fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-text">{member.fullName}</h3>
            {member.isDeceased && (
              <Badge tone="warning">Đã mất</Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-muted">
            {member.birthYear && <span>Sinh: {member.birthYear}</span>}
            {member.deathYear && <span>Mất: {member.deathYear}</span>}
            {member.generation && <span>Đời: {member.generation}</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}

function MemberTable({ members }: { members: MemberSummary[] }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card hidden md:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-muted text-text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Họ tên</th>
            <th className="px-4 py-3 font-semibold">Đời</th>
            <th className="px-4 py-3 font-semibold">Sinh</th>
            <th className="px-4 py-3 font-semibold">Mất</th>
            <th className="px-4 py-3 font-semibold">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-surface-muted transition-colors">
              <td className="px-4 py-3">
                <Link to={`/thanh-vien/${m.id}`} className="flex items-center gap-3 hover:text-accent-text focus-visible:outline-accent">
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-fg font-medium text-xs">
                      {m.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-text">{m.fullName}</span>
                </Link>
              </td>
              <td className="px-4 py-3">{m.generation || '-'}</td>
              <td className="px-4 py-3">{m.birthYear || '-'}</td>
              <td className="px-4 py-3">{m.deathYear || '-'}</td>
              <td className="px-4 py-3">
                {m.isDeceased ? <Badge tone="warning">Đã mất</Badge> : <Badge tone="success">Còn sống</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function MemberList({
  members,
  totalPages,
  currentPage,
  onPageChange,
  isLoading,
  isError,
  isFiltered,
}: MemberListProps) {
  const { list: str } = memberStrings

  if (isError) {
    return <EmptyState icon={Users} title="Đã có lỗi xảy ra" description="Không thể tải danh sách thành viên." />
  }

  if (isLoading) {
    return <div className="py-12 text-center text-text-muted animate-pulse">Đang tải...</div>
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={isFiltered ? str.emptyState.noMatchTitle : str.emptyState.noDataTitle}
        description={isFiltered ? str.emptyState.noMatchDesc : str.emptyState.noDataDesc}
      />
    )
  }

  const paginationLabels = {
    nav: 'Phân trang thành viên',
    previous: 'Trang trước',
    next: 'Trang sau',
    position: (page: number, total: number) => `Trang ${page} / ${total}`,
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile list */}
      <div className="flex flex-col gap-3 md:hidden">
        {members.map(m => <MemberCard key={m.id} member={m} />)}
      </div>

      {/* Desktop table */}
      <MemberTable members={members} />

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={currentPage} totalPages={totalPages} onChange={onPageChange} labels={paginationLabels} />
        </div>
      )}
    </div>
  )
}
