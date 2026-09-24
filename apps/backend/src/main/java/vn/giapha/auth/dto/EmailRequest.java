package vn.giapha.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Dùng cho resend-otp và forgot-password. */
public record EmailRequest(
        @NotBlank(message = "Vui lòng nhập email.")
        @Email(message = "Email không hợp lệ.")
        @Pattern(regexp = EmailRules.ASCII_EMAIL, message = EmailRules.ASCII_EMAIL_MESSAGE)
        @Size(max = 254, message = "Email tối đa 254 ký tự.")
        String email) {
}
