import { api, ApiError, getAccessToken } from './client'

type Options = { query?: Record<string, string | number | boolean | null | undefined>; as?: 'blob' }

// Đường dẫn ở các màn hình đính kèm/báo cáo viết dạng `/api/...`; client đã có sẵn tiền tố `/api`
const strip = (path: string) => path.replace(/^\/api/, '')

async function getBlob(path: string): Promise<Blob> {
  const token = getAccessToken()
  const response = await fetch(`/api${strip(path)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'same-origin',
  })
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}))
    throw new ApiError(response.status, problem)
  }
  return response.blob()
}

const compat = {
  get: (path: string, options?: Options): Promise<unknown> =>
    options?.as === 'blob' ? getBlob(path) : api.get<unknown>(strip(path), { query: options?.query }),
  post: (path: string, options?: { body?: unknown }) => api.post<unknown>(strip(path), options?.body),
  delete: (path: string) => api.delete<void>(strip(path)),
}

export function useApi() {
  return compat
}
