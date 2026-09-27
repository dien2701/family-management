# Quy tắc bảo mật (áp dụng toàn repo)

- Mật khẩu băm bằng **BCrypt cost 12**. Không lưu mật khẩu, OTP hay token ở dạng thô.
- OTP 6 số lưu dạng hash, có `attempts` (tối đa 5 lần), hiệu lực 10 phút, 60 giây sau mới được gửi lại.
- JWT HS256 ký bằng `JWT_SECRET`, dùng Spring Security OAuth2 Resource Server (Nimbus). Access token hiệu lực 15 phút.
- Refresh token hiệu lực 30 ngày. DB chỉ lưu **SHA-256**. Cookie đặt `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`. Token xoay vòng sau mỗi lần refresh. Đổi hoặc đặt lại mật khẩu, khóa tài khoản, từ chối duyệt, cấp hoặc gỡ quyền Admin đều **thu hồi toàn bộ** refresh token của người bị ảnh hưởng.
- Đăng nhập sai thì chỉ báo lỗi chung, không để lộ email có tồn tại hay không. Sai 5 lần thì khóa 15 phút theo email.
- Rate limit bằng bucket4j cho đăng nhập, gửi OTP và AI.
- **Duyệt tài khoản:** tài khoản chưa `APPROVED` không đọc được bất kỳ dữ liệu gia phả nào (403 `ACCOUNT_NOT_APPROVED`). Admin đầu tiên chỉ đến từ `ROOT_ADMIN_EMAIL` khi hệ thống chưa có Admin. Admin không tự gỡ quyền/tự khóa; chặn gỡ quyền hoặc khóa Admin cuối cùng.
- Quyền Admin và quyền tự quản hồ sơ của User kiểm tra ở backend, không chỉ ẩn nút ở giao diện: User chỉ sửa hồ sơ, người thân và ảnh đại diện của member đã liên kết (`user.member_id` đọc từ DB), không sửa nhóm "đã mất" (403 `DEATH_FIELDS_ADMIN_ONLY`). Đề xuất chỉ nhận `targetType=EVENT`.
- API response **không bao giờ** chứa `password_hash`, `google_sub`, hash của token hay OTP. SĐT và email của member chỉ trả cho Admin hoặc chính chủ.
- **Không bao giờ gửi SĐT hoặc email lên AI.** AI chỉ đọc dữ liệu qua các function đã định nghĩa và không bao giờ tự ghi dữ liệu. Tài khoản chưa duyệt không dùng được AI.
- Bí mật (`JWT_SECRET`, `GEMINI_API_KEY`, VAPID, Cloudinary, Google OAuth, `MAIL_*`, mật khẩu DB) đặt trong `.env`, **không commit**. Mẫu các khóa nằm ở `apps/backend/.env.example`. Frontend chỉ được biết `VITE_GOOGLE_CLIENT_ID`.
- Upload lên Cloudinary bằng chữ ký do backend cấp. Backend kiểm tra MIME (jpg, png, webp, pdf, docx, xlsx), giới hạn 10 MB mỗi file và 1 GB cho toàn hệ thống. Chỉ Admin tải lên và xóa, trừ ảnh đại diện (jpg/png/webp) cho hồ sơ của chính User (kiểm `memberId = user.member_id` ở cả sign và confirm).
- Đồng ý dữ liệu cá nhân theo NĐ 13: lưu `user_consent` kèm `policy_version` khi đăng ký (hoặc lần đầu đăng nhập Google, và khi đổi phiên bản chính sách).
- Lớp giả lập của frontend (GĐ A) không bao giờ chứa token hay bí mật, và không được lọt vào bản build prod.
