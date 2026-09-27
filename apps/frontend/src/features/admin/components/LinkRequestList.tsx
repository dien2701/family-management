import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type { LinkRequest } from '@/types/api'
import { formatDate } from '@/utils/date'
import { initialOf } from '@/utils/text'
import { adminStrings as s } from '../strings'

export type LinkRequestDecision = 'approve' | 'reject'

type LinkRequestListProps = {
  requests: LinkRequest[]
  onDecide: (request: LinkRequest, decision: LinkRequestDecision) => void
}

function Requester({ request }: { request: LinkRequest }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold text-secondary-fg"
      >
        {initialOf(request.accountFullName)}
      </span>
      <div className="min-w-0">
        <p className="font-semibold [overflow-wrap:anywhere]">{request.accountFullName}</p>
        <p className="text-sm break-all text-text-muted">{request.accountEmail}</p>
      </div>
    </div>
  )
}

function MemberLink({ request }: { request: LinkRequest }) {
  return (
    <Link
      to={`/thanh-vien/${request.member.id}`}
      className="font-semibold text-accent-text underline-offset-2 [overflow-wrap:anywhere] hover:underline"
    >
      {request.member.fullName}
    </Link>
  )
}

// Mỗi nút có aria-label kèm tên tài khoản để trình đọc màn hình phân biệt các dòng; bấm chỉ mở hộp xác nhận
function Actions({ request, onDecide }: { request: LinkRequest; onDecide: LinkRequestListProps['onDecide'] }) {
  return (
    <div className="flex flex-wrap gap-2 md:justify-end">
      <Button
        aria-label={s.linkRequests.approveFor(request.accountFullName)}
        onClick={() => onDecide(request, 'approve')}
      >
        {s.linkRequests.approve}
      </Button>
      <Button
        variant="danger"
        aria-label={s.linkRequests.rejectFor(request.accountFullName)}
        onClick={() => onDecide(request, 'reject')}
      >
        {s.linkRequests.reject}
      </Button>
    </div>
  )
}

// Điện thoại (<768px): danh sách thẻ. Máy tính: bảng (DESIGN §6). Cả hai cùng một dữ liệu;
// phần không hiện được ẩn bằng CSS nên trình đọc màn hình chỉ gặp một dạng.
export function LinkRequestList({ requests, onDecide }: LinkRequestListProps) {
  return (
    <>
      <ul aria-label={s.linkRequests.listLabel} className="flex flex-col gap-4 md:hidden">
        {requests.map((request) => (
          <li
            key={request.id}
            className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card"
          >
            <Requester request={request} />
            <div>
              <p className="text-sm text-text-muted">{s.linkRequests.wantsMember}</p>
              <MemberLink request={request} />
            </div>
            <p className="text-sm text-text-muted">{s.linkRequests.sentAt(formatDate(request.createdAt))}</p>
            <Actions request={request} onDecide={onDecide} />
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-card md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{s.linkRequests.listLabel}</caption>
          <thead className="bg-surface-muted text-sm font-semibold text-text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">
                {s.linkRequests.columns.account}
              </th>
              <th scope="col" className="px-4 py-3">
                {s.linkRequests.columns.member}
              </th>
              <th scope="col" className="px-4 py-3">
                {s.linkRequests.columns.sentAt}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                {s.linkRequests.columns.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="min-h-12 border-t border-border even:bg-surface-muted">
                <td className="max-w-64 px-4 py-3">
                  <Requester request={request} />
                </td>
                <td className="px-4 py-3">
                  <MemberLink request={request} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatDate(request.createdAt)}</td>
                <td className="px-4 py-3">
                  <Actions request={request} onDecide={onDecide} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
