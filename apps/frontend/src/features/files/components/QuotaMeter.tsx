import { cn } from '@/lib/utils'

type QuotaMeterProps = {
  usedMb: number
  limitMb: number
  className?: string
}

export function QuotaMeter({ usedMb, limitMb, className }: QuotaMeterProps) {
  const percentage = limitMb > 0 ? (usedMb / limitMb) * 100 : 0
  const isWarning = percentage > 80
  const isCritical = percentage > 95

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">Dung lượng lưu trữ</span>
        <span className="font-medium">
          {usedMb.toFixed(1)} MB / {limitMb.toFixed(0)} MB
        </span>
      </div>
      <meter
        className={cn(
          'h-2 w-full overflow-hidden rounded-full',
          '[&::-webkit-meter-bar]:bg-secondary',
          '[&::-webkit-meter-optimum-value]:bg-primary',
          '[&::-webkit-meter-suboptimum-value]:bg-warning',
          '[&::-webkit-meter-even-less-good-value]:bg-destructive',
          '[&::-moz-meter-bar]:bg-primary'
        )}
        value={usedMb}
        min={0}
        max={limitMb}
        low={limitMb * 0.8}
        high={limitMb * 0.95}
        optimum={0}
        aria-label={`Đã dùng ${usedMb.toFixed(1)} MB trên tổng số ${limitMb} MB`}
      >
        {usedMb.toFixed(1)} MB / {limitMb.toFixed(0)} MB
      </meter>
      {isCritical ? (
        <p className="text-xs text-destructive">Dung lượng sắp hết, vui lòng dọn dẹp bớt tài liệu.</p>
      ) : isWarning ? (
        <p className="text-xs text-warning">Dung lượng đã sử dụng hơn 80%.</p>
      ) : null}
    </div>
  )
}
