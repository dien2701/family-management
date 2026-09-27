package vn.giapha.notification.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.notification.entity.PushSubscription;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    Optional<PushSubscription> findByEndpoint(String endpoint);

    List<PushSubscription> findAllByAccountId(Long accountId);

    void deleteByAccountIdAndEndpoint(Long accountId, String endpoint);
}
