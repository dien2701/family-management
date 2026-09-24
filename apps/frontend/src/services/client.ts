// Wrapper của fetch: base `/api`, gửi/nhận JSON, đổi ProblemDetail của backend thành ApiError.
// Bearer + tự refresh khi 401 thêm ở Đợt 3 (AuthProvider).

const BASE_URL = '/api'

/** Lỗi gắn với một trường, khớp `errors[]` của ProblemDetail (backend: common/exception/FieldError). */
export type FieldError = { field: string; message: string }

export type ProblemDetail = {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  code?: string
  errors?: FieldError[]
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string | undefined
  readonly errors: FieldError[]

  constructor(status: number, problem: ProblemDetail = {}) {
    super(problem.detail ?? problem.title ?? 'Có lỗi xảy ra, vui lòng thử lại.')
    this.name = 'ApiError'
    this.status = status
    this.code = problem.code
    this.errors = problem.errors ?? []
  }
}

type QueryValue = string | number | boolean | null | undefined
type RequestOptions = {
  query?: Record<string, QueryValue | QueryValue[]>
  body?: unknown
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== null && item !== undefined && item !== '') params.append(key, String(item))
    }
  }
  const qs = params.toString()
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

async function parseProblem(response: Response): Promise<ProblemDetail> {
  try {
    return (await response.json()) as ProblemDetail
  } catch {
    // Body rỗng hoặc không phải JSON (ví dụ 401 của filter chain, lỗi proxy)
    return {}
  }
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'same-origin',
      signal: options.signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(0, { title: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' })
  }

  if (!response.ok) throw new ApiError(response.status, await parseProblem(response))
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('DELETE', path, options),
}
