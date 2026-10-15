// Chuỗi UI của module Trợ lý AI (không dùng i18n, chỉ tiếng Việt)
export const aiStrings = {
  menu: 'Trợ lý',
  menuDescription: 'Hỏi về thành viên, ngày giỗ, sinh nhật và sự kiện',
  title: 'Trợ lý',
  emptyTitle: 'Hỏi Trợ lý về gia phả',
  emptyDescription:
    'Trợ lý chỉ đọc dữ liệu để trả lời, không tự thay đổi gì. Thử một trong các câu sau:',
  suggestionsLabel: 'Câu hỏi gợi ý',
  suggestions: [
    'Sắp tới có ngày giỗ nào?',
    'Tháng này có sinh nhật ai?',
    'Gia phả hiện có bao nhiêu thành viên?',
    'Đổi ngày 15/8 âm lịch năm nay sang dương lịch',
  ],
  // Chỉ gợi ý cho tài khoản đã duyệt: khách không soạn được bản nháp (DECISIONS #91)
  draftSuggestion: 'Thêm sự kiện họp mặt họ vào mùng 10 tháng 3 âm lịch',
  guestNote:
    'Bạn đang hỏi với tư cách khách: cuộc trò chuyện không được lưu và Trợ lý không soạn được đề xuất sự kiện.',
  guestPendingNote:
    'Tài khoản của bạn chưa được duyệt nên Trợ lý tính lượt như khách và không lưu cuộc trò chuyện.',
  guestLogin: 'Đăng nhập',
  guestOff: 'Trợ lý chưa mở cho khách. Vui lòng đăng nhập để sử dụng.',
  inputLabel: 'Câu hỏi cho Trợ lý',
  inputPlaceholder: 'Nhập câu hỏi…',
  send: 'Gửi',
  stop: 'Dừng',
  voiceStart: 'Nhập bằng giọng nói',
  voiceStop: 'Dừng ghi âm',
  voiceListening: 'Đang nghe… hãy nói câu hỏi của bạn. Nói xong, kiểm tra lại rồi bấm Gửi.',
  stopped: 'Đã dừng trả lời',
  thinking: 'Trợ lý đang trả lời…',
  quotaLeft: (n: number) => `Còn ${n} câu hôm nay`,
  quotaOut: (resetDate: string) =>
    `Bạn đã dùng hết lượt hôm nay. Lượt mới có từ 0h ngày ${resetDate} (giờ Việt Nam).`,
  historyError: 'Không tải được lịch sử trò chuyện.',
  genericError: 'Trợ lý chưa trả lời được. Bạn thử lại sau nhé.',
  you: 'Bạn',
  assistant: 'Trợ lý',
  draft: {
    title: 'Bản nháp do Trợ lý soạn',
    action: { CREATE: 'Thêm sự kiện', UPDATE: 'Sửa sự kiện', DELETE: 'Xóa sự kiện' },
    before: 'Trước',
    after: 'Sau',
    empty: '(trống)',
    submit: 'Gửi đề xuất',
    apply: 'Áp dụng',
    submitted: 'Đã gửi đề xuất',
    applied: 'Đã áp dụng',
    note: 'Trợ lý không tự ghi dữ liệu. Bạn xem lại rồi mới xác nhận.',
  },
} as const
