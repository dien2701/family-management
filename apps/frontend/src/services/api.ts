import { api, ApiError, getAccessToken } from './client'

type Options = { query?: Record<string, string | number | boolean | null | undefined>; as?: 'blob' }

// Đường dẫn ở các màn hình đính kèm/báo cáo viết dạng `/api/...`; client đã có sẵn tiền tố `/api`
const strip = (path: string) => path.replace(/^\/api/, '')

async function fetchFile(path: string): Promise<Response> {
  const token = getAccessToken()
  const response = await fetch(`/api${strip(path)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'same-origin',
  })
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}))
    throw new ApiError(response.status, problem)
  }
  return response
}

const getBlob = async (path: string): Promise<Blob> => (await fetchFile(path)).blob()

/** Tải tệp kèm tên do máy chủ đặt (header Content-Disposition, báo cáo có ngày xuất). */
async function download(path: string): Promise<{ blob: Blob; filename: string | null }> {
  const response = await fetchFile(path)
  const header = response.headers.get('Content-Disposition') ?? ''
  const filename = /filename="?([^";]+)"?/i.exec(header)?.[1] ?? null
  return { blob: await response.blob(), filename }
}

const compat = {
  download,
  get: (path: string, options?: Options): Promise<unknown> =>
    options?.as === 'blob' ? getBlob(path) : api.get<unknown>(strip(path), { query: options?.query }),
  post: (path: string, options?: { body?: unknown }) => api.post<unknown>(strip(path), options?.body),
  delete: (path: string) => api.delete<void>(strip(path)),
}

export function useApi() {
  return compat
}
