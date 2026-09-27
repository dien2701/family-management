package vn.giapha.notification.service;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import vn.giapha.member.LinkDecidedEvent;
import vn.giapha.member.MemberFacade;
import vn.giapha.notification.entity.NotificationType;

/**
 * Nghe {@link LinkDecidedEvent} của module member (DECISIONS #80): báo kết quả liên kết "Tôi là ai" cho chính tài
 * khoản, dù là tự yêu cầu được duyệt/từ chối hay được Admin gán trực tiếp.
 */
@Component
class LinkNotificationListener {

    private static final String PROFILE_LINK = "/ho-so";

    private final NotificationService notifications;
    private final MemberFacade members;

    LinkNotificationListener(NotificationService notifications, MemberFacade members) {
        this.notifications = notifications;
        this.members = members;
    }

    @EventListener
    void on(LinkDecidedEvent event) {
        String name = members.find(event.memberId()).map(MemberFacade.MemberRef::fullName).orElse("thành viên này");
        switch (event.outcome()) {
            case APPROVED -> notifications.notify(event.accountId(), NotificationType.LINK_APPROVED,
                    "Yêu cầu liên kết đã được duyệt",
                    "Yêu cầu \"Tôi là " + name + "\" đã được duyệt.", PROFILE_LINK);
            case REJECTED -> notifications.notify(event.accountId(), NotificationType.LINK_REJECTED,
                    "Yêu cầu liên kết bị từ chối",
                    "Yêu cầu \"Tôi là " + name + "\" đã bị từ chối.", PROFILE_LINK);
            case ASSIGNED -> notifications.notify(event.accountId(), NotificationType.LINK_ASSIGNED,
                    "Bạn đã được gán hồ sơ",
                    "Admin đã gán tài khoản của bạn với hồ sơ " + name + ".", PROFILE_LINK);
        }
    }
}
