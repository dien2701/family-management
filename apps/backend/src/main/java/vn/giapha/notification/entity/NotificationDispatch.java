package vn.giapha.notification.entity;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Đánh dấu một lần xảy ra ở một mốc nhắc đã được gộp vào bản tin của một tài khoản (IDEA §9 mục 4), chống
 * {@link DigestJob} gửi trùng khi chạy lại đúng giờ đó.
 */
@Entity
@Table(name = "notification_dispatch",
        uniqueConstraints = @UniqueConstraint(columnNames = { "account_id", "event_key", "occurrence_date",
                "days_before" }))
public class NotificationDispatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false, updatable = false)
    private Long accountId;

    @Column(name = "event_key", nullable = false, length = 150, updatable = false)
    private String eventKey;

    @Column(name = "occurrence_date", nullable = false, updatable = false)
    private LocalDate occurrenceDate;

    @Column(name = "days_before", nullable = false, updatable = false)
    private int daysBefore;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected NotificationDispatch() {
    }

    public NotificationDispatch(Long accountId, String eventKey, LocalDate occurrenceDate, int daysBefore,
            Instant createdAt) {
        this.accountId = accountId;
        this.eventKey = eventKey;
        this.occurrenceDate = occurrenceDate;
        this.daysBefore = daysBefore;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }
}
