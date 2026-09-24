import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from './client'

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('api client', () => {
  it('gọi qua base /api và bỏ tham số rỗng', async () => {
    const fetchMock = mockFetch(Response.json({ ok: true }))
    await api.get('/members', { query: { q: 'dang', page: 0, empty: '', none: undefined } })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/members?q=dang&page=0')
  })

  it('gửi body JSON kèm Content-Type', async () => {
    const fetchMock = mockFetch(Response.json({ id: 1 }, { status: 201 }))
    await api.post('/members', { fullName: 'Đặng Văn A' })
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"fullName":"Đặng Văn A"}')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
  })

  it('trả undefined với 204', async () => {
    mockFetch(new Response(null, { status: 204 }))
    await expect(api.delete('/x')).resolves.toBeUndefined()
  })

  it('đổi ProblemDetail thành ApiError kèm errors[]', async () => {
    mockFetch(
      Response.json(
        {
          status: 400,
          detail: 'Dữ liệu không hợp lệ.',
          code: 'VALIDATION_ERROR',
          errors: [{ field: 'fullName', message: 'Họ tên không được để trống' }],
        },
        { status: 400 },
      ),
    )
    const error = await api.post('/members', {}).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu không hợp lệ.',
      errors: [{ field: 'fullName', message: 'Họ tên không được để trống' }],
    })
  })

  it('body rỗng (ví dụ 401 của filter chain) vẫn ra ApiError với thông báo mặc định', async () => {
    mockFetch(new Response(null, { status: 401 }))
    const error = (await api.get('/me').catch((e: unknown) => e)) as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(401)
    expect(error.errors).toEqual([])
    expect(error.message).not.toBe('')
  })

  it('mất mạng thì ApiError status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const error = (await api.get('/me').catch((e: unknown) => e)) as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
  })
})
