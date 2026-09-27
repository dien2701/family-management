import { ApiError } from '@/services/client'

/** Lỗi theo dạng ProblemDetail của backend; thông báo tiếng Việt. */
export function mockProblem(
  status: number,
  code: string,
  detail: string,
  errors?: { field: string; message: string }[],
) {
  return new ApiError(status, { status, code, title: detail, detail, errors: errors ?? [] })
}

export const validationProblem = (errors: { field: string; message: string }[]) =>
  mockProblem(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ.', errors)
