package vn.giapha.proposal.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;

/**
 * Nội dung đề xuất khi gửi. {@code targetType} chỉ nhận {@code "EVENT"} (DECISIONS #77); {@code action} là
 * {@code CREATE}/{@code UPDATE}/{@code DELETE}. {@code payload} là {@code CustomEventInput} (bỏ trống khi
 * {@code DELETE}); {@code targetId} bắt buộc với {@code UPDATE}/{@code DELETE}. Quy tắc chi tiết do
 * {@code ProposalService} kiểm.
 */
public record ProposalInput(
        @NotBlank(message = "Vui lòng chọn loại đối tượng đề xuất.") String targetType,
        @NotBlank(message = "Vui lòng chọn hành động.") String action,
        Long targetId,
        Map<String, Object> payload) {
}
