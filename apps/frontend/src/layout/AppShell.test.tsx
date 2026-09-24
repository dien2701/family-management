import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/context/authContext'
import { routes } from '@/pages/routes'

// Người dùng đã đăng nhập và thuộc một dòng họ, để route guard cho vào khung chính
const auth: AuthContextValue = {
  status: 'authenticated',
  user: {
    id: 1,
    fullName: 'Đặng Văn An',
    email: 'an@example.com',
    systemRole: 'USER',
    familyId: 1,
  },
  setSession: () => {},
  refresh: async () => true,
  logout: async () => {},
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AuthContext value={auth}>
      <RouterProvider router={router} />
    </AuthContext>,
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
    expect(labels).toEqual(['Tổng quan', 'Cây', 'Thành viên', 'Lịch', 'Thêm'])
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
    await userEvent.click(within(nav).getByRole('link', { name: 'Lịch' }))
    expect(router.state.location.pathname).toBe('/lich')
    expect(screen.getByRole('heading', { level: 1, name: 'Lịch' })).toBeInTheDocument()
    expect(document.title).toBe('Lịch · Tộc Phả')
  })
})

describe('AppShell', () => {
  it('có Sidebar với cùng 5 mục và nội dung chính', () => {
    renderAt('/cay')
    const sidebar = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(sidebar).getAllByRole('link')).toHaveLength(5)
    expect(within(sidebar).getByRole('link', { name: 'Cây' })).toHaveAttribute(
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
