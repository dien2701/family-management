import { formatDateTime } from '@/utils/date'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Check, X } from 'lucide-react'
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

export function AdminProposalsPage() {
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') || '1', 10)
  const status = params.get('status') || ''
  const size = 10

  const { data, isPending, isError, refetch } = useAdminProposals(page, size, status)
  const approve = useApproveProposal()
  const reject = useRejectProposal()

  const [rejecting, setRejecting] = useState<Schemas['Proposal'] | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)

  const [approving, setApproving] = useState<Schemas['Proposal'] | null>(null)
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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Duyệt đề xuất</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium">Trạng thái:</label>
          <Select 
            id="status-filter"
            value={status} 
            onChange={(e) => changeStatus(e.target.value)}
            className="w-40"
          >
            <option value="">Tất cả</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </Select>
        </div>
      </div>
      
      {isPending ? (
        <p className="text-text-muted">Đang tải...</p>
      ) : isError ? (
        <EmptyState title="Không tải được danh sách đề xuất" action={<Button onClick={() => void refetch()}>Thử lại</Button>} />
      ) : data.items.length === 0 ? (
        <EmptyState title="Không có đề xuất nào" description="Danh sách đề xuất theo trạng thái bạn chọn đang trống." />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {data.items.map(p => (
              <div key={p.id} className="rounded-lg bg-surface p-4 border shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {p.action === 'CREATE' ? 'Thêm mới sự kiện' : p.action === 'UPDATE' ? 'Sửa sự kiện' : 'Xóa sự kiện'}
                      {p.conflict && p.status === 'PENDING' && (
                        <span className="bg-danger/20 text-danger-fg text-xs px-2 py-0.5 rounded">Bị xung đột</span>
                      )}
                    </h3>
                    <p className="text-sm text-text-muted">Bởi: <span className="font-medium text-foreground">{p.accountName}</span></p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    p.status === 'PENDING' ? 'bg-warning/20 text-warning-fg' : 
                    p.status === 'APPROVED' ? 'bg-primary/20 text-primary-fg' : 
                    'bg-danger/20 text-danger-fg'
                  }`}>
                    {p.status === 'PENDING' ? 'Chờ duyệt' : p.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                  </span>
                </div>
                
                <div className="bg-secondary p-3 rounded text-sm">
                  {p.payload ? (
                    <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(p.payload, null, 2)}</pre>
                  ) : (
                    <p className="italic text-text-muted">Không có dữ liệu payload</p>
                  )}
                </div>

                {p.note && p.status === 'REJECTED' && (
                  <p className="text-danger text-sm">Lý do từ chối: {p.note}</p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-text-muted">
                    Ngày gửi: {formatDateTime(p.createdAt)}
                  </p>
                  
                  {p.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" className="text-danger" onClick={() => { setRejecting(p); setRejectNote(''); setRejectError(null); }}>
                        <X className="w-4 h-4 mr-1" /> Từ chối
                      </Button>
                      <Button onClick={() => { setApproving(p); setApproveError(null); }}>
                        <Check className="w-4 h-4 mr-1" /> Duyệt
                      </Button>
                    </div>
                  )}
                </div>
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
