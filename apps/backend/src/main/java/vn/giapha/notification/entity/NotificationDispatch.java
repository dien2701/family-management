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

    /** NULL khi bản tin gửi cho subscription khách (DECISIONS #89). */
    @Column(name = "account_id", updatable = false)
    private Long accountId;

    /** Chỉ có với subscription khách; chống trùng của khách tính theo cột này. */
    @Column(name = "subscription_id", updatable = false)
    private Long subscriptionId;

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

    public static NotificationDispatch forSubscription(Long subscriptionId, String eventKey, LocalDate occurrenceDate,
            int daysBefore, Instant createdAt) {
        NotificationDispatch d = new NotificationDispatch(null, eventKey, occurrenceDate, daysBefore, createdAt);
        d.subscriptionId = subscriptionId;
        return d;
    }

    public Long getId() {
        return id;
    }
}
