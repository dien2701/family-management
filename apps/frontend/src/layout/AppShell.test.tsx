import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/context/authContext'
import { routes } from '@/pages/routes'

// Người dùng đã đăng nhập và được duyệt, để route guard cho vào khung chính
const auth: AuthContextValue = {
  status: 'authenticated',
  user: {
    id: 1,
    fullName: 'Đặng Văn An',
    email: 'an@example.com',
    systemRole: 'USER',
    approvalStatus: 'APPROVED',
  },
  setSession: () => {},
  refresh: async () => true,
  updateUser: () => {},
  logout: async () => {},
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext value={auth}>
        <RouterProvider router={router} />
      </AuthContext>
    </QueryClientProvider>,
  )
  return router
}

describe('BottomNav', () => {
  it('có đúng 5 mục theo thứ tự trong DESIGN', () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: 'Điều hướng dưới' })
    const labels = within(nav)
      .getAllByRole('link')
      .map((a) => a.textContent)
    expect(labels).toEqual(['Tổng quan', 'Cây gia phả', 'Thành viên', 'Sự kiện', 'Thêm'])
  })

  it('đánh dấu mục đang chọn bằng aria-current', () => {
    renderAt('/thanh-vien')
    const nav = screen.getByRole('navigation', { name: 'Điều hướng dưới' })
    expect(within(nav).getByRole('link', { name: 'Thành viên' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByRole('link', { name: 'Tổng quan' })).not.toHaveAttribute('aria-current')
  })

  it('bấm một mục thì đổi URL và tiêu đề trang', async () => {
    const router = renderAt('/')
    const nav = screen.getByRole('navigation', { name: 'Điều hướng dưới' })
    await userEvent.click(within(nav).getByRole('link', { name: 'Sự kiện' }))
    expect(router.state.location.pathname).toBe('/lich')
    expect(screen.getByRole('heading', { level: 1, name: 'Sự kiện' })).toBeInTheDocument()
    expect(document.title).toBe('Sự kiện · Tộc Phả')
  })
})

describe('AppShell', () => {
  it('có Sidebar với cùng 5 mục và nội dung chính', () => {
    renderAt('/cay')
    const sidebar = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(sidebar).getAllByRole('link')).toHaveLength(6)
    expect(within(sidebar).getByRole('link', { name: 'Cây gia phả' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('đường dẫn không tồn tại hiện trang 404 trong khung ứng dụng', () => {
    renderAt('/abc')
    expect(
      screen.getByRole('heading', { level: 2, name: 'Không tìm thấy trang' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Về Tổng quan' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('navigation', { name: 'Điều hướng dưới' })).toBeInTheDocument()
  })
})
