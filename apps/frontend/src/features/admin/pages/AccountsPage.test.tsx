import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/context/authContext'
import { routes } from '@/pages/routes'
import { ApiError, api } from '@/services/client'
import type { AccountAdmin, AccountAdminPage, AccountListQuery, Me } from '@/types/api'

const self: Me = { id: 1, fullName: 'Dũng', systemRole: 'ADMIN', approvalStatus: 'APPROVED' }

const acc = (over: Partial<AccountAdmin>): AccountAdmin => ({
  systemRole: 'USER',
  status: 'ACTIVE',
  approvalStatus: 'APPROVED',
  createdAt: '2026-09-20T03:00:00Z',
  ...over,
})

const DUNG = acc({ id: 1, fullName: 'Dũng', email: 'dung@example.com', systemRole: 'ADMIN' })
const BINH = acc({ id: 5, fullName: 'Bình', email: 'binh@example.com', approvalStatus: 'WAITING' })
const CHI = acc({ id: 6, fullName: 'Chi', email: 'chi@example.com' })
const KHOA = acc({ id: 9, fullName: 'Khoa', email: 'khoa@example.com', systemRole: 'ADMIN' })
const EM = acc({ id: 8, fullName: 'Em', email: 'em@example.com', status: 'LOCKED' })

const pageOf = (items: AccountAdmin[]): AccountAdminPage => ({
  items,
  page: 0,
  size: 20,
  totalElements: items.length,
  totalPages: items.length ? 1 : 0,
})

/** Máy chủ giả: tab Chờ duyệt (approval=WAITING) chỉ có Bình, còn lại là toàn bộ danh sách. */
function fakeServer(waiting: AccountAdmin[] = [BINH]) {
  return async (path: string, options?: { query?: AccountListQuery }) => {
    if (path !== '/admin/accounts') throw new Error(`Không giả lập ${path}`)
    const query = options?.query ?? {}
    return pageOf(query.approval === 'WAITING' ? waiting : [DUNG, BINH, CHI, KHOA, EM])
  }
}

function renderAccounts(entry = '/quan-tri/tai-khoan') {
  const auth: AuthContextValue = {
    status: 'authenticated',
    user: self,
    setSession: () => {},
    refresh: async () => true,
    updateUser: () => {},
    logout: async () => {},
  }
  const router = createMemoryRouter(routes, { initialEntries: [entry] })
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthContext value={auth}>
        <RouterProvider router={router} />
      </AuthContext>
    </QueryClientProvider>,
  )
  return router
}

// Trang có cả dạng thẻ (điện thoại) và dạng bảng (máy tính); CSS ẩn một bên nên jsdom thấy cả hai
const cardList = () => screen.getByRole('list', { name: 'Danh sách tài khoản' })
const dialog = () => screen.getByRole('dialog')

let get: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  get = vi.spyOn(api, 'get').mockImplementation(fakeServer() as never)
})
afterEach(() => vi.restoreAllMocks())

