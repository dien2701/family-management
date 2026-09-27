package vn.giapha.ai.entity;

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

/**
 * Một dòng trong luồng chat duy nhất của một tài khoản (IDEA §10; DECISIONS #47), giữ 30 ngày. {@code draftJson} là
 * ảnh chụp {@code AiDraft} hiện hành khi dòng này (luôn {@code ASSISTANT}) kèm bản nháp đề xuất; id của bản nháp
 * chính là {@link #id} của dòng này. {@code null} khi câu trả lời không kèm bản nháp.
 */
@Entity
@Table(name = "ai_message")
public class AiMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false, updatable = false)
    private Long accountId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10, updatable = false)
    private AiRole role;

    @Column(nullable = false, updatable = false)
    private String content;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "draft_json")
    private String draftJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AiMessage() {
    }

    public AiMessage(Long accountId, AiRole role, String content, String draftJson, Instant createdAt) {
        this.accountId = accountId;
        this.role = role;
        this.content = content;
        this.draftJson = draftJson;
        this.createdAt = createdAt;
    }

    /** Đổi ảnh chụp bản nháp khi User gửi hoặc Admin áp dụng (submit/apply đổi {@code status}). */
    public void changeDraft(String draftJson) {
        this.draftJson = draftJson;
    }

    public Long getId() {
        return id;
    }

    public Long getAccountId() {
        return accountId;
    }

    public AiRole getRole() {
        return role;
    }

    public String getContent() {
        return content;
    }

    public String getDraftJson() {
        return draftJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
