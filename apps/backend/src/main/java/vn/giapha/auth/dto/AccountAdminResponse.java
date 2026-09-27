package vn.giapha.auth.dto;

import java.time.Instant;

import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.ApprovalStatus;
import vn.giapha.auth.entity.LockReason;
import vn.giapha.auth.entity.SystemRole;

/** Tài khoản trong màn quản trị (chỉ Admin thấy nên có email). Không có hash, google_sub hay token. */
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
        Instant createdAt) {
}
