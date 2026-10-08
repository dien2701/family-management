package vn.giapha.notification.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.notification.entity.NotificationPref;

/** {@code account_id} là khóa chính, nên {@code findById}/{@code save} đã đủ dùng. */
public interface NotificationPrefRepository extends JpaRepository<NotificationPref, Long> {

    /** Tài khoản đã chọn đúng giờ nhắc này ({@code HH:mm}); tài khoản chưa từng đổi cài đặt dùng mặc định nên không có dòng. */
    List<NotificationPref> findByRemindHour(String remindHour);
}
