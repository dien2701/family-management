package vn.giapha.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleLoginRequest(
        @NotBlank(message = "Thiếu thông tin đăng nhập Google.")
        @Size(max = 4096, message = "Thông tin đăng nhập Google không hợp lệ.")
        String idToken) {
}
