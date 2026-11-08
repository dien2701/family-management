import { formatDateTime } from '@/utils/date'
import { useSearchParams, useNavigate } from 'react-router'
import { Bell, BellDot, Check, Settings } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ListGroup, ListRow } from '@/components/shared/ListRow'
import { Pagination } from '@/components/shared/Pagination'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Thông báo</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => void readAll.mutateAsync()} disabled={isPending || data?.items.length === 0}>
            <Check aria-hidden="true" /> Đã đọc tất cả
          </Button>
          <Button variant="secondary" onClick={() => void navigate('/thong-bao/cai-dat')}>
            <Settings aria-hidden="true" /> Cài đặt
          </Button>
        </div>
      </div>

      {isPending ? (
        <p className="text-text-muted">Đang tải...</p>
      ) : isError ? (
        <EmptyState title="Không tải được thông báo" action={<Button onClick={() => void refetch()}>Thử lại</Button>} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Bell} title="Không có thông báo nào" description="Bạn sẽ thấy các thông báo mới ở đây." />
      ) : (
        <>
          <SectionCard title="Mới nhất" icon={Bell}>
            <ListGroup>
              {data.items.map((n) => (
                <ListRow
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) read.mutate(n.id)
                    if (n.link) void navigate(n.link)
                  }}
                  leading={
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center self-start rounded-field',
                        n.isRead ? 'bg-surface-muted text-text-muted' : 'bg-secondary text-primary',
                      )}
                    >
                      {n.isRead ? <Bell className="size-5" aria-hidden="true" /> : <BellDot className="size-5" aria-hidden="true" />}
                    </span>
                  }
                  label={
                    <span className={n.isRead ? undefined : 'font-semibold text-primary'}>
                      {!n.isRead && <span className="sr-only">Chưa đọc: </span>}
                      {n.title}
                    </span>
                  }
                  description={
                    <>
                      <span className="block whitespace-pre-line">{n.body}</span>
                      <span className="mt-1 block tabular-nums">{formatDateTime(n.createdAt).slice(0, -5)}</span>
                    </>
                  }
                />
              ))}
            </ListGroup>
          </SectionCard>

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
