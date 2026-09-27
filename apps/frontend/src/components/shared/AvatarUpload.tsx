import { Camera, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { initialOf } from '@/utils/text'

export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const AVATAR_MAX_BYTES = 10 * 1024 * 1024

type AvatarUploadProps = {
  label: string
  /** Tên người, để hiện chữ cái đầu khi chưa có ảnh. */
  name: string
  /** Ảnh hiện tại của hồ sơ (nếu có). */
  currentUrl?: string | null
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
  hint?: string
  labels: { choose: string; change: string; clear: string; badType: string; tooBig: string }
}

/**
 * Chọn ảnh đại diện: kiểm tra định dạng và 10 MB ngay ở máy rồi hiện preview.
 * Component chỉ giữ tệp đã chọn, việc tải lên do nơi dùng làm (cần máy chủ).
 */
export function AvatarUpload({
  label,
  name,
  currentUrl,
  file,
  onChange,
  disabled,
  hint,
  labels,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)

  // Tạo và thu hồi URL xem trước ngay trong lúc chọn, không đồng bộ state trong effect
  const select = (next: File | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = next ? URL.createObjectURL(next) : null
    setPreview(previewRef.current)
    onChange(next)
  }

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    },
    [],
  )

  const pick = (picked: File | undefined) => {
    if (!picked) return
    if (!(AVATAR_TYPES as readonly string[]).includes(picked.type)) {
      setError(labels.badType)
    } else if (picked.size > AVATAR_MAX_BYTES) {
      setError(labels.tooBig)
    } else {
      setError(null)
      select(picked)
    }
    // Cho phép chọn lại đúng tệp vừa bị từ chối
    if (inputRef.current) inputRef.current.value = ''
  }

  const shown = (file ? preview : null) ?? currentUrl ?? null
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-base font-medium">{label}</span>
      <div className="flex items-center gap-4">
        {shown ? (
          <img src={shown} alt="" className="size-20 shrink-0 rounded-card bg-surface-muted object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-20 shrink-0 items-center justify-center rounded-card bg-secondary text-3xl font-bold text-secondary-fg"
          >
            {initialOf(name)}
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            aria-describedby={describedBy || undefined}
            onClick={() => inputRef.current?.click()}
          >
            <Camera aria-hidden="true" />
            {shown ? labels.change : labels.choose}
          </Button>
          {file && (
            <Button type="button" variant="ghost" disabled={disabled} onClick={() => select(null)}>
              <X aria-hidden="true" />
              {labels.clear}
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
