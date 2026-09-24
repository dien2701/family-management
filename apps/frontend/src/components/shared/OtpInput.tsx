import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'

// Một ô duy nhất: bàn phím số, tự điền mã từ SMS/email (one-time-code), tránh 6 ô rời khó dùng với trình đọc màn hình
export function OtpInput({ className, ...props }: Omit<ComponentProps<typeof Input>, 'type'>) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      pattern="[0-9]*"
      className={cn('text-center text-2xl font-semibold tracking-[0.5em] tabular-nums', className)}
      {...props}
    />
  )
}
