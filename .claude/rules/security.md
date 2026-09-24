# Quy tắc bảo mật (áp dụng toàn repo)

- Mật khẩu băm bằng **BCrypt cost 12**. Không lưu mật khẩu, OTP hay token ở dạng thô.
- OTP 6 số lưu dạng hash, có `attempts` (tối đa 5 lần), hiệu lực 10 phút, 60 giây sau mới được gửi lại.
- JWT HS256 ký bằng `JWT_SECRET`, dùng Spring Security OAuth2 Resource Server (Nimbus). Access token hiệu lực 15 phút.
- Refresh token hiệu lực 30 ngày. DB chỉ lưu **SHA-256**. Cookie đặt `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`. Token xoay vòng sau mỗi lần refresh. Đổi hoặc đặt lại mật khẩu, khóa tài khoản, rời family đều **thu hồi toàn bộ** refresh token.
- Đăng nhập sai thì chỉ báo lỗi chung, không để lộ email có tồn tại hay không. Sai 5 lần thì khóa 15 phút theo email.
- Rate limit bằng bucket4j cho đăng nhập, gửi OTP và AI.
- API response **không bao giờ** chứa `password_hash`, `google_sub`, hash của token hay OTP. SĐT và email của member chỉ trả cho Admin, Manager hoặc chính chủ.
- **Không bao giờ gửi SĐT hoặc email lên AI.** AI chỉ đọc dữ liệu qua các function đã định nghĩa, không bao giờ tự ghi dữ liệu và không nhận member đang bị khóa.
- Bí mật (`JWT_SECRET`, `GEMINI_API_KEY`, VAPID, Cloudinary, Google OAuth, `MAIL_*`, mật khẩu DB) đặt trong `.env`, **không commit**. Mẫu các khóa nằm ở `apps/backend/.env.example`. Frontend chỉ được biết `VITE_GOOGLE_CLIENT_ID`.
- Upload lên Cloudinary bằng chữ ký do backend cấp. Backend kiểm tra MIME (jpg, png, webp, pdf, docx, xlsx), giới hạn 10 MB mỗi file và 1 GB mỗi family.
- Đồng ý dữ liệu cá nhân theo NĐ 13: lưu `user_consent` kèm `policy_version` mỗi khi user tạo hoặc tham gia family.
