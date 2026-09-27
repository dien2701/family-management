package vn.giapha.member.entity;

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

/** Yêu cầu "Đây là tôi" của một tài khoản (IDEA §6.3). Không bao giờ trả ra API: luôn qua DTO. */
@Entity
@Table(name = "member_link_request")
public class MemberLinkRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false, updatable = false)
    private Long accountId;

    // Không có FK: thành viên bị xóa thì yêu cầu vẫn giữ lại làm lịch sử (V8)
    @Column(name = "member_id", nullable = false, updatable = false)
    private Long memberId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private LinkRequestStatus status = LinkRequestStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "decided_by")
    private Long decidedBy;

    protected MemberLinkRequest() {
    }

    public MemberLinkRequest(Long accountId, Long memberId, Instant now) {
        this.accountId = accountId;
        this.memberId = memberId;
        this.createdAt = now;
    }

    /** @param actorId Admin quyết định; {@code null} khi hệ thống tự hủy */
    public void decide(LinkRequestStatus status, Long actorId, Instant now) {
        this.status = status;
        this.decidedBy = actorId;
        this.decidedAt = now;
    }

    public boolean isPending() {
        return status == LinkRequestStatus.PENDING;
    }

    public Long getId() {
        return id;
    }

    public Long getAccountId() {
        return accountId;
    }

    public Long getMemberId() {
        return memberId;
    }

    public LinkRequestStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public Long getDecidedBy() {
        return decidedBy;
    }
}
