package vn.giapha.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public record ConsentRequest(
        // Boolean (không phải boolean) để thiếu trường vẫn ra lỗi đúng trường thay vì lỗi đọc JSON
        @NotNull(message = "Bạn cần đồng ý chính sách bảo mật để tiếp tục.")
        @AssertTrue(message = "Bạn cần đồng ý chính sách bảo mật để tiếp tục.")
        Boolean acceptTerms) {
}
