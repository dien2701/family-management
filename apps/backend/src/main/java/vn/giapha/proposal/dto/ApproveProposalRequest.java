package vn.giapha.proposal.dto;

import java.util.Map;

/** {@code modifiedPayload}: Admin chỉnh nhẹ trước khi duyệt (IDEA §6.6); {@code null} thì áp dụng đúng payload đã gửi. */
public record ApproveProposalRequest(Map<String, Object> modifiedPayload) {
}
