import { formatDateTime } from '@/utils/date'
import { useSearchParams } from 'react-router'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { Button } from '@/components/ui/button'
import { useMyProposals } from '../hooks'

export function MyProposalsPage() {
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') || '1', 10)
  const size = 10

  const { data, isPending, isError, refetch } = useMyProposals(page, size)

  const changePage = (p: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(p))
    setParams(next)
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Đề xuất của tôi</h1>
      
      {isPending ? (
        <p className="text-text-muted">Đang tải...</p>
      ) : isError ? (
        <EmptyState title="Không tải được danh sách đề xuất" action={<Button onClick={() => void refetch()}>Thử lại</Button>} />
      ) : data.items.length === 0 ? (
        <EmptyState title="Bạn chưa có đề xuất nào" description="Các đề xuất thay đổi lịch sẽ hiển thị tại đây." />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {data.items.map(p => (
              <div key={p.id} className="rounded-lg bg-surface p-4 border shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    {p.action === 'CREATE' ? 'Thêm mới sự kiện' : p.action === 'UPDATE' ? 'Sửa sự kiện' : 'Xóa sự kiện'}
                  </h3>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    p.status === 'PENDING' ? 'bg-warning/20 text-warning-fg' : 
                    p.status === 'APPROVED' ? 'bg-primary/20 text-primary-fg' : 
                    'bg-danger/20 text-danger-fg'
                  }`}>
                    {p.status === 'PENDING' ? 'Chờ duyệt' : p.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                  </span>
                </div>
                {typeof p.payload?.title === 'string' && (
                  <p className="mt-1 font-medium">{p.payload.title}</p>
                )}
                {p.note && p.status === 'REJECTED' && (
                  <p className="mt-2 text-danger">Lý do từ chối: {p.note}</p>
                )}
                <p className="mt-4 text-xs text-text-muted">
                  Gửi lúc {formatDateTime(p.createdAt)}
                </p>
              </div>
            ))}
          </div>
          
          <Pagination
            page={page - 1}
            totalPages={data.totalPages}
            onChange={(p) => changePage(p + 1)}
          />
        </>
      )}
    </div>
  )
}
