import { formatDateTime } from '@/utils/date'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Check, FileCheck, X } from 'lucide-react'
import { Badge } from '@/components/shared/Badge'
import { cn } from '@/utils/cn'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAdminProposals, useApproveProposal, useRejectProposal } from '../../proposal/hooks'
import type { Schemas } from '@/types/api'
import { ApiError } from '@/services/client'
import { Alert } from '@/components/shared/Alert'

type Proposal = Schemas['Proposal']

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Thêm mới sự kiện',
  UPDATE: 'Sửa sự kiện',
  DELETE: 'Xóa sự kiện',
}

type StatusText = { label: string; tone: 'warning' | 'success' | 'danger' }
const REJECTED: StatusText = { label: 'Từ chối', tone: 'danger' }
const STATUS: Record<string, StatusText> = {
  PENDING: { label: 'Chờ duyệt', tone: 'warning' },
  APPROVED: { label: 'Đã duyệt', tone: 'success' },
  REJECTED,
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? REJECTED
  return <Badge tone={s.tone}>{s.label}</Badge>
}

function Heading({ proposal: p }: { proposal: Proposal }) {
  return (
    <div className="min-w-0">
      <h3 className="flex flex-wrap items-center gap-2 text-lg leading-tight font-bold text-primary">
        {ACTION_LABEL[p.action] ?? 'Xóa sự kiện'}
        {p.conflict && p.status === 'PENDING' && <Badge tone="danger">Bị xung đột</Badge>}
      </h3>
      <p className="mt-1 text-sm text-text-muted">
        Bởi: <span className="font-medium text-text">{p.accountName}</span>
      </p>
    </div>
  )
}

function Payload({ proposal: p }: { proposal: Proposal }) {
  return (
    <div className="rounded-field bg-surface-muted p-3">
      {p.payload ? (
        <pre className="font-mono text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">
          {JSON.stringify(p.payload, null, 2)}
        </pre>
      ) : (
        <p className="text-text-muted italic">Không có dữ liệu payload</p>
      )}
    </div>
  )
}

function RejectNote({ proposal: p }: { proposal: Proposal }) {
  if (!p.note || p.status !== 'REJECTED') return null
  return <p className="mt-2 text-sm text-danger">Lý do từ chối: {p.note}</p>
}

// Điện thoại: hai nút chia đều ở chân thẻ; máy tính: gọn, căn phải trong ô bảng
function ProposalActions({
  onReject,
  onApprove,
  className,
}: {
  onReject: () => void
  onApprove: () => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-2 *:flex-1 md:justify-end md:*:flex-none', className)}>
      <Button variant="danger" onClick={onReject}>
        <X aria-hidden="true" /> Từ chối
      </Button>
      <Button onClick={onApprove}>
        <Check aria-hidden="true" /> Duyệt
      </Button>
    </div>
  )
}

