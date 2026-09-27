package vn.giapha.proposal;

/**
 * Admin vừa duyệt hoặc từ chối một đề xuất sự kiện chung (IDEA §6.6, §9), phát <b>đồng bộ trong transaction</b> để
 * Đợt 34 báo cho người đã đề xuất. {@code note} chỉ có khi từ chối.
 */
public record ProposalReviewedEvent(Long proposalId, Long accountId, boolean approved, String note) {
}
