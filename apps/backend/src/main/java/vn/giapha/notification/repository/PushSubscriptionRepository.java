package vn.giapha.notification.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.notification.entity.PushSubscription;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    Optional<PushSubscription> findByEndpoint(String endpoint);

    List<PushSubscription> findAllByAccountId(Long accountId);

    /** Subscription khách (không gắn tài khoản) đã chọn đúng giờ nhắc {@code HH:mm}. */
    List<PushSubscription> findByAccountIdIsNullAndRemindHour(String remindHour);

    /** Mọi subscription khách; {@link vn.giapha.notification.service.DigestJob} lọc theo giờ khi quét đầu giờ. */
    List<PushSubscription> findByAccountIdIsNull();
}
