package vn.giapha.ai.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Một đoạn chat của tài khoản đã duyệt (DECISIONS #94). Tin nhắn thuộc đoạn qua {@code ai_message.conversation_id};
 * xóa đoạn thì DB xóa theo mọi tin (FK {@code ON DELETE CASCADE}).
 */
@Entity
@Table(name = "ai_conversation")
public class AiConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false, updatable = false)
    private Long accountId;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false)
    private boolean pinned;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AiConversation() {
    }

    public AiConversation(Long accountId, String title, Instant now) {
        this.accountId = accountId;
        this.title = title;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void rename(String title) {
        this.title = title;
    }

    public void pin(boolean pinned) {
        this.pinned = pinned;
    }

    /** Có tin mới: đưa đoạn lên đầu danh sách. */
    public void touch(Instant now) {
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public Long getAccountId() {
        return accountId;
    }

    public String getTitle() {
        return title;
    }

    public boolean isPinned() {
        return pinned;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
