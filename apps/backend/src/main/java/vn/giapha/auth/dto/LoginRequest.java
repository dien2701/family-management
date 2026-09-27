package vn.giapha.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Vui lòng nhập email.")
        @Pattern(regexp = EmailRules.ASCII_EMAIL, message = EmailRules.ASCII_EMAIL_MESSAGE)
        @Size(max = 254, message = "Email tối đa 254 ký tự.")
        String email,

        @NotBlank(message = "Vui lòng nhập mật khẩu.")
        @Size(max = 200, message = "Mật khẩu quá dài.")
        String password) {
}
