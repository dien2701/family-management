package vn.giapha.auth.dto;

/** Kết quả gửi OTP: FE dùng để đếm ngược nút "Gửi lại". Không cho biết email có tồn tại hay không. */
public record OtpSentResponse(String email, long expiresInSeconds, long resendAfterSeconds) {
}
