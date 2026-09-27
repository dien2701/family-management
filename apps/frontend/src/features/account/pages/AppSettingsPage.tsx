import { Bell, ChevronRight, Monitor, Moon, ShieldCheck, Sun, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
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

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card md:p-6"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

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
              'flex min-h-14 flex-col items-center justify-center gap-1 rounded-field border px-2 py-2 font-medium transition-colors',
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

const LINK =
  'flex min-h-14 items-center gap-3 rounded-field border border-border p-3 transition-colors hover:bg-surface-muted'

/** Cài đặt của thiết bị này: giao diện, cỡ chữ (lưu ở trình duyệt), lối tắt tới thông báo và chính sách. */
export function AppSettingsPage() {
  const { mode, fontSize, setMode, setFontSize } = useTheme()
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Card title="Giao diện">
        <Segmented label="Giao diện" value={mode} onChange={setMode} options={THEMES} />
      </Card>

      <Card title="Cỡ chữ">
        <Segmented label="Cỡ chữ" value={fontSize} onChange={setFontSize} options={FONTS} />
        <p className="text-sm text-text-muted">Áp dụng cho toàn bộ ứng dụng trên thiết bị này.</p>
      </Card>

      <Card title="Khác">
        <Link to="/thong-bao/cai-dat" className={LINK}>
          <Bell className="size-5 text-text-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Thông báo</span>
            <span className="block text-sm text-text-muted">Nhắc lịch, đẩy thông báo, giờ nhắc</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
        </Link>
        <Link to="/chinh-sach-bao-mat" className={LINK}>
          <ShieldCheck className="size-5 text-text-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Chính sách bảo mật</span>
            <span className="block text-sm text-text-muted">Dữ liệu được thu thập và sử dụng ra sao</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
        </Link>
      </Card>
    </div>
  )
}
