package vn.giapha.proposal;

/**
 * Một đề xuất sự kiện chung vừa được gửi (IDEA §9), phát <b>đồng bộ trong transaction</b> để Đợt 34 báo cho mọi
 * Admin.
 */
public record ProposalCreatedEvent(Long proposalId, Long accountId) {
}
