import { useId } from 'react'
import { cn } from '@/utils/cn'

export type Choice = { value: number; label: string; hint?: string }

type ChoiceListProps = {
  legend: string
  hint?: string
  error?: string
  choices: Choice[]
  value: number | null
  disabled?: boolean
  onChange: (value: number) => void
}

/** Chọn đúng một trong vài phương án (ví dụ "Con với ai?"): mỗi dòng là một thẻ bấm cao ≥ 44px. */
export function ChoiceList({ legend, hint, error, choices, value, disabled, onChange }: ChoiceListProps) {
  const name = useId()
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-1.5 text-base font-medium">{legend}</legend>
      {choices.map((choice) => (
        <label
          key={choice.value}
          className={cn(
            'flex min-h-11 cursor-pointer items-center gap-3 rounded-field border px-3 py-2 transition-colors duration-200 ease-out has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
            value === choice.value ? 'border-primary bg-secondary' : 'border-border hover:bg-surface-muted',
          )}
        >
          <input
            type="radio"
            name={name}
            checked={value === choice.value}
            onChange={() => onChange(choice.value)}
            className="size-5 shrink-0 cursor-pointer accent-primary"
          />
          <span className="min-w-0">
            <span className="block font-medium [overflow-wrap:anywhere]">{choice.label}</span>
            {choice.hint && <span className="block text-sm text-text-muted">{choice.hint}</span>}
          </span>
        </label>
      ))}
      {hint && <p className="text-sm text-text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