describe('Quản trị > Tài khoản', () => {
  it('mở ở tab Chờ duyệt: hỏi backend approval=WAITING, có badge số và nút Duyệt/Từ chối', async () => {
    renderAccounts()
    await within(await screen.findByRole('list', { name: 'Danh sách tài khoản' })).findByText('Bình')

    expect(get).toHaveBeenCalledWith(
      '/admin/accounts',
      expect.objectContaining({ query: expect.objectContaining({ approval: 'WAITING' }) }),
    )
    const waitingTab = screen.getByRole('tab', { name: /Chờ duyệt/ })
    expect(waitingTab).toHaveAttribute('aria-selected', 'true')
    expect(waitingTab).toHaveTextContent('1')
    expect(within(cardList()).getByRole('button', { name: 'Duyệt Bình' })).toBeInTheDocument()
    expect(within(cardList()).getByRole('button', { name: 'Từ chối Bình' })).toBeInTheDocument()
  })

  it('không có ai chờ duyệt thì hiện trạng thái rỗng', async () => {
    get.mockImplementation(fakeServer([]) as never)
    renderAccounts()
    expect(await screen.findByText('Không có tài khoản nào đang chờ duyệt')).toBeInTheDocument()
  })

  it('duyệt phải qua hộp xác nhận rồi mới gọi POST /admin/accounts/{id}/approve', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ ...BINH, approvalStatus: 'APPROVED' } as never)
    renderAccounts()
    const list = await screen.findByRole('list', { name: 'Danh sách tài khoản' })
    await userEvent.click(await within(list).findByRole('button', { name: 'Duyệt Bình' }))

    expect(post).not.toHaveBeenCalled()
    expect(within(dialog()).getByRole('heading', { name: 'Duyệt tài khoản Bình?' })).toBeInTheDocument()
    await userEvent.click(within(dialog()).getByRole('button', { name: 'Duyệt' }))

    await waitFor(() => expect(post).toHaveBeenCalledWith('/admin/accounts/5/approve'))
  })

  it('Hủy thì đóng hộp xác nhận và không gọi API', async () => {
    const post = vi.spyOn(api, 'post')
    renderAccounts()
    const list = await screen.findByRole('list', { name: 'Danh sách tài khoản' })
    await userEvent.click(await within(list).findByRole('button', { name: 'Từ chối Bình' }))
    await userEvent.click(within(dialog()).getByRole('button', { name: 'Hủy' }))

    expect(post).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('tab Tất cả: mỗi trạng thái có đúng các nút của nó', async () => {
    renderAccounts('/quan-tri/tai-khoan?tab=all')
    const list = await screen.findByRole('list', { name: 'Danh sách tài khoản' })
    await within(list).findByText('Chi')

    expect(within(list).getByRole('button', { name: 'Cấp Admin Chi' })).toBeInTheDocument()
    expect(within(list).getByRole('button', { name: 'Khóa Chi' })).toBeInTheDocument()
    expect(within(list).getByRole('button', { name: 'Gỡ Admin Khoa' })).toBeInTheDocument()
    expect(within(list).getByRole('button', { name: 'Mở khóa Em' })).toBeInTheDocument()
    expect(within(list).getByRole('button', { name: 'Từ chối Bình' })).toBeInTheDocument()
  })

  it('dòng của chính mình: có nhãn "Bạn", không có nút tự gỡ quyền hay tự khóa', async () => {
    renderAccounts('/quan-tri/tai-khoan?tab=all')
    const list = await screen.findByRole('list', { name: 'Danh sách tài khoản' })
    await within(list).findByText('Dũng')

    expect(within(list).getByText('Bạn')).toBeInTheDocument()
    expect(within(list).queryByRole('button', { name: /Dũng/ })).not.toBeInTheDocument()
  })

  it('lỗi LAST_ADMIN hiện đúng thông báo trong hộp xác nhận', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(
      new ApiError(409, { code: 'LAST_ADMIN', detail: 'chi tiết của máy chủ' }),
    )
    renderAccounts('/quan-tri/tai-khoan?tab=all')
    const list = await screen.findByRole('list', { name: 'Danh sách tài khoản' })
    await userEvent.click(await within(list).findByRole('button', { name: 'Gỡ Admin Khoa' }))
    await userEvent.click(within(dialog()).getByRole('button', { name: 'Gỡ Admin' }))

    expect(await within(dialog()).findByRole('alert')).toHaveTextContent(
      'Đây là Admin cuối cùng của hệ thống',
    )
  })

  it('lỗi SELF_ACTION_FORBIDDEN hiện đúng thông báo', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(new ApiError(409, { code: 'SELF_ACTION_FORBIDDEN' }))
    renderAccounts('/quan-tri/tai-khoan?tab=all')
    const list = await screen.findByRole('list', { name: 'Danh sách tài khoản' })
    await userEvent.click(await within(list).findByRole('button', { name: 'Khóa Chi' }))
    await userEvent.click(within(dialog()).getByRole('button', { name: 'Khóa' }))

    expect(await within(dialog()).findByRole('alert')).toHaveTextContent(
      'Bạn không thể tự thực hiện thao tác này với chính mình.',
    )
  })

  it('lọc theo trạng thái và vai trò gửi đúng tham số, ghi lên URL', async () => {
    const router = renderAccounts('/quan-tri/tai-khoan?tab=all')
    await screen.findByRole('list', { name: 'Danh sách tài khoản' })

    await userEvent.selectOptions(screen.getByLabelText('Trạng thái'), 'LOCKED')
    await userEvent.selectOptions(screen.getByLabelText('Vai trò'), 'ADMIN')

    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith(
        '/admin/accounts',
        expect.objectContaining({
          query: expect.objectContaining({ status: 'LOCKED', role: 'ADMIN' }),
        }),
      ),
    )
    expect(router.state.location.search).toContain('status=LOCKED')
    expect(router.state.location.search).toContain('role=ADMIN')
  })

  it('ô tìm gửi `q` sau khi ngừng gõ', async () => {
    renderAccounts()
    await screen.findByRole('list', { name: 'Danh sách tài khoản' })

    await userEvent.type(screen.getByLabelText('Tìm tài khoản'), 'binh')

    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith(
        '/admin/accounts',
        expect.objectContaining({ query: expect.objectContaining({ q: 'binh' }) }),
      ),
    )
  })

  it('lỗi tải danh sách thì báo lỗi và cho thử lại', async () => {
    get.mockRejectedValueOnce(new ApiError(500, {}))
    renderAccounts()
    expect(await screen.findByText('Không tải được danh sách tài khoản.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(
      await within(await screen.findByRole('list', { name: 'Danh sách tài khoản' })).findByText('Bình'),
    ).toBeInTheDocument()
  })
})
