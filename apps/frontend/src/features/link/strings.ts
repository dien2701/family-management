// Chuỗi UI của module liên kết "Tôi là ai" (không dùng i18n, chỉ tiếng Việt).
// Giao diện gọi người đăng nhập là "tài khoản", người trong gia phả là "thành viên" (DECISIONS #79).
export const linkStrings = {
  menu: 'Tôi là ai',
  menuDescription: 'Liên kết tài khoản với hồ sơ của bạn trong gia phả',
  page: {
    intro:
      'Liên kết tài khoản với đúng hồ sơ thành viên của bạn để tự sửa hồ sơ, danh sách người thân và ảnh đại diện. Mỗi tài khoản chỉ liên kết với một thành viên.',
    loading: 'Đang tải',
    loadFailed: 'Không tải được thông tin liên kết.',
    retry: 'Thử lại',
  },
  linked: {
    title: 'Tài khoản đã liên kết',
    description: 'Tài khoản của bạn đang là thành viên này:',
    viewProfile: 'Xem hồ sơ',
    editProfile: 'Sửa hồ sơ của tôi',
    unlink: 'Hủy liên kết',
    unlinkTitle: 'Hủy liên kết với hồ sơ này?',
    unlinkDescription: (name: string) =>
      `Tài khoản của bạn sẽ không còn là "${name}" và không sửa được hồ sơ này nữa. Email đã chép sang hồ sơ vẫn giữ nguyên. Bạn có thể liên kết lại sau.`,
    unlinkConfirm: 'Hủy liên kết',
    unlinkCancel: 'Giữ liên kết',
    notFoundName: 'Hồ sơ của bạn',
    you: 'Đây là bạn',
  },
  pending: {
    badge: 'Đang chờ Admin duyệt',
    title: 'Yêu cầu đang chờ duyệt',
    description: (name: string) => `Bạn đã gửi yêu cầu liên kết với "${name}".`,
    sentAt: (date: string) => `Gửi ngày ${date}`,
    hint: 'Khi Admin duyệt, hồ sơ sẽ có dấu "Đây là bạn" và bạn tự sửa được hồ sơ của mình. Nếu chọn nhầm người, nhờ Admin từ chối yêu cầu rồi gửi lại.',
  },
  rejected: (name: string, date: string) =>
    `Yêu cầu liên kết với "${name}" (${date}) không được duyệt. Bạn có thể chọn lại bên dưới.`,
  search: {
    title: 'Tìm hồ sơ của bạn',
    label: 'Tìm thành viên',
    placeholder: 'Gõ họ tên, không cần dấu',
    results: 'Kết quả tìm thành viên',
    loading: 'Đang tìm thành viên...',
    loadFailed: 'Không tìm được thành viên.',
    empty: 'Chưa có thành viên nào trong gia phả.',
    noMatch: 'Không tìm thấy thành viên phù hợp. Thử gõ ngắn hơn.',
    truncated: (shown: number, total: number) =>
      `Đang hiện ${shown}/${total} người. Gõ thêm để thu hẹp.`,
    thisIsMe: 'Đây là tôi',
    thisIsMeFor: (name: string) => `Đây là tôi: ${name}`,
  },
  confirm: {
    title: 'Gửi yêu cầu liên kết?',
    description: (name: string) =>
      `Bạn xác nhận tài khoản của mình là "${name}"? Admin sẽ xem và duyệt yêu cầu này.`,
    confirm: 'Gửi yêu cầu',
    cancel: 'Hủy',
    sent: 'Đã gửi yêu cầu. Admin sẽ duyệt sớm.',
  },
  errors: {
    ACCOUNT_ALREADY_LINKED: 'Tài khoản của bạn đã liên kết với một thành viên. Hãy hủy liên kết cũ trước.',
    MEMBER_ALREADY_LINKED: 'Thành viên này đã có tài khoản khác liên kết. Nếu đây là bạn, hãy nhờ Admin xử lý.',
    LINK_REQUEST_EXISTS: 'Bạn đang có một yêu cầu chờ duyệt. Hãy chờ kết quả.',
    NOT_LINKED: 'Tài khoản của bạn hiện chưa liên kết với thành viên nào.',
    MEMBER_NOT_FOUND: 'Không tìm thấy thành viên này. Danh sách đã được tải lại.',
  } as Record<string, string>,
  genericError: 'Có lỗi xảy ra, vui lòng thử lại.',
} as const
