package vn.giapha.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Vui lòng nhập họ tên.")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự.")
        String fullName,

        @NotBlank(message = "Vui lòng nhập email.")
        @Email(message = "Email không hợp lệ.")
        @Pattern(regexp = EmailRules.ASCII_EMAIL, message = EmailRules.ASCII_EMAIL_MESSAGE)
        @Size(max = 254, message = "Email tối đa 254 ký tự.")
        String email,

        @NotBlank(message = "Vui lòng nhập mật khẩu.")
        @Size(min = 8, max = 72, message = "Mật khẩu phải từ 8 đến 72 ký tự.")
        String password,

        @NotBlank(message = "Vui lòng nhập lại mật khẩu.")
        String confirmPassword,

        // Boolean (không phải boolean) để thiếu trường vẫn ra lỗi đúng trường thay vì lỗi đọc JSON
        @NotNull(message = "Bạn cần đồng ý điều khoản để đăng ký.")
        @AssertTrue(message = "Bạn cần đồng ý điều khoản để đăng ký.")
        Boolean acceptTerms) {
}
