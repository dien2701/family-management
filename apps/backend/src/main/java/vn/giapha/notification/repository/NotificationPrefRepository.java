package vn.giapha.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.notification.entity.NotificationPref;

/** {@code account_id} là khóa chính, nên {@code findById}/{@code save} đã đủ dùng. */
public interface NotificationPrefRepository extends JpaRepository<NotificationPref, Long> {
}
