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
 * {@code deletedAt}: Admin đã xóa lúc nào, {@code null} khi chưa xóa (DECISIONS #97).
 * {@code rootAdmin}: tài khoản có email {@code ROOT_ADMIN_EMAIL}, Admin khác không hạ cấp được (DECISIONS #98).
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
        Instant createdAt,
        Instant deletedAt,
        boolean rootAdmin) {

    public AccountAdminResponse withMember(LinkedMember member) {
        return new AccountAdminResponse(id, email, fullName, avatarUrl, systemRole, status, lockReason, approvalStatus,
                approvedBy, approvedAt, memberId, member, createdAt, deletedAt, rootAdmin);
    }

    public AccountAdminResponse withRootAdmin(boolean rootAdmin) {
        return new AccountAdminResponse(id, email, fullName, avatarUrl, systemRole, status, lockReason, approvalStatus,
                approvedBy, approvedAt, memberId, member, createdAt, deletedAt, rootAdmin);
    }
}
