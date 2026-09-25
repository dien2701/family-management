import type { AccountAction } from './api'

// Chuỗi UI của module admin (không dùng i18n, chỉ tiếng Việt)
export const adminStrings = {
  menu: 'Quản trị',
  menuDescription: 'Duyệt và quản lý tài khoản',
  accounts: {
    title: 'Quản lý tài khoản',
    tabsLabel: 'Nhóm tài khoản',
    tabWaiting: 'Chờ duyệt',
    tabAll: 'Tất cả',
    search: 'Tìm tài khoản',
    searchPlaceholder: 'Họ tên hoặc email',
    statusFilter: 'Trạng thái',
    roleFilter: 'Vai trò',
    allOption: 'Tất cả',
    listLabel: 'Danh sách tài khoản',
    registeredAt: (date: string) => `Đăng ký ${date}`,
    you: 'Bạn',
    loading: 'Đang tải danh sách tài khoản',
    loadFailed: 'Không tải được danh sách tài khoản.',
    retry: 'Thử lại',
    emptyWaiting: 'Không có tài khoản nào đang chờ duyệt',
    emptyWaitingHint: 'Khi có người đăng ký mới, tài khoản sẽ hiện ở đây.',
    emptyAll: 'Không có tài khoản phù hợp',
    emptyAllHint: 'Thử đổi từ khóa hoặc bộ lọc.',
    columns: {
      account: 'Tài khoản',
      role: 'Vai trò',
      status: 'Trạng thái',
      createdAt: 'Ngày đăng ký',
      actions: 'Thao tác',
    },
  },
  status: {
    waiting: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Không được duyệt',
    locked: 'Bị khóa',
  },
  role: { ADMIN: 'Admin', USER: 'User' },
  pagination: {
    label: 'Phân trang',
    first: 'Về trang đầu',
    previous: 'Trang trước',
    next: 'Trang sau',
    page: (page: number, total: number) => `Trang ${page}/${total}`,
    total: (count: number) => `${count} tài khoản`,
  },
  dialog: { cancel: 'Hủy' },
} as const

type ActionText = {
  label: string
  title: (name: string) => string
  description: string
  confirm: string
  /** Thao tác khó hoàn tác hoặc chặn người khác thì dùng nút đỏ. */
  danger: boolean
}

export const accountActionText: Record<AccountAction, ActionText> = {
  approve: {
    label: 'Duyệt',
    title: (name) => `Duyệt tài khoản ${name}?`,
    description: 'Người này sẽ xem được toàn bộ dữ liệu gia phả.',
    confirm: 'Duyệt',
    danger: false,
  },
  reject: {
    label: 'Từ chối',
    title: (name) => `Từ chối tài khoản ${name}?`,
    description:
      'Người này sẽ thấy thông báo không được duyệt và bị đăng xuất khỏi mọi thiết bị. Bạn có thể duyệt lại sau.',
    confirm: 'Từ chối',
    danger: true,
  },
  lock: {
    label: 'Khóa',
    title: (name) => `Khóa tài khoản ${name}?`,
    description:
      'Người này bị đăng xuất khỏi mọi thiết bị và không đăng nhập được cho tới khi bạn mở khóa.',
    confirm: 'Khóa',
    danger: true,
  },
  unlock: {
    label: 'Mở khóa',
    title: (name) => `Mở khóa tài khoản ${name}?`,
    description: 'Người này đăng nhập và dùng lại được như trước.',
    confirm: 'Mở khóa',
    danger: false,
  },
  'grant-admin': {
    label: 'Cấp Admin',
    title: (name) => `Cấp quyền Admin cho ${name}?`,
    description:
      'Admin có quyền như bạn: duyệt tài khoản, cấp và gỡ quyền Admin. Người này cần đăng nhập lại để quyền có hiệu lực.',
    confirm: 'Cấp Admin',
    danger: false,
  },
  'revoke-admin': {
    label: 'Gỡ Admin',
    title: (name) => `Gỡ quyền Admin của ${name}?`,
    description: 'Người này trở thành User thường và cần đăng nhập lại.',
    confirm: 'Gỡ Admin',
    danger: true,
  },
}

/** Thông báo theo mã lỗi của backend (AdminAccountService); mã lạ thì dùng thông báo máy chủ trả về. */
export const accountErrorText: Record<string, string> = {
  LAST_ADMIN:
    'Đây là Admin cuối cùng của hệ thống. Hãy cấp quyền Admin cho người khác trước.',
  SELF_ACTION_FORBIDDEN: 'Bạn không thể tự thực hiện thao tác này với chính mình.',
  INVALID_ACCOUNT_STATE:
    'Trạng thái tài khoản đã thay đổi nên không thực hiện được. Danh sách đã được tải lại.',
  ACCOUNT_NOT_FOUND: 'Không tìm thấy tài khoản này. Danh sách đã được tải lại.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
}
