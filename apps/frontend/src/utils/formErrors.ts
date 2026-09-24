import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/services/client'

/**
 * Gán lỗi của ProblemDetail vào form: `errors[]` đúng tên trường thì hiện dưới trường đó,
 * phần còn lại hiện ở `errors.root.server` (banner đầu form).
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): void {
  if (!(error instanceof ApiError)) {
    setError('root.server', { type: 'server', message: 'Có lỗi xảy ra, vui lòng thử lại.' })
    return
  }
  let placed = 0
  for (const { field, message } of error.errors) {
    if ((fields as readonly string[]).includes(field)) {
      setError(field as Path<T>, { type: 'server', message })
      placed++
    }
  }
  if (placed === 0) setError('root.server', { type: 'server', message: error.message })
}
