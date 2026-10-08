import type { AccountAction } from './api'

// Chuỗi UI của module admin (không dùng i18n, chỉ tiếng Việt)
export const adminStrings = {
  menu: 'Quản trị',
  menuDescription: 'Duyệt tài khoản và yêu cầu liên kết',
  nav: {
    label: 'Khu quản trị',
    accounts: 'Người dùng',
    linkRequests: 'Yêu cầu liên kết',
  },
  accounts: {
    title: 'Người dùng',
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
      member: 'Thành viên',
      createdAt: 'Ngày đăng ký',
      actions: 'Thao tác',
    },
    notLinked: 'Chưa liên kết thành viên',
    memberLabel: 'Thành viên',
  },
  link: {
    assign: 'Gán thành viên',
    unassign: 'Hủy liên kết',
    assignFor: (name: string) => `Gán thành viên cho ${name}`,
    unassignFor: (name: string) => `Hủy liên kết của ${name}`,
    pickerTitle: (name: string) => `Gán thành viên cho ${name}`,
    pickerDescription:
      'Chọn thành viên mà tài khoản này chính là. Thành viên đã có tài khoản khác thì không gán được. Hồ sơ chưa có email sẽ được chép email của tài khoản sang.',
    pickerConfirm: 'Gán thành viên',
    unlinkTitle: (name: string) => `Hủy liên kết của ${name}?`,
    unlinkDescription: (account: string, member: string) =>
      `Tài khoản ${account} sẽ không còn là thành viên "${member}" và không sửa được hồ sơ đó nữa. Email đã chép sang hồ sơ vẫn giữ nguyên.`,
    unlinkConfirm: 'Hủy liên kết',
  },
  picker: {
    search: 'Tìm thành viên',
    searchPlaceholder: 'Gõ họ tên, không cần dấu',
    results: 'Kết quả tìm thành viên',
    loading: 'Đang tìm thành viên...',
    loadFailed: 'Không tìm được thành viên.',
    retry: 'Thử lại',
    empty: 'Chưa có thành viên nào để chọn.',
    noMatch: 'Không tìm thấy thành viên phù hợp. Thử gõ ngắn hơn.',
    truncated: (shown: number, total: number) =>
      `Đang hiện ${shown}/${total} người. Gõ thêm để thu hẹp.`,
    selected: (name: string) => `Đã chọn: ${name}`,
    clearSelection: 'Bỏ chọn',
    cancel: 'Hủy',
  },
  linkRequests: {
    title: 'Yêu cầu liên kết',
    description: 'Các tài khoản đã gửi "Đây là tôi" và đang chờ bạn duyệt.',
    listLabel: 'Danh sách yêu cầu liên kết',
    loading: 'Đang tải danh sách yêu cầu liên kết',
    loadFailed: 'Không tải được danh sách yêu cầu liên kết.',
    retry: 'Thử lại',
    empty: 'Không có yêu cầu nào đang chờ duyệt',
    emptyHint: 'Khi có tài khoản gửi "Đây là tôi", yêu cầu sẽ hiện ở đây.',
    columns: {
      account: 'Tài khoản',
      member: 'Muốn liên kết với',
      sentAt: 'Ngày gửi',
      actions: 'Thao tác',
    },
    sentAt: (date: string) => `Gửi ${date}`,
    wantsMember: 'Muốn liên kết với',
    approve: 'Duyệt',
    reject: 'Từ chối',
    approveFor: (account: string) => `Duyệt liên kết của ${account}`,
    rejectFor: (account: string) => `Từ chối liên kết của ${account}`,
    approveTitle: 'Duyệt yêu cầu liên kết?',
    approveDescription: (account: string, member: string) =>
      `Tài khoản ${account} sẽ là thành viên "${member}" và tự sửa được hồ sơ, người thân và ảnh đại diện của mình. Hồ sơ chưa có email sẽ được chép email của tài khoản sang.`,
    approveConfirm: 'Duyệt',
    rejectTitle: 'Từ chối yêu cầu liên kết?',
    rejectDescription: (account: string, member: string) =>
      `Yêu cầu của tài khoản ${account} liên kết với "${member}" sẽ bị từ chối. Tài khoản này có thể gửi yêu cầu khác.`,
    rejectConfirm: 'Từ chối',
    cancel: 'Hủy',
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
  MEMBER_ALREADY_LINKED: 'Thành viên này đã có tài khoản khác liên kết nên không gán được.',
  ACCOUNT_ALREADY_LINKED: 'Tài khoản này đã liên kết với một thành viên. Hãy hủy liên kết cũ trước.',
  NOT_LINKED: 'Tài khoản này chưa liên kết với thành viên nào. Danh sách đã được tải lại.',
  MEMBER_NOT_FOUND: 'Không tìm thấy thành viên này. Danh sách đã được tải lại.',
  LINK_REQUEST_NOT_FOUND: 'Không tìm thấy yêu cầu này. Danh sách đã được tải lại.',
  LINK_REQUEST_NOT_PENDING: 'Yêu cầu này đã được xử lý rồi. Danh sách đã được tải lại.',
}
