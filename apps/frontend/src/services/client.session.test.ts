import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, configureSession, getAccessToken, setAccessToken } from './client'

const session = (token: string) => ({
  accessToken: token,
  tokenType: 'Bearer',
  expiresIn: 900,
  user: { id: 1 },
})
const unauthorized = () => Response.json({ status: 401, code: 'UNAUTHENTICATED' }, { status: 401 })

let fetchMock: ReturnType<typeof vi.fn>
const authHeader = (call: number) =>
  ((fetchMock.mock.calls[call]?.[1] as RequestInit).headers as Record<string, string>).Authorization

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  setAccessToken(null)
})

afterEach(() => {
  vi.unstubAllGlobals()
  configureSession(null)
  setAccessToken(null)
})

describe('api client: phiên đăng nhập', () => {
  it('gắn Bearer khi đã có access token, không gắn khi chưa có', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({})))
    await api.get('/x')
    setAccessToken('abc')
    await api.get('/x')
    expect(authHeader(0)).toBeUndefined()
    expect(authHeader(1)).toBe('Bearer abc')
  })

  it('gặp 401 thì refresh một lần rồi thử lại bằng token mới', async () => {
    const onRefreshed = vi.fn()
    configureSession({ onRefreshed, onExpired: vi.fn() })
    setAccessToken('old')
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(Response.json(session('new')))
      .mockResolvedValueOnce(Response.json({ ok: true }))

    await expect(api.get('/members')).resolves.toEqual({ ok: true })
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      '/api/members',
      '/api/auth/refresh',
      '/api/members',
    ])
    expect(authHeader(2)).toBe('Bearer new')
    expect(getAccessToken()).toBe('new')
    expect(onRefreshed).toHaveBeenCalledOnce()
  })

  it('nhiều lời gọi 401 cùng lúc chỉ refresh một lần (refresh token xoay vòng)', async () => {
    setAccessToken('old')
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/auth/refresh') return Promise.resolve(Response.json(session('new')))
      return Promise.resolve(
        getAccessToken() === 'new' ? Response.json({ ok: true }) : unauthorized(),
      )
    })
    await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')])
    expect(fetchMock.mock.calls.filter((c) => c[0] === '/api/auth/refresh')).toHaveLength(1)
  })

  it('refresh bị từ chối thì báo hết phiên và ném lỗi 401 gốc', async () => {
    const onExpired = vi.fn()
    configureSession({ onRefreshed: vi.fn(), onExpired })
    setAccessToken('old')
    fetchMock.mockImplementation(() => Promise.resolve(unauthorized()))

    await expect(api.get('/members')).rejects.toMatchObject({ status: 401 })
    expect(onExpired).toHaveBeenCalledOnce()
    expect(getAccessToken()).toBeNull()
  })

  it('refresh xong mà thử lại vẫn 401 thì báo hết phiên', async () => {
    const onExpired = vi.fn()
    configureSession({ onRefreshed: vi.fn(), onExpired })
    setAccessToken('old')
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(Response.json(session('new')))
      .mockResolvedValueOnce(unauthorized())

    await expect(api.get('/members')).rejects.toMatchObject({ status: 401 })
    expect(onExpired).toHaveBeenCalledOnce()
    expect(getAccessToken()).toBeNull()
  })

  it('401 ở /auth/* (sai mật khẩu) không kích hoạt refresh', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { status: 401, code: 'INVALID_CREDENTIALS', detail: 'Email hoặc mật khẩu không đúng.' },
        { status: 401 },
      ),
    )
    const error = await api
      .post('/auth/login', { email: 'a@b.co', password: 'x' })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('INVALID_CREDENTIALS')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('mất mạng khi refresh thì không báo hết phiên (không đăng xuất oan)', async () => {
    const onExpired = vi.fn()
    configureSession({ onRefreshed: vi.fn(), onExpired })
    setAccessToken('old')
    fetchMock.mockResolvedValueOnce(unauthorized()).mockRejectedValueOnce(new TypeError('offline'))

    await expect(api.get('/members')).rejects.toMatchObject({ status: 0 })
    expect(onExpired).not.toHaveBeenCalled()
    expect(getAccessToken()).toBe('old')
  })
})
