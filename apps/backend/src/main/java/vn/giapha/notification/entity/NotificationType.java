package vn.giapha.notification.entity;

/** Loại thông báo nghiệp vụ (IDEA §9 mục 5) và bản tin nhắc lịch gộp theo giờ (mục 4, Đợt 35). */
public enum NotificationType {
    ACCOUNT_PENDING, ACCOUNT_APPROVED, LINK_APPROVED, LINK_REJECTED, LINK_ASSIGNED, PROPOSAL_NEW, PROPOSAL_APPROVED,
    PROPOSAL_REJECTED, REMINDER_DIGEST
}
