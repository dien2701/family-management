import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type InitialEntry } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/context/authContext'
import { routes } from '@/pages/routes'
import { api } from '@/services/client'
import type { Me } from '@/types/api'

type Session = { status?: AuthContextValue['status']; user?: Me; loggedOut?: boolean }

function renderAt(entry: InitialEntry, { status, user, loggedOut }: Session) {
  const auth: AuthContextValue = {
    status: status ?? (user ? 'authenticated' : 'anonymous'),
    user: user ?? null,
    loggedOut,
    setSession: () => {},
    refresh: async () => true,
    updateUser: () => {},
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

const approved: Me = { id: 1, fullName: 'An', systemRole: 'USER', approvalStatus: 'APPROVED' }
const waiting: Me = { id: 2, fullName: 'Bình', systemRole: 'USER', approvalStatus: 'WAITING' }
const admin: Me = { id: 4, fullName: 'Dũng', systemRole: 'ADMIN', approvalStatus: 'APPROVED' }

beforeEach(() => {
  // Các trang này gọi API thật; test chỉ xem route nên trả `/me` còn chờ duyệt và danh sách tài khoản rỗng
  vi.spyOn(api, 'get').mockImplementation(async (path: string) =>
    path === '/me'
      ? ({ approvalStatus: 'WAITING' } as never)
      : ({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } as never),
  )
})

afterEach(() => vi.restoreAllMocks())

describe('route guard: đăng nhập', () => {
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

  it('đăng nhập xong thì về trang định vào nếu được phép', () => {
    const location = renderAt(
      { pathname: '/dang-nhap', state: { from: '/lich' } },
      { user: approved },
    )
    expect(location.pathname).toBe('/lich')
  })

  it('bỏ qua đường dẫn ngoài trong state.from', () => {
    const location = renderAt(
      { pathname: '/dang-nhap', state: { from: 'https://evil.com' } },
      { user: approved },
    )
    expect(location.pathname).toBe('/')
  })
})

describe('route guard: trạng thái duyệt', () => {
  it('đã duyệt: vào được app, bị đẩy khỏi /dang-nhap và các trang chờ về Tổng quan', () => {
    expect(renderAt('/cay', { user: approved }).pathname).toBe('/cay')
    expect(renderAt('/dang-nhap', { user: approved }).pathname).toBe('/')
    expect(renderAt('/cho-duyet', { user: approved }).pathname).toBe('/')
    expect(renderAt('/khong-duoc-duyet', { user: approved }).pathname).toBe('/')
  })

  it('chờ duyệt vẫn đọc được trang Chính sách bảo mật (trang công khai)', () => {
    expect(renderAt('/chinh-sach-bao-mat', { user: waiting }).pathname).toBe('/chinh-sach-bao-mat')
  })

  it('Admin dùng chung khung app: vào Tổng quan, không có khu riêng', () => {
    expect(renderAt('/', { user: admin }).pathname).toBe('/')
    expect(renderAt('/dang-nhap', { user: admin }).pathname).toBe('/')
  })

  it('đường dẫn cũ của dòng họ không còn: /bat-dau, /moi/:code, /them/dong-ho đều là 404', () => {
    for (const path of ['/bat-dau', '/moi/ABCD2345', '/them/dong-ho']) {
      renderAt(path, { user: approved })
      expect(
        screen.getByRole('heading', { level: 2, name: 'Không tìm thấy trang' }),
      ).toBeInTheDocument()
      document.body.innerHTML = ''
    }
  })
})

describe('khu Quản trị', () => {
  it('menu Quản trị: Admin thấy ở Sidebar và trang Thêm, User không thấy', () => {
    renderAt('/them', { user: admin })
    const sidebar = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(sidebar).getByRole('link', { name: 'Quản trị' })).toHaveAttribute(
      'href',
      '/quan-tri',
    )
    const more = screen.getByRole('navigation', { name: 'Các mục khác' })
    expect(within(more).getByRole('link', { name: /Quản trị/ })).toBeInTheDocument()
    // Thanh dưới trên điện thoại vẫn đúng 5 mục
    const bottom = screen.getByRole('navigation', { name: 'Điều hướng dưới' })
    expect(within(bottom).getAllByRole('link')).toHaveLength(5)
  })

  it('menu Quản trị ẩn với User ở cả Sidebar lẫn trang Thêm', () => {
    renderAt('/them', { user: approved })
    const sidebar = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(sidebar).queryByRole('link', { name: 'Quản trị' })).not.toBeInTheDocument()
    const more = screen.getByRole('navigation', { name: 'Các mục khác' })
    expect(within(more).queryByRole('link', { name: /Quản trị/ })).not.toBeInTheDocument()
    expect(within(more).queryByRole('link', { name: /Dòng họ/ })).not.toBeInTheDocument()
  })
})
