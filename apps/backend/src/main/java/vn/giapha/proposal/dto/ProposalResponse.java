package vn.giapha.proposal.dto;

import java.time.Instant;
import java.util.Map;

/**
 * {@code conflict = true} khi sự kiện đích đã bị sửa (hoặc bị xóa) sau {@code baseUpdatedAt} và đề xuất còn
 * {@code PENDING} (IDEA §6.6: "hệ thống cảnh báo Admin"), tính lại mỗi lần đọc chứ không lưu.
 */
public record ProposalResponse(
        Long id,
        Long accountId,
        String accountName,
        String targetType,
        String action,
        Long targetId,
        Map<String, Object> payload,
        String status,
        String note,
        Instant baseUpdatedAt,
        boolean conflict,
        Instant createdAt) {
}
