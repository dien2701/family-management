package vn.giapha.notification.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Đăng ký nhận Web Push của một thiết bị (IDEA §9, DECISIONS #46, #89). {@code endpoint} là duy nhất toàn hệ thống.
 * {@code accountId} NULL nghĩa là subscription khách: khi đó các cột tùy chọn bên dưới quyết định bản tin; với
 * subscription của tài khoản, chúng bị bỏ qua (dùng {@link NotificationPref}).
 */
@Entity
@Table(name = "push_subscription")
public class PushSubscription {

    public static final String DEFAULT_REMIND_DAYS = "[30,15,7,3,1,0]";
    public static final String DEFAULT_REMIND_HOUR = "07:00";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id")
    private Long accountId;

    @Column(nullable = false, length = 500, updatable = false)
    private String endpoint;

    @Column(nullable = false, length = 255)
    private String p256dh;

    @Column(name = "auth_key", nullable = false, length = 255)
    private String authKey;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "last_ok_at")
    private Instant lastOkAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "notify_events", nullable = false)
    private boolean notifyEvents = true;

    @Column(name = "notify_memorials", nullable = false)
    private boolean notifyMemorials = true;

    /** JSON, ví dụ {@code [30,15,7,3,1,0]}. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "remind_days_before", nullable = false)
    private String remindDaysBefore = DEFAULT_REMIND_DAYS;

    @Column(name = "remind_hour", nullable = false, length = 5)
    private String remindHour = DEFAULT_REMIND_HOUR;

    protected PushSubscription() {
    }

    /** {@code accountId} NULL để tạo subscription khách. */
    public PushSubscription(Long accountId, String endpoint, String p256dh, String authKey, String userAgent,
            Instant createdAt) {
        this.accountId = accountId;
        this.endpoint = endpoint;
        this.p256dh = p256dh;
        this.authKey = authKey;
        this.userAgent = userAgent;
        this.createdAt = createdAt;
    }

    /** Cùng một endpoint đăng ký lại (đổi tài khoản đăng nhập trên cùng thiết bị, hoặc khóa đã xoay). */
    public void reassign(Long accountId, String p256dh, String authKey, String userAgent) {
        this.accountId = accountId;
        this.p256dh = p256dh;
        this.authKey = authKey;
        this.userAgent = userAgent;
    }

    /** Đăng xuất: chuyển lại thành khách, tùy chọn khách về mặc định (DECISIONS #89). */
    public void releaseToGuest() {
        this.accountId = null;
        applyGuestPref(true, true, DEFAULT_REMIND_DAYS, DEFAULT_REMIND_HOUR);
    }

    public void applyGuestPref(boolean notifyEvents, boolean notifyMemorials, String remindDaysBeforeJson,
            String remindHour) {
        this.notifyEvents = notifyEvents;
        this.notifyMemorials = notifyMemorials;
        this.remindDaysBefore = remindDaysBeforeJson;
        this.remindHour = remindHour;
    }

    /** Khách xoay khóa của cùng endpoint: chỉ đổi khóa, giữ tùy chọn. */
    public void rotateKeys(String p256dh, String authKey, String userAgent) {
        this.p256dh = p256dh;
        this.authKey = authKey;
        this.userAgent = userAgent;
    }

    public void markOk(Instant now) {
        this.lastOkAt = now;
    }

    public boolean isGuest() {
        return accountId == null;
    }

    public Long getId() {
        return id;
    }

    public Long getAccountId() {
        return accountId;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public String getP256dh() {
        return p256dh;
    }

    public String getAuthKey() {
        return authKey;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public Instant getLastOkAt() {
        return lastOkAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isNotifyEvents() {
        return notifyEvents;
    }

    public boolean isNotifyMemorials() {
        return notifyMemorials;
    }

    public String getRemindDaysBefore() {
        return remindDaysBefore;
    }

    public String getRemindHour() {
        return remindHour;
    }
}
