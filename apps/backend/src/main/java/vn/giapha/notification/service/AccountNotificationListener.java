package vn.giapha.notification.service;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import vn.giapha.auth.AccountApprovedEvent;
import vn.giapha.auth.AccountPendingEvent;
import vn.giapha.auth.AuthFacade;
import vn.giapha.notification.entity.NotificationType;

/** Nghe sự kiện của module auth (IDEA §9 mục 5): tài khoản mới chờ duyệt báo mọi Admin, được duyệt báo chính chủ. */
@Component
class AccountNotificationListener {

    private static final String ACCOUNT_QUEUE_LINK = "/quan-tri/tai-khoan";

    private final NotificationService notifications;
    private final AuthFacade auth;

    AccountNotificationListener(NotificationService notifications, AuthFacade auth) {
        this.notifications = notifications;
        this.auth = auth;
    }

    @EventListener
    void on(AccountPendingEvent event) {
        String name = auth.find(event.accountId()).map(AuthFacade.Account::fullName).orElse("Một tài khoản");
        String body = name + " vừa đăng ký, đang chờ bạn duyệt.";
        for (Long adminId : auth.usableAdminIds()) {
            notifications.notify(adminId, NotificationType.ACCOUNT_PENDING, "Tài khoản mới chờ duyệt", body,
                    ACCOUNT_QUEUE_LINK);
        }
    }

    @EventListener
    void on(AccountApprovedEvent event) {
        notifications.notify(event.accountId(), NotificationType.ACCOUNT_APPROVED, "Tài khoản đã được duyệt",
                "Tài khoản của bạn đã được duyệt. Bạn có thể dùng đầy đủ chức năng.", "/");
    }
}
