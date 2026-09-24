// Nội dung Chính sách bảo mật: 5 ý theo IDEA §6.2 (dữ liệu thu thập, ai được xem, Cloudinary, Gemini, sửa/xóa dữ liệu).
// Đổi nội dung có ý nghĩa thì tăng POLICY_VERSION (strings.ts) cùng `app.policy.version` ở backend.

export type PolicySection = {
  id: string
  title: string
  intro?: string
  items?: string[]
  outro?: string
}

export const policySections: PolicySection[] = [
  {
    id: 'policy-collected',
    title: '1. Dữ liệu chúng tôi thu thập',
    intro: 'Tộc Phả chỉ thu thập dữ liệu cần để quản lý gia phả của dòng họ:',
    items: [
      'Tài khoản: họ tên, email, ảnh đại diện (nếu đăng nhập bằng Google) và mật khẩu (chỉ lưu dạng băm, không lưu bản gốc).',
      'Hồ sơ thành viên trong cây gia phả: họ tên, ngày sinh, ngày mất, giới tính, quan hệ gia đình, số điện thoại, email, nơi ở, nơi chôn cất, ghi chú và ảnh do người quản lý hoặc thành viên nhập.',
      'Sự kiện của dòng họ: ngày giỗ, sinh nhật và các sự kiện chung.',
      'Việc bạn đồng ý chính sách này: thời điểm, địa chỉ IP và phiên bản chính sách.',
    ],
    outro:
      'Với thành viên trong cây, chỉ họ tên là bắt buộc. Mọi thông tin khác đều có thể để trống.',
  },
  {
    id: 'policy-viewers',
    title: '2. Ai được xem dữ liệu',
    items: [
      'Dữ liệu của mỗi dòng họ tách biệt hoàn toàn. Chỉ tài khoản thuộc dòng họ đó mới xem được.',
      'Số điện thoại và email của thành viên chỉ hiển thị cho quản trị hệ thống, người quản lý dòng họ và chính chủ.',
      'Quản trị hệ thống chỉ truy cập dữ liệu để vận hành, hỗ trợ và xử lý sự cố.',
      'Chúng tôi không bán và không chia sẻ dữ liệu cá nhân cho bên thứ ba vì mục đích quảng cáo.',
    ],
  },
  {
    id: 'policy-cloudinary',
    title: '3. Lưu trữ ảnh và tệp trên Cloudinary',
    intro:
      'Ảnh đại diện, ảnh bìa và các tệp đính kèm (hình ảnh, PDF, Word, Excel) được lưu trên dịch vụ Cloudinary. Tệp được tải lên bằng chữ ký do hệ thống cấp và chỉ những người thuộc dòng họ mới dùng được liên kết trong ứng dụng.',
  },
  {
    id: 'policy-gemini',
    title: '4. Xử lý bởi trợ lý AI Gemini',
    intro:
      'Trợ lý AI dùng Gemini (gói trả phí) của Google để trả lời câu hỏi về gia phả. Khi bạn đặt câu hỏi, các thông tin gia phả cần thiết để trả lời (như họ tên, quan hệ, ngày sinh, ngày mất) được gửi tới Gemini. Số điện thoại và email không bao giờ được gửi. Trợ lý chỉ đọc dữ liệu, không tự ý thay đổi dữ liệu và không xử lý các thành viên đã bị khóa.',
  },
  {
    id: 'policy-rights',
    title: '5. Quyền sửa và xóa dữ liệu của bạn',
    items: [
      'Bạn có quyền yêu cầu xem, sửa hoặc xóa dữ liệu cá nhân của mình, và rút lại sự đồng ý.',
      'Hãy gửi yêu cầu cho người quản lý dòng họ để sửa hoặc xóa hồ sơ trong cây gia phả, hoặc rời dòng họ bất cứ lúc nào trong mục Thêm > Dòng họ.',
      'Nếu cần xóa hoàn toàn tài khoản và dữ liệu liên quan, hãy liên hệ quản trị hệ thống qua người quản lý dòng họ. Chúng tôi xử lý yêu cầu trong thời gian sớm nhất có thể.',
    ],
  },
]
