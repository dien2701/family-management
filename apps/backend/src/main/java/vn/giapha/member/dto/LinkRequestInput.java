package vn.giapha.member.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** "Đây là tôi": tài khoản đã duyệt chọn thành viên mà mình là. */
public record LinkRequestInput(
        @NotNull(message = "Vui lòng chọn một thành viên.")
        @Positive(message = "Vui lòng chọn một thành viên.")
        Long memberId) {
}
