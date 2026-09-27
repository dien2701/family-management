package vn.giapha.proposal.entity;

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
 * Đề xuất sự kiện chung (IDEA §6.6; DECISIONS #77). {@code targetType} luôn là {@code "EVENT"}. {@code payload} là
 * JSON thô của {@code CustomEventInput} ({@code null} khi {@code action = DELETE}). {@code baseUpdatedAt} là
 * {@code custom_event.updated_at} lúc gửi, để phát hiện xung đột khi sự kiện bị sửa sau đó. Không bao giờ trả ra
 * API: luôn qua DTO.
 */
@Entity
@Table(name = "proposal")
public class Proposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false, updatable = false)
    private Long accountId;

    @Column(name = "target_type", nullable = false, length = 20, updatable = false)
    private String targetType;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10, updatable = false)
    private ProposalAction action;

    @Column(name = "target_id", updatable = false)
    private Long targetId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column
    private String payload;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private ProposalStatus status;

    @Column(length = 1000)
    private String note;

    @Column(name = "base_updated_at")
    private Instant baseUpdatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Proposal() {
    }

    public Proposal(Long accountId, String targetType, ProposalAction action, Long targetId, String payload,
            Instant baseUpdatedAt, Instant createdAt) {
        this.accountId = accountId;
        this.targetType = targetType;
        this.action = action;
        this.targetId = targetId;
        this.payload = payload;
        this.status = ProposalStatus.PENDING;
        this.baseUpdatedAt = baseUpdatedAt;
        this.createdAt = createdAt;
    }

    /** @param modifiedPayloadJson thay payload nếu Admin chỉnh trước khi duyệt, {@code null} thì giữ nguyên */
    public void approve(String modifiedPayloadJson) {
        this.status = ProposalStatus.APPROVED;
        if (modifiedPayloadJson != null) {
            this.payload = modifiedPayloadJson;
        }
    }

    public void reject(String note) {
        this.status = ProposalStatus.REJECTED;
        this.note = note;
    }

    public Long getId() {
        return id;
    }

    public Long getAccountId() {
        return accountId;
    }

    public String getTargetType() {
        return targetType;
    }

    public ProposalAction getAction() {
        return action;
    }

    public Long getTargetId() {
        return targetId;
    }

    public String getPayload() {
        return payload;
    }

    public ProposalStatus getStatus() {
        return status;
    }

    public String getNote() {
        return note;
    }

    public Instant getBaseUpdatedAt() {
        return baseUpdatedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
