// Wrapper của fetch: base `/api`, gửi/nhận JSON, đổi ProblemDetail của backend thành ApiError.
// Access token chỉ nằm trong biến của module này (bộ nhớ), không ghi vào localStorage/sessionStorage.
// Gặp 401 thì refresh một lần (dùng chung một request cho mọi lời gọi song song) rồi thử lại.

import type { AuthResponse, Schemas } from '@/types/api'

const BASE_URL = '/api'

/** Lỗi gắn với một trường, khớp `errors[]` của ProblemDetail (kiểu lấy từ openapi.yaml). */
export type FieldError = Schemas['FieldError']

export type ProblemDetail = Schemas['ProblemDetail']

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
  /** Phản hồi `text/plain` (ví dụ VAPID public key), không phải JSON. */
  responseType?: 'text'
}

// ---------- Phiên đăng nhập (chỉ trong bộ nhớ) ----------

type SessionHooks = {
  /** Refresh thành công: claim trong token có thể đã đổi (vai trò, trạng thái duyệt). */
  onRefreshed: (session: AuthResponse) => void
  /** Refresh bị từ chối: phiên đã hết hạn hoặc bị thu hồi. */
  onExpired: () => void
}

let accessToken: string | null = null
let sessionHooks: SessionHooks | null = null
let refreshInFlight: Promise<AuthResponse | null> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function configureSession(hooks: SessionHooks | null) {
  sessionHooks = hooks
}

function expireSession() {
  accessToken = null
  sessionHooks?.onExpired()
}

/**
 * Đổi refresh cookie lấy access token mới. Trả `null` khi không còn phiên (401/403),
 * ném lỗi khi gặp sự cố khác (mất mạng, 5xx) để không đăng xuất oan.
 * Refresh token xoay vòng nên các lời gọi đồng thời phải dùng chung một request.
 */
export function refreshSession(): Promise<AuthResponse | null> {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

async function doRefresh(): Promise<AuthResponse | null> {
  try {
    const session = await request<AuthResponse>('POST', '/auth/refresh', { retryOn401: false })
    accessToken = session.accessToken ?? null
    sessionHooks?.onRefreshed(session)
    return session
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      accessToken = null
      return null
    }
    throw error
  }
}

// ---------- Request ----------

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

type InternalOptions = RequestOptions & { retryOn401?: boolean }

async function request<T>(
  method: string,
  path: string,
  { retryOn401 = true, ...options }: InternalOptions = {},
): Promise<T> {
  // `/auth/*` trả 401 khi sai mật khẩu hoặc hết phiên: đó là kết quả, không phải token hết hạn
  const canRetry = retryOn401 && !path.startsWith('/auth/')
  const sentToken = accessToken

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers: {
        // Endpoint chỉ trả text/plain (khóa VAPID) mà nhận Accept: application/json thì BE trả 406
        Accept: options.responseType === 'text' ? 'text/plain' : 'application/json',
        ...(options.body !== undefined && { 'Content-Type': 'application/json' }),
        ...(sentToken && { Authorization: `Bearer ${sentToken}` }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'same-origin',
      signal: options.signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(0, { title: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' })
  }

  if (response.status === 401 && canRetry) {
    // Token đã được đổi bởi lời gọi khác trong lúc chờ thì thử lại luôn, khỏi refresh thêm lần nữa
    const refreshed =
      accessToken !== sentToken && accessToken !== null ? true : (await refreshSession()) !== null
    if (refreshed) {
      try {
        return await request<T>(method, path, { ...options, retryOn401: false })
      } catch (error) {
        // Vừa refresh xong mà vẫn 401: token không dùng được nữa nên coi như hết phiên
        if (error instanceof ApiError && error.status === 401) expireSession()
        throw error
      }
    }
    expireSession()
  }

  if (!response.ok) throw new ApiError(response.status, await parseProblem(response))
  if (response.status === 204) return undefined as T
  const body = await response.text()
  if (options.responseType === 'text') return body as T
  // Endpoint kiểu void của BE trả 200 không có thân (không phải 204): đừng parse JSON rỗng
  return (body === '' ? undefined : JSON.parse(body)) as T
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
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, options),
}
