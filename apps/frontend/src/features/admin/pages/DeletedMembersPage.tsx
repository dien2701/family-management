import { formatDateTime } from '@/utils/date'
import { useState } from 'react'
import { Alert } from '@/components/shared/Alert'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { Button } from '@/components/ui/button'
import { useDeletedMembers } from '../hooks'
import { DeletedMemberSnapshotDialog } from '../components/DeletedMemberSnapshotDialog'

export function DeletedMembersPage() {
  const [page, setPage] = useState(0)
  const size = 20

  const { data, isLoading, isError } = useDeletedMembers(page, size)
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null)

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">Đang tải...</div>
  }

  if (isError) {
    return (
      <div className="flex justify-center p-8">
        <Alert variant="danger">Có lỗi khi tải danh sách đã xóa.</Alert>
      </div>
    )
  }

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text">Thành viên đã xóa</h1>
        <p className="text-text-muted">Xem lại thông tin hồ sơ và tệp đính kèm của thành viên đã bị xóa.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Chưa có thành viên nào bị xóa." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Họ tên</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Người xóa</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Thời gian xóa</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.auditId} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text">{item.fullName}</td>
                    <td className="px-4 py-3 text-text-muted">{item.deletedBy}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {formatDateTime(item.deletedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" onClick={() => setSelectedAuditId(item.auditId)}>
                        Xem chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      {selectedAuditId !== null && (
        <DeletedMemberSnapshotDialog
          auditId={selectedAuditId}
          onClose={() => setSelectedAuditId(null)}
        />
      )}
    </div>
  )
}
