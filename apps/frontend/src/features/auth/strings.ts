// Chuỗi UI của module auth (không dùng i18n, chỉ tiếng Việt)
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
    description: 'Chào mừng bạn quay lại với gia phả của dòng họ.',
    submit: 'Đăng nhập',
    forgot: 'Quên mật khẩu?',
    noAccount: 'Chưa có tài khoản?',
    toRegister: 'Đăng ký',
    unverified: 'Nhập mã xác thực',
  },
  register: {
    title: 'Tạo tài khoản',
    description: 'Đăng ký để xem và cùng xây dựng gia phả của dòng họ.',
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
  logout: 'Đăng xuất',
  logoutFailed: 'Không đăng xuất được. Hãy kiểm tra mạng rồi thử lại.',
  account: 'Tài khoản',
  passwordChanged: 'Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới.',
} as const
