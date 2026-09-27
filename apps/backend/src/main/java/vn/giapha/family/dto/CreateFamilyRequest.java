package vn.giapha.family.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFamilyRequest(
        @NotBlank(message = "Vui lòng nhập tên dòng họ.")
        @Size(max = 100, message = "Tên dòng họ tối đa 100 ký tự.")
        String name,

        @Size(max = 200, message = "Quê quán tối đa 200 ký tự.")
        String originPlace,

        @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự.")
        String description,

        // Boolean (không phải boolean) để thiếu trường vẫn ra lỗi đúng trường
        @NotNull(message = "Bạn cần đồng ý chính sách bảo mật để tạo dòng họ.")
        @AssertTrue(message = "Bạn cần đồng ý chính sách bảo mật để tạo dòng họ.")
        Boolean acceptPolicy) {
}
