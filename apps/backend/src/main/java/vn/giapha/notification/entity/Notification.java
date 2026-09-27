package vn.giapha.notification.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Một thông báo trong hộp thư của một tài khoản (IDEA §9). Không bao giờ trả ra API: luôn qua DTO. */
@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false, updatable = false)
    private Long accountId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 30, updatable = false)
    private NotificationType type;

    @Column(nullable = false, length = 200, updatable = false)
    private String title;

    @Column(nullable = false, length = 1000, updatable = false)
    private String body;

    @Column(length = 300, updatable = false)
    private String link;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Notification() {
    }

    public Notification(Long accountId, NotificationType type, String title, String body, String link,
            Instant createdAt) {
        this.accountId = accountId;
        this.type = type;
        this.title = title;
        this.body = body;
        this.link = link;
        this.read = false;
        this.createdAt = createdAt;
    }

    public void markRead() {
        this.read = true;
    }

    public Long getId() {
        return id;
    }

    public Long getAccountId() {
        return accountId;
    }

    public NotificationType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }

    public String getLink() {
        return link;
    }

    public boolean isRead() {
        return read;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
