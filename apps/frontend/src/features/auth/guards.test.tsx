import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type InitialEntry } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/context/authContext'
import { routes } from '@/pages/routes'
import type { Me } from '@/types/api'

type Session = { status?: AuthContextValue['status']; user?: Me; loggedOut?: boolean }

function renderAt(entry: InitialEntry, { status, user, loggedOut }: Session) {
  const auth: AuthContextValue = {
    status: status ?? (user ? 'authenticated' : 'anonymous'),
    user: user ?? null,
    loggedOut,
    setSession: () => {},
    refresh: async () => true,
    logout: async () => {},
  }
  const router = createMemoryRouter(routes, { initialEntries: [entry] })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext value={auth}>
        <RouterProvider router={router} />
      </AuthContext>
    </QueryClientProvider>,
  )
  return router.state.location
}

const withFamily: Me = { id: 1, fullName: 'An', systemRole: 'USER', familyId: 1 }
const noFamily: Me = { id: 2, fullName: 'Bình', systemRole: 'USER' }
const admin: Me = { id: 3, fullName: 'Cường', systemRole: 'ADMIN' }

describe('route guard', () => {
  it('chưa đăng nhập: chuyển tới /dang-nhap và nhớ trang định vào', () => {
    const location = renderAt('/cay', {})
    expect(location.pathname).toBe('/dang-nhap')
    expect(location.state).toEqual({ from: '/cay' })
    expect(screen.getByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeInTheDocument()
  })

  it('đăng xuất chủ động thì không nhớ trang để quay lại', () => {
    const location = renderAt('/them', { status: 'anonymous', loggedOut: true })
    expect(location.pathname).toBe('/dang-nhap')
    expect(location.state).toBeNull()
  })

  it('đang khôi phục phiên: hiện màn hình chờ, không chuyển trang', () => {
    const location = renderAt('/cay', { status: 'loading' })
    expect(location.pathname).toBe('/cay')
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('có family: vào được app; bị đẩy khỏi /dang-nhap về Dashboard', () => {
    expect(renderAt('/cay', { user: withFamily }).pathname).toBe('/cay')
    expect(renderAt('/dang-nhap', { user: withFamily }).pathname).toBe('/')
  })

  it('chưa có family: trang trong app và trang đăng ký đều chuyển về /bat-dau', () => {
    expect(renderAt('/', { user: noFamily }).pathname).toBe('/bat-dau')
    expect(renderAt('/thanh-vien', { user: noFamily }).pathname).toBe('/bat-dau')
    expect(renderAt('/dang-ky', { user: noFamily }).pathname).toBe('/bat-dau')
  })

  it('Admin vào /quan-tri; người thường không vào được /quan-tri', () => {
    expect(renderAt('/', { user: admin }).pathname).toBe('/quan-tri')
    expect(renderAt('/bat-dau', { user: admin }).pathname).toBe('/quan-tri')
    expect(renderAt('/quan-tri', { user: withFamily }).pathname).toBe('/')
  })

  it('đăng nhập xong thì về trang định vào nếu được phép', () => {
    const location = renderAt(
      { pathname: '/dang-nhap', state: { from: '/lich' } },
      { user: withFamily },
    )
    expect(location.pathname).toBe('/lich')
  })

  it('bỏ qua đường dẫn ngoài trong state.from', () => {
    const location = renderAt(
      { pathname: '/dang-nhap', state: { from: 'https://evil.com' } },
      { user: withFamily },
    )
    expect(location.pathname).toBe('/')
  })
})
