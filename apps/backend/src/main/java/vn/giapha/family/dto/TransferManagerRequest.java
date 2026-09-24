package vn.giapha.family.dto;

import jakarta.validation.constraints.NotNull;

public record TransferManagerRequest(
        @NotNull(message = "Vui lòng chọn người nhận quyền Manager.")
        Long userId) {
}
