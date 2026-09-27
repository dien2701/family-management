import { cloneElement, useId, type ReactElement, type ReactNode } from 'react'

type FieldControlProps = { id?: string; invalid?: boolean; 'aria-describedby'?: string }

type FormFieldProps = {
  label: string
  error?: string
  hint?: ReactNode
  children: ReactElement<FieldControlProps>
}

// Nhãn luôn hiện phía trên, lỗi ngay dưới trường, có dòng gợi ý (DESIGN §6)
export function FormField({ label, error, hint, children }: FormFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-base font-medium">
        {label}
      </label>
      {cloneElement(children, {
        id,
        invalid: Boolean(error),
        'aria-describedby': describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-sm text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
