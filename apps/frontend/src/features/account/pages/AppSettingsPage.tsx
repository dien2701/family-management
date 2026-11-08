import {
  Bell,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  ShieldCheck,
  Sun,
  Type,
  type LucideIcon,
} from 'lucide-react'
import { ListGroup, ListRow } from '@/components/shared/ListRow'
import { SectionCard } from '@/components/shared/SectionCard'
import { useTheme, type FontSize, type ThemeMode } from '@/hooks/useTheme'
import { cn } from '@/utils/cn'

type Option<T> = { value: T; label: string; icon?: LucideIcon; sample?: string }

const THEMES: Option<ThemeMode>[] = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
  { value: 'system', label: 'Theo máy', icon: Monitor },
]

const FONTS: Option<FontSize>[] = [
  { value: 'normal', label: 'Vừa', sample: 'text-base' },
  { value: 'large', label: 'Lớn', sample: 'text-lg' },
  { value: 'xlarge', label: 'Rất lớn', sample: 'text-xl' },
]

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: Option<T>[]
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
      {options.map(({ value: v, label: text, icon: Icon, sample }) => {
        const selected = v === value
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(v)}
            className={cn(
              'flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-field border px-2 py-2 font-medium transition-colors',
              sample,
              selected
                ? 'border-primary bg-primary text-primary-fg'
                : 'border-border bg-surface-muted hover:bg-secondary',
            )}
          >
            {Icon && <Icon className="size-5" aria-hidden="true" />}
            {text}
          </button>
        )
      })}
    </div>
  )
}

/** Cài đặt của thiết bị này: giao diện, cỡ chữ (lưu ở trình duyệt), lối tắt tới thông báo và chính sách. */
export function AppSettingsPage() {
  const { mode, fontSize, setMode, setFontSize } = useTheme()
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <SectionCard title="Giao diện" icon={Palette}>
        <Segmented label="Giao diện" value={mode} onChange={setMode} options={THEMES} />
      </SectionCard>

      <SectionCard title="Cỡ chữ" icon={Type}>
        <Segmented label="Cỡ chữ" value={fontSize} onChange={setFontSize} options={FONTS} />
        <p className="mt-3 text-sm text-text-muted">
          Áp dụng cho toàn bộ ứng dụng trên thiết bị này.
        </p>
      </SectionCard>

      <SectionCard title="Khác" icon={MoreHorizontal}>
        <ListGroup>
          <ListRow
            to="/thong-bao/cai-dat"
            icon={Bell}
            label="Thông báo"
            description="Nhắc lịch, đẩy thông báo, giờ nhắc"
          />
          <ListRow
            to="/chinh-sach-bao-mat"
            icon={ShieldCheck}
            label="Chính sách bảo mật"
            description="Dữ liệu được thu thập và sử dụng ra sao"
          />
        </ListGroup>
      </SectionCard>
    </div>
  )
}
