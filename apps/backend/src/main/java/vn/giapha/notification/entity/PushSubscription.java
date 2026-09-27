package vn.giapha.notification.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Đăng ký nhận Web Push của một thiết bị (IDEA §9, DECISIONS #46). {@code endpoint} là duy nhất toàn hệ thống. */
@Entity
@Table(name = "push_subscription")
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
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

    protected PushSubscription() {
    }

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

    public void markOk(Instant now) {
        this.lastOkAt = now;
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
}
