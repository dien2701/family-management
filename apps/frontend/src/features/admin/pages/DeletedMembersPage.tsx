import { Trash2, UserX } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/shared/Alert'
import { EmptyState } from '@/components/shared/EmptyState'
import { ListGroup, ListRow } from '@/components/shared/ListRow'
import { Pagination } from '@/components/shared/Pagination'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utils/date'
import { useDeletedMembers } from '../hooks'
import { DeletedMemberSnapshotDialog } from '../components/DeletedMemberSnapshotDialog'

const SIZE = 20

// Quản trị > Thành viên đã xóa: điện thoại là danh sách dòng bấm được, máy tính là bảng (DESIGN §6, §9)
export function DeletedMembersPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, isError } = useDeletedMembers(page, SIZE)
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null)

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">Đang tải...</div>
  }

  if (isError) {
    return <Alert variant="danger">Có lỗi khi tải danh sách đã xóa.</Alert>
  }

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-muted">Xem lại thông tin hồ sơ và tệp đính kèm của thành viên đã bị xóa.</p>

      {items.length === 0 ? (
        <EmptyState icon={Trash2} title="Chưa có thành viên nào bị xóa." />
      ) : (
        <>
          <SectionCard title="Hồ sơ đã xóa" icon={Trash2}>
            <ListGroup className="md:hidden">
              {items.map((item) => (
                <ListRow
                  key={item.auditId}
                  leading={
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-field bg-secondary text-secondary-fg">
                      <UserX className="size-5" aria-hidden="true" />
                    </span>
                  }
                  label={<span className="[overflow-wrap:anywhere]">{item.fullName}</span>}
                  description={`Xóa bởi ${item.deletedBy} · ${formatDateTime(item.deletedAt)}`}
                  onClick={() => setSelectedAuditId(item.auditId)}
                />
              ))}
            </ListGroup>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <caption className="sr-only">Danh sách thành viên đã xóa</caption>
                <thead className="bg-surface-muted text-sm font-semibold text-text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Họ tên</th>
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Người xóa</th>
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Thời gian xóa</th>
                    <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.auditId} className="border-t border-border even:bg-surface-muted">
                      <td className="px-4 py-3 font-medium">{item.fullName}</td>
                      <td className="px-4 py-3 text-text-muted">{item.deletedBy}</td>
                      <td className="px-4 py-3 text-text-muted tabular-nums">{formatDateTime(item.deletedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          aria-label={`Xem chi tiết ${item.fullName}`}
                          onClick={() => setSelectedAuditId(item.auditId)}
                        >
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {selectedAuditId !== null && (
        <DeletedMemberSnapshotDialog auditId={selectedAuditId} onClose={() => setSelectedAuditId(null)} />
      )}
    </div>
  )
}
