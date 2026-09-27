package vn.giapha.notification.service;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import vn.giapha.auth.AuthFacade;
import vn.giapha.notification.entity.NotificationType;
import vn.giapha.proposal.ProposalCreatedEvent;
import vn.giapha.proposal.ProposalReviewedEvent;

/** Nghe sự kiện của module proposal (IDEA §6.6, §9): đề xuất mới báo mọi Admin, kết quả báo người đã đề xuất. */
@Component
class ProposalNotificationListener {

    private static final String PROPOSAL_QUEUE_LINK = "/quan-tri/de-xuat";
    private static final String MY_PROPOSALS_LINK = "/de-xuat";

    private final NotificationService notifications;
    private final AuthFacade auth;

    ProposalNotificationListener(NotificationService notifications, AuthFacade auth) {
        this.notifications = notifications;
        this.auth = auth;
    }

    @EventListener
    void on(ProposalCreatedEvent event) {
        String name = auth.find(event.accountId()).map(AuthFacade.Account::fullName).orElse("Một tài khoản");
        String body = name + " vừa gửi một đề xuất sự kiện, đang chờ bạn duyệt.";
        for (Long adminId : auth.usableAdminIds()) {
            notifications.notify(adminId, NotificationType.PROPOSAL_NEW, "Đề xuất mới chờ duyệt", body,
                    PROPOSAL_QUEUE_LINK);
        }
    }

    @EventListener
    void on(ProposalReviewedEvent event) {
        if (event.approved()) {
            notifications.notify(event.accountId(), NotificationType.PROPOSAL_APPROVED, "Đề xuất đã được duyệt",
                    "Đề xuất sự kiện của bạn đã được duyệt.", MY_PROPOSALS_LINK);
        } else {
            String reason = event.note() == null || event.note().isBlank() ? "" : " Lý do: " + event.note();
            notifications.notify(event.accountId(), NotificationType.PROPOSAL_REJECTED, "Đề xuất bị từ chối",
                    "Đề xuất sự kiện của bạn đã bị từ chối." + reason, MY_PROPOSALS_LINK);
        }
    }
}
