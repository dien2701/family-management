package vn.giapha.member.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Một dòng trong danh sách người thân (DECISIONS #75): trong hồ sơ {@code memberId}, {@code relativeMemberId} là
 * "{@code label}". Một chiều, không suy ra gì cho cây. Không bao giờ trả ra API: luôn qua DTO.
 */
@Entity
@Table(name = "member_relative")
public class MemberRelative {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false, updatable = false)
    private Long memberId;

    @Column(name = "relative_member_id", nullable = false, updatable = false)
    private Long relativeMemberId;

    @Column(nullable = false, length = 50)
    private String label;

    @Column(name = "created_by", updatable = false)
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected MemberRelative() {
    }

    public MemberRelative(Long memberId, Long relativeMemberId, String label, Long createdBy, Instant now) {
        this.memberId = memberId;
        this.relativeMemberId = relativeMemberId;
        this.label = label;
        this.createdBy = createdBy;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void relabel(String label, Instant now) {
        this.label = label;
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public Long getMemberId() {
        return memberId;
    }

    public Long getRelativeMemberId() {
        return relativeMemberId;
    }

    public String getLabel() {
        return label;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
