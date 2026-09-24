import { Eye, EyeOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'>

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        className={`pr-12 ${className ?? ''}`}
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-field text-text-muted hover:text-text"
      >
        {visible ? (
          <EyeOff className="size-5" aria-hidden="true" />
        ) : (
          <Eye className="size-5" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
