import { formatDateTime } from '@/utils/date'
import { useSearchParams, useNavigate } from 'react-router'
import { Check, Settings } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { Button } from '@/components/ui/button'
import { useNotifications, useReadAllNotifications, useReadNotification } from '../hooks'

export function InboxPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') || '1', 10)
  const size = 15

  const { data, isPending, isError, refetch } = useNotifications(page, size)
  const readAll = useReadAllNotifications()
  const read = useReadNotification()

  const changePage = (p: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(p))
    setParams(next)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Thông báo</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void readAll.mutateAsync()} disabled={isPending || data?.items.length === 0}>
            <Check className="w-4 h-4 mr-2" /> Đã đọc tất cả
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/notifications/settings')}>
            <Settings className="w-4 h-4 mr-2" /> Cài đặt
          </Button>
        </div>
      </div>
      
      {isPending ? (
        <p className="text-text-muted">Đang tải...</p>
      ) : isError ? (
        <EmptyState title="Không tải được thông báo" action={<Button onClick={() => void refetch()}>Thử lại</Button>} />
      ) : data.items.length === 0 ? (
        <EmptyState title="Không có thông báo nào" description="Bạn sẽ thấy các thông báo mới ở đây." />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {data.items.map(n => (
              <div 
                key={n.id} 
                className={`flex flex-col gap-1 p-4 rounded-lg border cursor-pointer transition-colors ${
                  n.isRead ? 'bg-surface hover:bg-surface-muted border-border' : 'bg-primary/5 hover:bg-primary/10 border-primary/20'
                }`}
                onClick={() => {
                  if (!n.isRead) read.mutate(n.id)
                  if (n.link) navigate(n.link)
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className={`text-base ${n.isRead ? 'font-medium text-foreground' : 'font-semibold text-primary'}`}>{n.title}</h3>
                  <span className="text-xs text-text-muted whitespace-nowrap">{formatDateTime(n.createdAt).slice(0, -5)}</span>
                </div>
                <p className="text-sm text-text-muted mt-1">{n.body}</p>
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