// Quản trị > Duyệt đề xuất sự kiện chung (DECISIONS #75–#78)
export function AdminProposalsPage() {
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') || '1', 10)
  const status = params.get('status') || ''
  const size = 10

  const { data, isPending, isError, refetch } = useAdminProposals(page, size, status)
  const approve = useApproveProposal()
  const reject = useRejectProposal()

  const [rejecting, setRejecting] = useState<Proposal | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)

  const [approving, setApproving] = useState<Proposal | null>(null)
  const [approveError, setApproveError] = useState<string | null>(null)

  const changePage = (p: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(p))
    setParams(next)
  }

  const changeStatus = (s: string) => {
    const next = new URLSearchParams(params)
    next.set('page', '1')
    if (s) next.set('status', s)
    else next.delete('status')
    setParams(next)
  }

  const handleApprove = async () => {
    if (!approving) return
    setApproveError(null)
    try {
      await approve.mutateAsync({ id: approving.id })
      setApproving(null)
    } catch (e) {
      setApproveError(e instanceof ApiError ? e.message : 'Lỗi khi duyệt đề xuất')
    }
  }

  const handleReject = async () => {
    if (!rejecting) return
    if (!rejectNote.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối')
      return
    }
    setRejectError(null)
    try {
      await reject.mutateAsync({ id: rejecting.id, note: rejectNote })
      setRejecting(null)
      setRejectNote('')
    } catch (e) {
      setRejectError(e instanceof ApiError ? e.message : 'Lỗi khi từ chối đề xuất')
    }
  }

  const openReject = (p: Proposal) => {
    setRejecting(p)
    setRejectNote('')
    setRejectError(null)
  }
  const openApprove = (p: Proposal) => {
    setApproving(p)
    setApproveError(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <label htmlFor="status-filter" className="font-medium">
          Trạng thái
        </label>
        <Select
          id="status-filter"
          value={status}
          onChange={(e) => changeStatus(e.target.value)}
          className="flex-1 md:w-48 md:flex-none"
        >
          <option value="">Tất cả</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Từ chối</option>
        </Select>
      </div>

      {isPending ? (
        <p className="text-text-muted">Đang tải...</p>
      ) : isError ? (
        <EmptyState title="Không tải được danh sách đề xuất" action={<Button onClick={() => void refetch()}>Thử lại</Button>} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={FileCheck} title="Không có đề xuất nào" description="Danh sách đề xuất theo trạng thái bạn chọn đang trống." />
      ) : (
        <>
          {/* Điện thoại: thẻ, thao tác ở chân thẻ. Máy tính: bảng, nội dung đề xuất mở bằng "Xem nội dung" */}
          <ul aria-label="Danh sách đề xuất" className="flex flex-col gap-4 md:hidden">
            {data.items.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <Heading proposal={p} />
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-sm text-text-muted">Ngày gửi: {formatDateTime(p.createdAt)}</p>
                <Payload proposal={p} />
                <RejectNote proposal={p} />
                {p.status === 'PENDING' && (
                  <ProposalActions
                    className="border-t border-border pt-3"
                    onReject={() => openReject(p)}
                    onApprove={() => openApprove(p)}
                  />
                )}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-card md:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Danh sách đề xuất</caption>
              <thead className="bg-surface-muted text-sm font-semibold text-text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Đề xuất</th>
                  <th scope="col" className="px-4 py-3">Ngày gửi</th>
                  <th scope="col" className="px-4 py-3">Trạng thái</th>
                  <th scope="col" className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="border-t border-border align-top even:bg-surface-muted">
                    <td className="px-4 py-3">
                      <Heading proposal={p} />
                      <details className="mt-2">
                        <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-accent-text">
                          Xem nội dung
                        </summary>
                        <Payload proposal={p} />
                      </details>
                      <RejectNote proposal={p} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatDateTime(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'PENDING' && (
                        <ProposalActions onReject={() => openReject(p)} onApprove={() => openApprove(p)} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page - 1}
            totalPages={data.totalPages}
            onChange={(p) => changePage(p + 1)}
          />
        </>
      )}

      {/* Approving Modal */}
      <ModalDialog
        open={approving !== null}
        title="Duyệt đề xuất"
        onClose={() => setApproving(null)}
      >
        <div className="flex flex-col gap-4">
          {approveError && <Alert>{approveError}</Alert>}
          <p>Bạn có chắc chắn muốn duyệt đề xuất thay đổi này?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setApproving(null)}>Hủy</Button>
            <Button loading={approve.isPending} onClick={() => void handleApprove()}>Duyệt</Button>
          </div>
        </div>
      </ModalDialog>

      {/* Rejecting Modal */}
      <ModalDialog
        open={rejecting !== null}
        title="Từ chối đề xuất"
        onClose={() => setRejecting(null)}
      >
        <div className="flex flex-col gap-4">
          {rejectError && <Alert>{rejectError}</Alert>}
          <p>Vui lòng nhập lý do từ chối để thông báo cho người đề xuất:</p>
          <Textarea 
            value={rejectNote} 
            onChange={(e) => setRejectNote(e.target.value)} 
            placeholder="Lý do..."
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setRejecting(null)}>Hủy</Button>
            <Button variant="danger" loading={reject.isPending} onClick={() => void handleReject()}>Từ chối</Button>
          </div>
        </div>
      </ModalDialog>
    </div>
  )
}
