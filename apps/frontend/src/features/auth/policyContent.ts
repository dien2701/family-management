// Nội dung Chính sách bảo mật (bản v2: một gia phả chung, Admin duyệt tài khoản).
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
    intro: 'Tộc Phả chỉ thu thập dữ liệu cần để quản lý gia phả:',
    items: [
      'Tài khoản: họ tên, email, ảnh đại diện (nếu đăng nhập bằng Google) và mật khẩu (chỉ lưu dạng băm, không lưu bản gốc).',
      'Hồ sơ thành viên trong gia phả: họ tên, ngày sinh, ngày mất, giới tính, người thân, số điện thoại, email, nơi ở, nơi an táng, ghi chú và ảnh do Admin hoặc chính thành viên nhập.',
      'Sự kiện chung của gia phả: ngày giỗ, sinh nhật và các sự kiện khác.',
      'Việc bạn đồng ý chính sách này: thời điểm, địa chỉ IP và phiên bản chính sách.',
    ],
    outro:
      'Với thành viên trong gia phả, chỉ họ tên là bắt buộc. Mọi thông tin khác đều có thể để trống.',
  },
  {
    id: 'policy-approval',
    title: '2. Một gia phả chung và việc duyệt tài khoản',
    items: [
      'Hệ thống chỉ có một gia phả chung cho tất cả tài khoản.',
      'Tài khoản mới phải được Admin duyệt mới dùng được các chức năng như trợ lý AI, xuất dữ liệu, tệp đính kèm, đề xuất và thông báo. Trong lúc chờ duyệt, bạn chỉ xem được thông tin chung của gia phả.',
      'Admin có thể từ chối hoặc khóa tài khoản. Khi đó bạn không đăng nhập hay dùng được các chức năng trên.',
    ],
  },
  {
    id: 'policy-viewers',
    title: '3. Ai được xem dữ liệu',
    items: [
      'Thông tin gia phả (danh sách thành viên, hồ sơ, người thân, cây gia phả, sự kiện và lịch), trừ số điện thoại và email, hiển thị công khai cho bất kỳ ai có đường dẫn, kể cả người chưa đăng nhập. Chúng tôi chặn công cụ tìm kiếm lập chỉ mục trang này.',
      'Số điện thoại và email của thành viên chỉ hiển thị cho Admin và chính chủ (thành viên đã liên kết với tài khoản của họ).',
      'Admin chỉ truy cập dữ liệu để vận hành, hỗ trợ và xử lý sự cố.',
      'Chúng tôi không bán và không chia sẻ dữ liệu cá nhân cho bên thứ ba vì mục đích quảng cáo.',
    ],
  },
  {
    id: 'policy-cloudinary',
    title: '4. Lưu trữ ảnh và tệp trên Cloudinary',
    intro:
      'Ảnh đại diện và các tệp đính kèm (hình ảnh, PDF, Word, Excel) được lưu trên dịch vụ Cloudinary. Tệp được tải lên bằng chữ ký do hệ thống cấp và chỉ tài khoản đã được duyệt mới dùng được liên kết trong ứng dụng.',
  },
  {
    id: 'policy-gemini',
    title: '5. Xử lý bởi trợ lý AI Gemini',
    intro:
      'Trợ lý AI dùng Gemini (gói trả phí) của Google để trả lời câu hỏi về gia phả. Khi bạn đặt câu hỏi, các thông tin gia phả cần thiết để trả lời (như họ tên, quan hệ, ngày sinh, ngày mất) được gửi tới Gemini. Số điện thoại và email không bao giờ được gửi. Trợ lý chỉ đọc dữ liệu, không tự ý thay đổi dữ liệu.',
  },
  {
    id: 'policy-rights',
    title: '6. Quyền sửa và xóa dữ liệu của bạn',
    items: [
      'Bạn có quyền yêu cầu xem, sửa hoặc xóa dữ liệu cá nhân của mình, và rút lại sự đồng ý.',
      'Nếu tài khoản của bạn đã liên kết với một thành viên ("Tôi là ai"), bạn tự sửa hồ sơ, người thân và ảnh đại diện của mình. Các thông tin về việc đã mất do Admin cập nhật.',
      'Muốn xóa hồ sơ trong gia phả hoặc xóa hoàn toàn tài khoản và dữ liệu liên quan, hãy liên hệ Admin. Chúng tôi xử lý yêu cầu trong thời gian sớm nhất có thể.',
    ],
  },
]
