import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMemo, useState, type ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/context/authContext'
import { routes } from '@/pages/routes'
import { api } from '@/services/client'
import type { Me } from '@/types/api'
import { APPROVAL_POLL_MS } from '../hooks'

const waiting: Me = {
  id: 7,
  fullName: 'Bình',
  email: 'binh@example.com',
  systemRole: 'USER',
  approvalStatus: 'WAITING',
}
const approved: Me = { ...waiting, approvalStatus: 'APPROVED' }
const rejected: Me = { ...waiting, approvalStatus: 'REJECTED' }

// Phiên có trạng thái thật để route guard phản ứng khi `updateUser`/`refresh` đổi người dùng
function SessionHarness({
  initial,
  onRefresh,
  children,
}: {
  initial: Me
  onRefresh: () => void
  children: ReactNode
}) {
  const [user, setUser] = useState<Me>(initial)
  const value = useMemo<AuthContextValue>(
    () => ({
      status: 'authenticated',
      user,
      setSession: () => {},
      // Sau khi được duyệt, token mới mang claim đã duyệt
      refresh: async () => {
        onRefresh()
        setUser((current) => ({ ...current, approvalStatus: 'APPROVED' }))
        return true
      },
      updateUser: setUser,
      logout: async () => {},
    }),
    [user, onRefresh],
  )
  return <AuthContext value={value}>{children}</AuthContext>
}

let serverMe: Me
const onRefresh = vi.fn()

function renderWaiting(initial: Me = waiting) {
  const router = createMemoryRouter(routes, { initialEntries: ['/cho-duyet'] })
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SessionHarness initial={initial} onRefresh={onRefresh}>
        <RouterProvider router={router} />
      </SessionHarness>
    </QueryClientProvider>,
  )
  return router
}

beforeEach(() => {
  serverMe = waiting
  onRefresh.mockClear()
  vi.spyOn(api, 'get').mockImplementation(async () => serverMe as never)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('trang chờ duyệt', () => {
  it('giải thích ngắn, nêu email đang đăng nhập và có nút Đăng xuất', async () => {
    renderWaiting()
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Đang chờ Admin duyệt' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Đăng nhập bằng binh@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument()
    // Không cần đồng ý chính sách thì không hiện form
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('được duyệt thì đổi token rồi tự vào Tổng quan (nút Kiểm tra lại)', async () => {
    const router = renderWaiting()
    await screen.findByRole('heading', { level: 2, name: 'Đang chờ Admin duyệt' })
    expect(router.state.location.pathname).toBe('/cho-duyet')

    serverMe = approved
    await userEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(onRefresh).toHaveBeenCalled()
  })

  it('tự hỏi lại sau mỗi 30 giây, không cần bấm gì', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const router = renderWaiting()
    await screen.findByRole('heading', { level: 2, name: 'Đang chờ Admin duyệt' })
    const callsBefore = vi.mocked(api.get).mock.calls.length

    serverMe = approved
    await act(async () => {
      await vi.advanceTimersByTimeAsync(APPROVAL_POLL_MS + 100)
    })

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('bị từ chối thì chuyển sang trang không được duyệt, không đổi token', async () => {
    const router = renderWaiting()
    await screen.findByRole('heading', { level: 2, name: 'Đang chờ Admin duyệt' })

    serverMe = rejected
    await userEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/khong-duoc-duyet'))
    expect(onRefresh).not.toHaveBeenCalled()
    // Địa chỉ đổi trước khi React kịp vẽ trang mới (<Navigate> vẽ rỗng một nhịp) nên chờ bằng findBy
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Tài khoản không được duyệt' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument()
  })
})

describe('đồng ý chính sách (Google lần đầu)', () => {
  const needsConsent: Me = { ...waiting, consentRequired: true }

  beforeEach(() => {
    serverMe = needsConsent
  })

  it('bắt tick đồng ý: chưa tick thì báo lỗi và không gọi API', async () => {
    const post = vi.spyOn(api, 'post')
    renderWaiting(needsConsent)
    await screen.findByRole('checkbox')

    await userEvent.click(screen.getByRole('button', { name: 'Đồng ý' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Bạn cần đồng ý chính sách bảo mật')
    expect(post).not.toHaveBeenCalled()
    // Có link tới chính sách, mở tab mới
    const link = screen.getByRole('link', { name: 'Chính sách bảo mật' })
    expect(link).toHaveAttribute('href', '/chinh-sach-bao-mat')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('tick rồi gửi thì gọi POST /me/consent và ẩn form', async () => {
    const consented: Me = { ...waiting, consentRequired: false }
    // Máy chủ chỉ đổi `consentRequired` sau khi nhận POST, nên form không biến mất trước khi người dùng tick
    const post = vi.spyOn(api, 'post').mockImplementation(async () => {
      serverMe = consented
      return consented as never
    })
    renderWaiting(needsConsent)

    await userEvent.click(await screen.findByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Đồng ý' }))

    await waitFor(() => expect(post).toHaveBeenCalledWith('/me/consent', { acceptTerms: true }))
    await waitFor(() => expect(screen.queryByRole('checkbox')).not.toBeInTheDocument())
  })
})
