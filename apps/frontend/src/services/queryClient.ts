import { MutationCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from './client'

type MutationFeedback = {
  /** Câu báo thành công; hàm khi câu phụ thuộc kết quả hoặc tham số. Bỏ trống thì dùng câu chung. */
  successMessage?: string | ((data: unknown, variables: unknown) => string)
  /** Thao tác đã có phản hồi ngay trên màn hình: không báo toast cả thành công lẫn lỗi. */
  silent?: boolean
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: MutationFeedback
  }
}

// Mọi thao tác ghi đều báo thành công/thất bại tại một chỗ (DESIGN §6 Toast)
const feedback: ConstructorParameters<typeof MutationCache>[0] = {
  onSuccess: (data, variables, _context, mutation) => {
    const meta = mutation.meta
    if (meta?.silent) return
    const message = meta?.successMessage
    toast.success(
      typeof message === 'function' ? message(data, variables) : (message ?? 'Đã lưu thay đổi.'),
    )
  },
  onError: (error, _variables, _context, mutation) => {
    if (mutation.meta?.silent) return
    // Lỗi theo trường đã được form gán vào đúng ô, không báo lặp
    if (error instanceof ApiError && error.errors.length > 0) return
    toast.error(
      error instanceof Error && error.message ? error.message : 'Có lỗi xảy ra, vui lòng thử lại.',
    )
  },
}

export function createQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache(feedback),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Lỗi 4xx là lỗi của yêu cầu, thử lại không giúp gì
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
          failureCount < 2,
      },
    },
  })
}

export const queryClient = createQueryClient()
