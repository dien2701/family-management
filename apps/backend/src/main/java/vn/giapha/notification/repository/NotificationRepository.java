package vn.giapha.notification.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.giapha.notification.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findAllByAccountIdOrderByCreatedAtDesc(Long accountId, Pageable pageable);

    long countByAccountIdAndReadFalse(Long accountId);

    @Modifying
    @Query("update Notification n set n.read = true where n.accountId = :accountId and n.read = false")
    void markAllRead(@Param("accountId") Long accountId);
}
