package vn.giapha.notification.repository;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.giapha.notification.entity.NotificationDispatch;

public interface NotificationDispatchRepository extends JpaRepository<NotificationDispatch, Long> {

    @Query("select count(d) > 0 from NotificationDispatch d where d.accountId = :accountId and d.eventKey = :eventKey and d.occurrenceDate = :occurrenceDate and d.daysBefore = :daysBefore")
    boolean existsByAccountIdAndEventKeyAndOccurrenceDateAndDaysBefore(@Param("accountId") Long accountId,
            @Param("eventKey") String eventKey, @Param("occurrenceDate") LocalDate occurrenceDate,
            @Param("daysBefore") int daysBefore);
}
