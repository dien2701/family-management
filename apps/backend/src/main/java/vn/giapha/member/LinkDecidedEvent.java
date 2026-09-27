package vn.giapha.member;

/**
 * Kết quả liên kết "Tôi là ai" của một tài khoản, phát <b>đồng bộ trong transaction</b> của thao tác để Đợt 34 gửi
 * thông báo cho tài khoản đó (DECISIONS #80): Admin duyệt hoặc từ chối yêu cầu, hoặc Admin gán trực tiếp.
 */
public record LinkDecidedEvent(Long accountId, Long memberId, Outcome outcome, Long actorId) {

    public enum Outcome {
        APPROVED, REJECTED, ASSIGNED
    }
}
