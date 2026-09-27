package vn.giapha.auth.dto;

import java.time.Instant;

import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.ApprovalStatus;
import vn.giapha.auth.entity.LockReason;
import vn.giapha.auth.entity.SystemRole;
import vn.giapha.common.web.LinkedMember;

/**
 * Tài khoản trong màn quản trị (chỉ Admin thấy nên có email). Không có hash, google_sub hay token.
 * {@code member}: thành viên đang liên kết, {@code null} khi chưa liên kết (DECISIONS #80).
 */
public record AccountAdminResponse(
        Long id,
        String email,
        String fullName,
        String avatarUrl,
        SystemRole systemRole,
        AccountStatus status,
        LockReason lockReason,
        ApprovalStatus approvalStatus,
        Long approvedBy,
        Instant approvedAt,
        Long memberId,
        LinkedMember member,
        Instant createdAt) {

    public AccountAdminResponse withMember(LinkedMember member) {
        return new AccountAdminResponse(id, email, fullName, avatarUrl, systemRole, status, lockReason, approvalStatus,
                approvedBy, approvedAt, memberId, member, createdAt);
    }
}
