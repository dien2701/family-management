// Chuỗi UI của module family (không dùng i18n, chỉ tiếng Việt)

// Phiên bản chính sách hiện hành. Backend đọc từ `app.policy.version` (mặc định "1.0") và chưa có API trả về,
// nên khi đổi bên đó phải đổi cả ở đây.
export const POLICY_VERSION = '1.0'

export const familyStrings = {
  onboarding: {
    title: 'Chào mừng bạn đến với Tộc Phả',
    description: 'Tạo dòng họ mới, hoặc tham gia dòng họ đã có bằng mã mời.',
    tabsLabel: 'Chọn cách bắt đầu',
    tabJoin: 'Nhập mã mời',
    tabCreate: 'Tạo dòng họ',
  },
  fields: {
    name: 'Tên dòng họ',
    originPlace: 'Quê quán',
    description: 'Mô tả',
    code: 'Mã mời',
  },
  hints: {
    originPlace: 'Không bắt buộc.',
    description: 'Không bắt buộc. Vài dòng giới thiệu về dòng họ.',
    code: 'Gồm 8 ký tự do người quản lý dòng họ gửi cho bạn.',
  },
  create: {
    submit: 'Tạo dòng họ',
    note: 'Bạn sẽ là người quản lý của dòng họ này.',
  },
  join: {
    submit: 'Tham gia dòng họ',
  },
  consent: {
    before: 'Tôi đồng ý cho hệ thống thu thập và xử lý dữ liệu cá nhân theo ',
    link: 'Chính sách bảo mật',
    after: (version: string) => ` (phiên bản ${version}).`,
    required: 'Bạn cần đồng ý chính sách bảo mật để tiếp tục.',
  },
  invite: {
    title: 'Lời mời tham gia dòng họ',
    description: 'Bạn được mời tham gia một dòng họ trên Tộc Phả. Kiểm tra mã mời rồi xác nhận.',
    alreadyMember: 'Bạn đã thuộc một dòng họ',
    alreadyMemberDescription:
      'Mỗi tài khoản chỉ thuộc một dòng họ. Muốn tham gia dòng họ này, hãy rời dòng họ hiện tại trước.',
    adminTitle: 'Tài khoản quản trị không tham gia dòng họ',
    adminDescription: 'Hãy dùng tài khoản thường để nhận lời mời.',
    toHome: 'Về trang chính',
    toAdmin: 'Về khu quản trị',
  },
  page: {
    title: 'Dòng họ',
    infoTitle: 'Thông tin dòng họ',
    originPlace: 'Quê quán',
    noDescription: 'Chưa có mô tả.',
    createdAt: 'Ngày tạo',
    accountsTitle: (count: number) => `Tài khoản (${count})`,
    manager: 'Quản lý',
    member: 'Thành viên',
    you: 'Bạn',
    loadFailed: 'Không tải được thông tin dòng họ.',
    retry: 'Thử lại',
  },
  invitations: {
    title: 'Mã mời',
    description: 'Mã dùng được nhiều lần cho tới khi hết hạn (7 ngày) hoặc bị thu hồi.',
    create: 'Tạo mã mời',
    empty: 'Chưa có mã mời nào.',
    expires: (date: string) => `Hết hạn ${date}`,
    active: 'Còn hiệu lực',
    expired: 'Đã hết hạn',
    revoked: 'Đã thu hồi',
    share: 'Chia sẻ',
    shareTitle: 'Lời mời tham gia dòng họ',
    shareText: (family: string, code: string) =>
      `Mời bạn tham gia dòng họ ${family} trên Tộc Phả. Mã mời: ${code}`,
    copied: 'Đã sao chép link mời vào bộ nhớ tạm.',
    copyFailed: 'Không sao chép được. Hãy chép mã mời thủ công.',
    revoke: 'Thu hồi',
    revokeTitle: 'Thu hồi mã mời?',
    revokeDescription: (code: string) =>
      `Mã ${code} sẽ không dùng được nữa. Những người đã tham gia không bị ảnh hưởng.`,
  },
  accounts: {
    remove: 'Loại khỏi dòng họ',
    removeShort: 'Loại',
    transferShort: 'Chuyển quyền',
    removeLabel: (name: string) => `Loại ${name} khỏi dòng họ`,
    removeTitle: (name: string) => `Loại ${name} khỏi dòng họ?`,
    removeDescription:
      'Tài khoản này sẽ bị đăng xuất và không còn truy cập được dữ liệu của dòng họ. Họ có thể tham gia lại bằng mã mời khác.',
    transfer: 'Chuyển quyền quản lý',
    transferLabel: (name: string) => `Chuyển quyền quản lý cho ${name}`,
    transferTitle: (name: string) => `Chuyển quyền quản lý cho ${name}?`,
    transferDescription:
      'Bạn sẽ trở thành thành viên thường. Cả hai bên sẽ bị đăng xuất và cần đăng nhập lại để quyền mới có hiệu lực.',
  },
  leave: {
    button: 'Rời dòng họ',
    title: 'Rời dòng họ?',
    description:
      'Bạn sẽ bị đăng xuất và không còn xem được dữ liệu của dòng họ. Bạn có thể tham gia lại bằng mã mời.',
    managerBlocked:
      'Bạn đang là người quản lý. Hãy chuyển quyền quản lý cho một thành viên khác trước khi rời dòng họ.',
  },
  dialog: {
    cancel: 'Hủy',
  },
} as const
