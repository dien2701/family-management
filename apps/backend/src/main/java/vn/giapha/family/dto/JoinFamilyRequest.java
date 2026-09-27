package vn.giapha.family.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record JoinFamilyRequest(
        @NotBlank(message = "Vui lòng nhập mã mời.")
        @Size(max = 16, message = "Mã mời không hợp lệ.")
        String code,

        @NotNull(message = "Bạn cần đồng ý chính sách bảo mật để tham gia dòng họ.")
        @AssertTrue(message = "Bạn cần đồng ý chính sách bảo mật để tham gia dòng họ.")
        Boolean acceptPolicy) {
}
