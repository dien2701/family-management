import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PaginationProps = {
  /** Trang hiện tại, đếm từ 0 như API. */
  page: number
  totalPages: number
  onChange: (page: number) => void
  labels?: { nav: string; previous: string; next: string; position: (page: number, total: number) => string }
  /** Hiện nút số trang `< 1 2 … 353 >` thay cho chữ "Trang x/y". */
  numbered?: boolean
}

const defaultLabels = {
  nav: 'Phân trang',
  previous: 'Trang trước',
  next: 'Trang sau',
  position: (page: number, total: number) => `Trang ${page}/${total}`,
}

// Trang đầu, trang cuối, trang hiện tại (đứng ở đầu/cuối thì thêm trang kề). Hở đúng 1 trang thì hiện luôn trang đó,
// hở nhiều hơn thì "…". Tối đa 7 ô nên vừa khổ 375px với nút 44px.
function pageItems(page: number, totalPages: number): (number | '…')[] {
  const last = totalPages - 1
  const keep = [...new Set([0, last, page, page === 0 ? 1 : page, page === last ? last - 1 : page])]
    .filter((p) => p >= 0 && p <= last)
    .sort((a, b) => a - b)
  const items: (number | '…')[] = []
  keep.forEach((p, i) => {
    const gap = i === 0 ? 0 : p - keep[i - 1]
    if (gap === 2) items.push(p - 1)
    else if (gap > 2) items.push('…')
    items.push(p)
  })
  return items
}

// Chỉ nhận props, không biết gì về dữ liệu; ẩn khi chỉ có một trang
export function Pagination({ page, totalPages, onChange, labels = defaultLabels, numbered }: PaginationProps) {
  if (totalPages <= 1) return null
  const arrow = numbered ? 'outline' : 'secondary'
  return (
    <nav aria-label={labels.nav} className={`flex items-center justify-center ${numbered ? 'gap-1' : 'gap-3'}`}>
      <Button
        variant={arrow}
        size="icon"
        aria-label={labels.previous}
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft />
      </Button>
      {numbered ? (
        pageItems(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="w-6 text-center text-text-muted" aria-hidden="true">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'primary' : 'outline'}
              size="icon"
              className="tabular-nums"
              aria-label={`Trang ${p + 1}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onChange(p)}
            >
              {p + 1}
            </Button>
          ),
        )
      ) : (
        <span className="min-w-24 text-center tabular-nums" aria-live="polite">
          {labels.position(page + 1, totalPages)}
        </span>
      )}
      <Button
        variant={arrow}
        size="icon"
        aria-label={labels.next}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight />
      </Button>
    </nav>
  )
}
