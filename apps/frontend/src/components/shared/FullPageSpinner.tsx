import { Loader2 } from 'lucide-react'

export function FullPageSpinner() {
  return (
    <div
      role="status"
      className="flex min-h-dvh flex-col items-center justify-center gap-3 text-text-muted"
    >
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      <span>Đang tải…</span>
    </div>
  )
}
