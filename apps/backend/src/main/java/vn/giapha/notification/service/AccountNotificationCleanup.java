package vn.giapha.notification.service;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import vn.giapha.auth.AccountPurgedEvent;

/** Xóa thông báo, tùy chọn nhận, Web Push và nhật ký gửi của tài khoản bị xóa vĩnh viễn (chạy trong transaction xóa). */
@Component
class AccountNotificationCleanup {

    private static final List<String> ENTITIES =
            List.of("Notification", "NotificationPref", "PushSubscription", "NotificationDispatch");

    @PersistenceContext
    private EntityManager em;

    @EventListener
    void on(AccountPurgedEvent event) {
        for (String entity : ENTITIES) {
            em.createQuery("delete from " + entity + " x where x.accountId = :id")
                    .setParameter("id", event.accountId()).executeUpdate();
        }
    }
}
