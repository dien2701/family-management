// Chuỗi UI của module auth (không dùng i18n, chỉ tiếng Việt)

// Phiên bản chính sách hiện hành. Backend đọc từ `app.policy.version` (mặc định "1.0") và chưa có API trả về,
// nên khi đổi bên đó phải đổi cả ở đây.
export const POLICY_VERSION = '1.0'

export const authStrings = {
  brand: 'Tộc Phả',
  fields: {
    fullName: 'Họ và tên',
    email: 'Email',
    password: 'Mật khẩu',
    confirmPassword: 'Nhập lại mật khẩu',
    newPassword: 'Mật khẩu mới',
    otp: 'Mã xác thực',
  },
  hints: {
    password: 'Từ 8 đến 72 ký tự.',
    otp: 'Gồm 6 chữ số trong email bạn vừa nhận.',
  },
  login: {
    title: 'Đăng nhập',
    description: 'Chào mừng bạn quay lại với gia phả.',
    submit: 'Đăng nhập',
    forgot: 'Quên mật khẩu?',
    noAccount: 'Chưa có tài khoản?',
    toRegister: 'Đăng ký',
    unverified: 'Nhập mã xác thực',
  },
  register: {
    title: 'Tạo tài khoản',
    description: 'Đăng ký để xem gia phả. Tài khoản mới cần Admin duyệt trước khi dùng.',
    submit: 'Đăng ký',
    haveAccount: 'Đã có tài khoản?',
    toLogin: 'Đăng nhập',
    acceptTermsBefore: 'Tôi đồng ý với điều khoản sử dụng và ',
    acceptTermsLink: 'chính sách bảo mật',
    acceptTermsAfter: ' dữ liệu cá nhân.',
  },
  verifyOtp: {
    title: 'Xác thực email',
    description: (email: string) =>
      `Chúng tôi đã gửi mã 6 chữ số tới ${email}. Mã có hiệu lực 10 phút.`,
    submit: 'Xác thực',
    changeEmail: 'Dùng email khác',
  },
  resend: {
    action: 'Gửi lại mã',
    wait: (seconds: number) => `Gửi lại mã sau ${seconds} giây`,
    sent: 'Đã gửi lại mã. Hãy kiểm tra email của bạn.',
  },
  forgot: {
    title: 'Quên mật khẩu',
    descriptionEmail: 'Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác thực để đặt lại mật khẩu.',
    sendCode: 'Gửi mã xác thực',
    descriptionOtp: (email: string) =>
      `Nếu ${email} đã có tài khoản, mã 6 chữ số đã được gửi tới đó. Mã có hiệu lực 10 phút.`,
    continue: 'Tiếp tục',
    titleNewPassword: 'Đặt mật khẩu mới',
    descriptionNewPassword: 'Sau khi đổi, bạn sẽ bị đăng xuất khỏi mọi thiết bị.',
    submitNewPassword: 'Đổi mật khẩu',
    backToLogin: 'Quay lại đăng nhập',
    changeEmail: 'Dùng email khác',
  },
  google: {
    or: 'hoặc',
    loadFailed: 'Không tải được nút đăng nhập Google. Bạn vẫn có thể dùng email và mật khẩu.',
  },
  waiting: {
    title: 'Đang chờ Admin duyệt',
    description:
      'Tài khoản của bạn đã được tạo. Sau khi Admin duyệt, bạn sẽ xem được gia phả. Trang này tự kiểm tra lại mỗi 30 giây.',
    signedInAs: (email: string) => `Đăng nhập bằng ${email}`,
    checkNow: 'Kiểm tra lại',
    lastChecked: (time: string) => `Kiểm tra lần cuối lúc ${time}`,
    checkFailed: 'Chưa kiểm tra được trạng thái. Hãy kiểm tra mạng, trang sẽ thử lại.',
  },
  consent: {
    before: 'Tôi đồng ý cho hệ thống thu thập và xử lý dữ liệu cá nhân theo ',
    link: 'Chính sách bảo mật',
    after: (version: string) => ` (phiên bản ${version}).`,
    required: 'Bạn cần đồng ý chính sách bảo mật để tiếp tục.',
    title: 'Đồng ý chính sách dữ liệu cá nhân',
    description:
      'Bạn đăng nhập bằng Google lần đầu nên cần đồng ý chính sách này (Nghị định 13/2023/NĐ-CP).',
    submit: 'Đồng ý',
  },
  rejected: {
    title: 'Tài khoản không được duyệt',
    description:
      'Admin đã không duyệt tài khoản này nên bạn chưa xem được gia phả. Nếu nghĩ đây là nhầm lẫn, hãy liên hệ Admin.',
  },
  logout: 'Đăng xuất',
  logoutFailed: 'Không đăng xuất được. Hãy kiểm tra mạng rồi thử lại.',
  account: 'Tài khoản',
  passwordChanged: 'Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới.',
} as const
