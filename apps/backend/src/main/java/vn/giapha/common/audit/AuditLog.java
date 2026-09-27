package vn.giapha.common.audit;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Một dòng audit log. Bất biến: chỉ được tạo, không có setter. */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id", updatable = false)
    private Long actorId;

    @Column(nullable = false, updatable = false, length = 50)
    private String action;

    @Column(name = "target_type", nullable = false, updatable = false, length = 50)
    private String targetType;

    @Column(name = "target_id", updatable = false)
    private Long targetId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "before_data", updatable = false)
    private String beforeData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "after_data", updatable = false)
    private String afterData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AuditLog() {
    }

    AuditLog(Long actorId, String action, String targetType, Long targetId,
            String beforeData, String afterData, Instant createdAt) {
        this.actorId = actorId;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.beforeData = beforeData;
        this.afterData = afterData;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getActorId() {
        return actorId;
    }

    public String getAction() {
        return action;
    }

    public String getTargetType() {
        return targetType;
    }

    public Long getTargetId() {
        return targetId;
    }

    public String getBeforeData() {
        return beforeData;
    }

    public String getAfterData() {
        return afterData;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
