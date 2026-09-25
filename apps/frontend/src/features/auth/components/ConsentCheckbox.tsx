import type { Ref } from 'react'
import { Link } from 'react-router'
import { Checkbox } from '@/components/ui/checkbox'
import { authStrings as s, POLICY_VERSION } from '../strings'

type ConsentCheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  onBlur?: () => void
  name?: string
  ref?: Ref<HTMLInputElement>
  error?: string
}

// Đồng ý dữ liệu cá nhân theo NĐ 13 (IDEA §5). Link chính sách mở tab mới để không mất trang chờ duyệt.
export function ConsentCheckbox({
  checked,
  onChange,
  onBlur,
  name,
  ref,
  error,
}: ConsentCheckboxProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Checkbox
        label={
          <>
            {s.consent.before}
            <Link
              to="/chinh-sach-bao-mat"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-text underline"
            >
              {s.consent.link}
            </Link>
            {s.consent.after(POLICY_VERSION)}
          </>
        }
        invalid={Boolean(error)}
        aria-describedby={error ? 'consent-error' : undefined}
        name={name}
        ref={ref}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        onBlur={onBlur}
      />
      {error && (
        <p id="consent-error" role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
