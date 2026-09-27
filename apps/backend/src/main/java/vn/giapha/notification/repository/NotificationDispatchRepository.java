package vn.giapha.notification.repository;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.notification.entity.NotificationDispatch;

public interface NotificationDispatchRepository extends JpaRepository<NotificationDispatch, Long> {

    boolean existsByAccountIdAndEventKeyAndOccurrenceDateAndDaysBefore(Long accountId, String eventKey,
            LocalDate occurrenceDate, int daysBefore);
}
