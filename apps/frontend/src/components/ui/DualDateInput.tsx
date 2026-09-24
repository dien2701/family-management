import { AlertCircle, ArrowLeftRight, Info } from 'lucide-react'
import { useId, useMemo, type ChangeEvent, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import {
  formatLunar,
  formatLunarDayMonth,
  formatSolar,
  formatSolarWithWeekday,
  leapMonth,
  MAX_YEAR,
  MIN_LUNAR_YEAR,
  resolveDualDate,
  switchCalendar,
  type CalendarKind,
  type DualDateOptions,
  type DualDateResult,
  type DualDateValue,
} from '@/utils/lunar'
import { Checkbox } from './checkbox'
import { Input } from './input'

type DualDateInputProps = DualDateOptions & {
  label: string
  value: DualDateValue
  onChange: (value: DualDateValue) => void
  /** Lỗi từ form (ví dụ Zod); lỗi do ngày không tồn tại thì component tự báo. */
  error?: string
  hint?: ReactNode
  disabled?: boolean
}

const CALENDARS: { kind: CalendarKind; label: string }[] = [
  { kind: 'solar', label: 'Dương lịch' },
  { kind: 'lunar', label: 'Âm lịch' },
]

// Số 1–2 chữ số cho ngày/tháng, 4 chữ số cho năm; bỏ mọi ký tự không phải số
const digits = (e: ChangeEvent<HTMLInputElement>, max: number) =>
  e.target.value.replace(/\D/g, '').slice(0, max)

/**
 * Ô nhập ngày theo Dương hoặc Âm, hiện ngay ngày tương ứng ở lịch còn lại (IDEA §7). Có cờ tháng nhuận cho lịch âm.
 * `allowYearOnly` cho phép chỉ nhập năm, `allowNoYear` cho phép chỉ nhập ngày/tháng âm (lặp hằng năm).
 * Component chỉ nhận props; cần giá trị đã kiểm tra thì gọi `resolveDualDate(value, options)` ở nơi dùng.
 */
export function DualDateInput({
  label,
  value,
  onChange,
  error,
  hint,
  disabled,
  allowYearOnly,
  allowNoYear,
  referenceLunarYear,
}: DualDateInputProps) {
  const id = useId()
  const options = useMemo<DualDateOptions>(
    () => ({ allowYearOnly, allowNoYear, referenceLunarYear }),
    [allowYearOnly, allowNoYear, referenceLunarYear],
  )
  const result = useMemo(() => resolveDualDate(value, options), [value, options])
  const isLunar = value.calendar === 'lunar'
  const invalidField = result.status === 'invalid' ? result.field : undefined
  const messageId = `${id}-message`
  const errorId = `${id}-error`
  const set = (patch: Partial<DualDateValue>) => onChange({ ...value, ...patch })

  const fieldProps = (field: 'day' | 'month' | 'year') => ({
    id: `${id}-${field}`,
    disabled,
    inputMode: 'numeric' as const,
    autoComplete: 'off',
    invalid: invalidField === field,
    'aria-describedby': invalidField === field ? messageId : undefined,
  })

  return (
    <fieldset
      className="flex min-w-0 flex-col gap-3"
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="mb-1.5 text-base font-medium">{label}</legend>

      <div
        role="radiogroup"
        aria-label={`${label}: chọn lịch để nhập`}
        className="grid grid-cols-2 gap-1 rounded-field bg-secondary p-1"
      >
        {CALENDARS.map(({ kind, label: text }) => (
          <label key={kind} className="relative">
            <input
              type="radio"
              name={`${id}-calendar`}
              className="peer sr-only"
              checked={value.calendar === kind}
              disabled={disabled}
              onChange={() => onChange(switchCalendar(value, kind, options))}
            />
            <span className="flex min-h-11 cursor-pointer items-center justify-center rounded-button px-3 text-base font-semibold text-secondary-fg transition-colors duration-200 ease-out peer-checked:bg-primary peer-checked:text-primary-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
              {text}
            </span>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${id}-day`} className="text-base font-medium">
            Ngày
          </label>
          <Input
            {...fieldProps('day')}
            placeholder="15"
            maxLength={2}
            value={value.day}
            onChange={(e) => set({ day: digits(e, 2) })}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${id}-month`} className="text-base font-medium">
            Tháng
          </label>
          <Input
            {...fieldProps('month')}
            placeholder="6"
            maxLength={2}
            value={value.month}
            onChange={(e) => set({ month: digits(e, 2) })}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${id}-year`} className="text-base font-medium">
            Năm
          </label>
          <Input
            {...fieldProps('year')}
            placeholder="2025"
            maxLength={4}
            value={value.year}
            onChange={(e) => set({ year: digits(e, 4) })}
          />
        </div>
      </div>

      {isLunar && (
        <div className="flex flex-col gap-0.5">
          <Checkbox
            label="Tháng nhuận"
            checked={value.leap}
            disabled={disabled}
            invalid={invalidField === 'leap'}
            aria-describedby={invalidField === 'leap' ? messageId : undefined}
            onChange={(e) => set({ leap: e.target.checked })}
          />
          <LeapHint year={value.year} />
        </div>
      )}

      {hint && <p className="text-sm text-text-muted">{hint}</p>}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <Outcome id={messageId} result={result} />
    </fieldset>
  )
}

/** Gợi ý năm nào nhuận tháng nào, để người dùng biết có cần tick "Tháng nhuận" hay không. */
function LeapHint({ year }: { year: string }) {
  const y = Number(year)
  if (year.length !== 4 || y < MIN_LUNAR_YEAR || y > MAX_YEAR) return null
  const leap = leapMonth(y)
  return (
    <p className="text-sm text-text-muted">
      {leap === 0
        ? `Năm ${y} âm lịch không có tháng nhuận.`
        : `Năm ${y} âm lịch nhuận tháng ${leap}.`}
    </p>
  )
}

/** Vùng kết quả: `aria-live` để trình đọc màn hình đọc ngày tương ứng ngay khi đủ dữ liệu. */
function Outcome({ id, result }: { id: string; result: DualDateResult }) {
  if (result.status === 'invalid') {
    return (
      <p
        id={id}
        role="alert"
        className="flex items-start gap-2 rounded-field bg-danger-bg p-3 text-base font-medium text-danger"
      >
        <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <span>{result.message}</span>
      </p>
    )
  }

  return (
    <div id={id} aria-live="polite" className={cn(result.status === 'empty' && 'sr-only')}>
      <OutcomeBody result={result} />
    </div>
  )
}

function OutcomeBody({ result }: { result: Exclude<DualDateResult, { status: 'invalid' }> }) {
  switch (result.status) {
    case 'empty':
      return null
    case 'incomplete':
      return <Note>{result.message}</Note>
    case 'yearOnly':
      return (
        <Note>
          Chỉ có năm {result.year} {result.calendar === 'lunar' ? 'âm lịch' : 'dương lịch'}, chưa đủ
          để đổi sang lịch còn lại.
        </Note>
      )
    case 'full': {
      const toLunar = result.calendar === 'solar'
      return (
        <Result
          caption={toLunar ? 'Âm lịch tương ứng' : 'Dương lịch tương ứng'}
          main={toLunar ? formatLunar(result.lunar) : formatSolarWithWeekday(result.solar)}
        >
          {toLunar && <p>{formatSolarWithWeekday(result.solar)}</p>}
          <p>
            Tháng {result.lunar.month}
            {result.lunar.leap ? ' (nhuận)' : ''} năm {result.lunar.year} âm lịch có{' '}
            {result.monthDays} ngày ({result.monthDays === 30 ? 'tháng đủ' : 'tháng thiếu'}).
          </p>
          {toLunar && result.yearLeapMonth > 0 && (
            <p>
              Năm {result.lunar.year} âm lịch nhuận tháng {result.yearLeapMonth}.
            </p>
          )}
        </Result>
      )
    }
    case 'lunarMonthDay':
      return (
        <Result
          caption="Lặp lại hằng năm"
          main={`Ngày ${formatLunarDayMonth(result.monthDay)} lịch`}
        >
          <p>
            Năm {result.year} âm lịch rơi vào {formatSolarWithWeekday(result.occurrenceSolar)}.
          </p>
          {result.movedFromLeap && (
            <p>Ngày thuộc tháng nhuận được tính vào tháng {result.monthDay.month} thường.</p>
          )}
          {result.movedFrom30 && (
            <p>
              Tháng {result.monthDay.month} năm {result.year} chỉ có 29 ngày nên tính vào ngày 29 (
              {formatSolar(result.occurrenceSolar)}).
            </p>
          )}
        </Result>
      )
  }
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-base text-text-muted">
      <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

function Result({
  caption,
  main,
  children,
}: {
  caption: string
  main: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-field bg-secondary p-3 text-secondary-fg">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface">
        <ArrowLeftRight className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{caption}</p>
        <p className="text-lg leading-tight font-semibold">{main}</p>
        <div className="mt-1 flex flex-col gap-0.5 text-base">{children}</div>
      </div>
    </div>
  )
}
