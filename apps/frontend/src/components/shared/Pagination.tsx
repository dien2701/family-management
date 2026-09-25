import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PaginationProps = {
  /** Trang hiện tại, đếm từ 0 như API. */
  page: number
  totalPages: number
  onChange: (page: number) => void
  labels: { nav: string; previous: string; next: string; position: (page: number, total: number) => string }
}

// Chỉ nhận props, không biết gì về dữ liệu; ẩn khi chỉ có một trang
export function Pagination({ page, totalPages, onChange, labels }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label={labels.nav} className="flex items-center justify-center gap-3">
      <Button
        variant="secondary"
        size="icon"
        aria-label={labels.previous}
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-24 text-center tabular-nums" aria-live="polite">
        {labels.position(page + 1, totalPages)}
      </span>
      <Button
        variant="secondary"
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
