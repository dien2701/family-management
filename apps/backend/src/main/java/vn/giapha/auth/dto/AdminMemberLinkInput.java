package vn.giapha.auth.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Admin gán thành viên cho một tài khoản. */
public record AdminMemberLinkInput(
        @NotNull(message = "Vui lòng chọn một thành viên.")
        @Positive(message = "Vui lòng chọn một thành viên.")
        Long memberId) {
}
