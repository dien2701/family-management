// Chuỗi UI của màn hình "Thông báo trên thiết bị này" cho khách (DECISIONS #89).

export const guestPushStrings = {
  title: 'Thông báo trên thiết bị này',
  intro:
    'Nhận nhắc ngày giỗ, sinh nhật và sự kiện của gia phả ngay trên thiết bị này, không cần đăng nhập. Mỗi thiết bị bật riêng.',
  checking: 'Đang kiểm tra…',
  status: {
    on: 'Đã bật trên thiết bị này',
    off: 'Chưa bật trên thiết bị này',
    denied: 'Đang bị chặn trong trình duyệt',
    unsupported: 'Thiết bị hoặc trình duyệt này chưa hỗ trợ',
  },
  enable: 'Bật thông báo',
  disable: 'Tắt thông báo',
  enabled: 'Đã bật thông báo trên thiết bị này.',
  disabled: 'Đã tắt thông báo trên thiết bị này.',
  enableFailed: 'Không bật được thông báo.',
  iosInstall:
    'Trên iPhone: bấm nút Chia sẻ, chọn "Thêm vào Màn hình chính", rồi mở ứng dụng từ biểu tượng đó để bật thông báo.',
  denied:
    'Trình duyệt đang chặn thông báo của trang này. Hãy mở cài đặt của trình duyệt (biểu tượng ổ khóa cạnh địa chỉ), cho phép Thông báo, rồi tải lại trang.',
  unsupported: 'Trình duyệt này chưa hỗ trợ thông báo đẩy. Hãy thử Chrome, Edge hoặc Safari bản mới.',
  prefs: {
    title: 'Nhận những gì',
    memorials: 'Ngày giỗ',
    events: 'Sự kiện và sinh nhật',
    daysTitle: 'Nhắc trước',
    daysHint: 'Chọn các mốc muốn nhận. "Đúng ngày" là nhắc vào chính ngày đó.',
    dayChip: (days: number) => (days === 0 ? 'Đúng ngày' : `${days} ngày`),
    hourLabel: 'Giờ nhận',
    hourHint: 'Giờ Việt Nam. Bản tin gộp mọi mục đến mốc nhắc trong một lần.',
    daysError: 'Chọn ít nhất một mốc nhắc.',
    save: 'Lưu thay đổi',
    saved: 'Đã lưu tùy chọn.',
    saveFailed: 'Không lưu được. Vui lòng thử lại.',
    lost: 'Máy chủ chưa có đăng ký của thiết bị này (hoặc thiết bị đang gắn với một tài khoản). Hãy tắt rồi bật lại thông báo.',
  },
  prompt: {
    title: 'Nhận nhắc giỗ, sinh nhật và sự kiện ngay trên điện thoại',
    body: 'Không cần đăng nhập. Thông báo hiện lên cả khi bạn không mở ứng dụng.',
    customize: 'Tùy chỉnh',
    later: 'Để sau',
  },
  menu: 'Thông báo trên thiết bị này',
} as const

/** Mốc nhắc cho khách chọn, từ xa đến gần. */
export const GUEST_REMIND_DAYS = [30, 15, 7, 3, 1, 0] as const
