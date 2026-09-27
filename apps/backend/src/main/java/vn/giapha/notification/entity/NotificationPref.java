package vn.giapha.notification.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Tùy chọn thông báo của một tài khoản (IDEA §9 mục 6), tạo lười ở lần đọc đầu tiên. {@code remindDaysBefore} và
 * {@code remindHour} chỉ dùng cho job gộp bản tin theo giờ (Đợt 35); {@code notifyProposals} còn gác các thông báo
 * tức thời về đề xuất.
 */
@Entity
@Table(name = "notification_pref")
public class NotificationPref {

    @Id
    @Column(name = "account_id")
    private Long accountId;

    @Column(name = "notify_events", nullable = false)
    private boolean notifyEvents;

    @Column(name = "notify_memorials", nullable = false)
    private boolean notifyMemorials;

    @Column(name = "notify_proposals", nullable = false)
    private boolean notifyProposals;

    /** JSON, ví dụ {@code [7,3,1,0]}. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "remind_days_before", nullable = false)
    private String remindDaysBefore;

    @Column(name = "remind_hour", nullable = false, length = 5)
    private String remindHour;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected NotificationPref() {
    }

    public NotificationPref(Long accountId, boolean notifyEvents, boolean notifyMemorials, boolean notifyProposals,
            String remindDaysBeforeJson, String remindHour, Instant now) {
        this.accountId = accountId;
        this.notifyEvents = notifyEvents;
        this.notifyMemorials = notifyMemorials;
        this.notifyProposals = notifyProposals;
        this.remindDaysBefore = remindDaysBeforeJson;
        this.remindHour = remindHour;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void apply(boolean notifyEvents, boolean notifyMemorials, boolean notifyProposals,
            String remindDaysBeforeJson, String remindHour, Instant now) {
        this.notifyEvents = notifyEvents;
        this.notifyMemorials = notifyMemorials;
        this.notifyProposals = notifyProposals;
        this.remindDaysBefore = remindDaysBeforeJson;
        this.remindHour = remindHour;
        this.updatedAt = now;
    }

    public Long getAccountId() {
        return accountId;
    }

    public boolean isNotifyEvents() {
        return notifyEvents;
    }

    public boolean isNotifyMemorials() {
        return notifyMemorials;
    }

    public boolean isNotifyProposals() {
        return notifyProposals;
    }

    public String getRemindDaysBefore() {
        return remindDaysBefore;
    }

    public String getRemindHour() {
        return remindHour;
    }
}
