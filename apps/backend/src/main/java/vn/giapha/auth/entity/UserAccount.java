package vn.giapha.auth.entity;

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

/** Tài khoản đăng nhập. Không bao giờ trả ra API: luôn qua DTO. */
@Entity
@Table(name = "user_account")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Column(name = "google_sub", length = 64)
    private String googleSub;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "system_role", nullable = false, length = 10)
    private SystemRole systemRole = SystemRole.USER;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private AccountStatus status;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "lock_reason", length = 20)
    private LockReason lockReason;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "approval_status", nullable = false, length = 10)
    private ApprovalStatus approvalStatus = ApprovalStatus.WAITING;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected UserAccount() {
    }

    public UserAccount(String email, String fullName, AccountStatus status, Instant createdAt) {
        this.email = email;
        this.fullName = fullName;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getGoogleSub() {
        return googleSub;
    }

    public void setGoogleSub(String googleSub) {
        this.googleSub = googleSub;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public SystemRole getSystemRole() {
        return systemRole;
    }

    public void setSystemRole(SystemRole systemRole) {
        this.systemRole = systemRole;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }

    public LockReason getLockReason() {
        return lockReason;
    }

    public void setLockReason(LockReason lockReason) {
        this.lockReason = lockReason;
    }

    public ApprovalStatus getApprovalStatus() {
        return approvalStatus;
    }

    public Long getApprovedBy() {
        return approvedBy;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    /** Duyệt (hoặc duyệt lại) tài khoản; ghi lại Admin và thời điểm duyệt. */
    public void approve(Long adminId, Instant at) {
        this.approvalStatus = ApprovalStatus.APPROVED;
        this.approvedBy = adminId;
        this.approvedAt = at;
    }

    /** Từ chối: không còn "đã duyệt" nên xóa dấu vết duyệt; ai từ chối nằm trong audit log. */
    public void reject() {
        this.approvalStatus = ApprovalStatus.REJECTED;
        this.approvedBy = null;
        this.approvedAt = null;
    }

    /** Tài khoản đã xác thực OTP, không bị khóa và đã được duyệt: đủ điều kiện dùng dữ liệu gia phả. */
    public boolean isActiveAndApproved() {
        return status == AccountStatus.ACTIVE && approvalStatus == ApprovalStatus.APPROVED;
    }

    public Long getMemberId() {
        return memberId;
    }

    /** Điều kiện (đã duyệt, chưa liên kết, thành viên chưa có chủ) do {@code AccountLinking} kiểm trước khi gọi. */
    public void linkMember(Long memberId) {
        this.memberId = memberId;
    }

    /** Khóa hay từ chối tài khoản không gỡ liên kết (DECISIONS #82); chỉ User hoặc Admin hủy mới gọi hàm này. */
    public void unlinkMember() {
        this.memberId = null;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
