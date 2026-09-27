// client.ts ở chế độ giả lập: endpoint có handler chạy ở trình duyệt, còn lại gọi backend thật.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from '../client'
import { setMockDelay } from '.'
import { forgetMemoryStore } from './store'

const me = { id: 2, systemRole: 'USER', approvalStatus: 'APPROVED', status: 'ACTIVE' }

function stubFetch() {
  const fetchMock = vi.fn(async (url: string) =>
    String(url).endsWith('/api/me') ? Response.json(me) : Response.json({ ok: 'backend-thật' }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  setMockDelay(0)
  localStorage.clear()
  forgetMemoryStore()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('client ở chế độ giả lập', () => {
  it('endpoint có handler: chạy handler, chỉ gọi backend thật để lấy /api/me', async () => {
    vi.stubEnv('VITE_API_MODE', 'mock')
    const fetchMock = stubFetch()
    const page = await api.get<{ totalElements: number }>('/members', {
      query: { q: 'nguyen van tham' },
    })
    expect(page.totalElements).toBe(1)
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/me'])
  })

  it('endpoint không có handler (auth, me, lịch âm): gọi backend thật', async () => {
    vi.stubEnv('VITE_API_MODE', 'mock')
    const fetchMock = stubFetch()
    await expect(api.get('/calendar/convert', { query: { solar: '2026-02-17' } })).resolves.toEqual(
      {
        ok: 'backend-thật',
      },
    )
    await expect(api.post('/auth/login', { email: 'a@b.co', password: 'x' })).resolves.toEqual({
      ok: 'backend-thật',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('handler ném ProblemDetail thì client ném ApiError (404 MEMBER_NOT_FOUND)', async () => {
    vi.stubEnv('VITE_API_MODE', 'mock')
    stubFetch()
    const error = await api.get('/members/999').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, code: 'MEMBER_NOT_FOUND' })
  })

  it('không bật VITE_API_MODE=mock thì mọi request đều đi backend thật', async () => {
    const fetchMock = stubFetch()
    await api.get('/members/1')
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/members/1'])
  })
})
