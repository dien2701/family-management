import { ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

type FilterChipProps = {
  label: string
  face: string
  active: boolean
  value: string
  options: { value: string; text: string }[]
  onChange: (value: string) => void
  icon?: LucideIcon
  disabled?: boolean
  /** Chiều rộng cố định từ md trở lên (class Tailwind), để đổi chữ không làm các chip kề bên bị xô */
  widthClass: string
}

// Chip: <select> gốc phủ trong suốt lên vùng hiển thị nên vẫn dùng bộ chọn và bàn phím của trình duyệt.
export function FilterChip({
  label,
  face,
  active,
  value,
  options,
  onChange,
  icon: Icon,
  disabled,
  widthClass,
}: FilterChipProps) {
  return (
    <label
      className={cn(
        'relative inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3 text-base font-semibold transition-colors duration-200 ease-out has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
        widthClass,
        active
          ? 'border-transparent bg-secondary text-secondary-fg hover:bg-secondary-hover'
          : 'border-border bg-surface-muted text-text hover:bg-secondary',
        disabled && 'cursor-not-allowed opacity-50 hover:bg-surface-muted',
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
      <span className="min-w-0 truncate whitespace-nowrap">{face}</span>
      <ChevronDown className="size-4 shrink-0" aria-hidden />
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      >
        {/* Giá trị rỗng: đang xếp bằng chip khác, để chọn lại mục đầu vẫn bắn onChange */}
        {value === '' && <option value="" hidden />}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.text}
          </option>
        ))}
      </select>
    </label>
  )
}
