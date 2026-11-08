import { formatDateTime } from '@/utils/date'
import { CalendarCog, CalendarPlus, CalendarX, Send } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Badge } from '@/components/shared/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ListGroup, ListRow } from '@/components/shared/ListRow'
import { Pagination } from '@/components/shared/Pagination'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { useMyProposals } from '../hooks'

const ACTIONS = {
  CREATE: { label: 'Thêm mới sự kiện', icon: CalendarPlus },
  UPDATE: { label: 'Sửa sự kiện', icon: CalendarCog },
  DELETE: { label: 'Xóa sự kiện', icon: CalendarX },
} as const

const STATUS = {
  PENDING: { label: 'Chờ duyệt', tone: 'warning' },
  APPROVED: { label: 'Đã duyệt', tone: 'success' },
  REJECTED: { label: 'Từ chối', tone: 'danger' },
} as const

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Đề xuất của tôi</h1>

      {isPending ? (
        <p className="text-text-muted">Đang tải...</p>
      ) : isError ? (
        <EmptyState title="Không tải được danh sách đề xuất" action={<Button onClick={() => void refetch()}>Thử lại</Button>} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Send} title="Bạn chưa có đề xuất nào" description="Các đề xuất thay đổi lịch sẽ hiển thị tại đây." />
      ) : (
        <>
          <SectionCard title="Đã gửi" icon={Send}>
            <ListGroup>
              {data.items.map((p) => {
                const action = ACTIONS[p.action as keyof typeof ACTIONS] ?? ACTIONS.UPDATE
                const status = STATUS[p.status as keyof typeof STATUS] ?? STATUS.PENDING
                const title = typeof p.payload?.title === 'string' ? p.payload.title : null
                const Icon = action.icon
                return (
                  <ListRow
                    key={p.id}
                    leading={
                      <span className="flex size-10 shrink-0 items-center justify-center self-start rounded-field bg-secondary text-primary">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                    }
                    label={title ?? action.label}
                    description={
                      <>
                        {title && <span className="block">{action.label}</span>}
                        {p.note && p.status === 'REJECTED' && (
                          <span className="block text-danger">Lý do từ chối: {p.note}</span>
                        )}
                        <span className="block tabular-nums">Gửi lúc {formatDateTime(p.createdAt)}</span>
                      </>
                    }
                    trailing={<Badge tone={status.tone} className="self-start">{status.label}</Badge>}
                  />
                )
              })}
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
