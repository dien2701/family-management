package vn.giapha.auth.dto;

import java.time.Instant;

import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.ApprovalStatus;
import vn.giapha.auth.entity.SystemRole;

/**
 * Thông tin tài khoản đang đăng nhập. Tuyệt đối không có password_hash, google_sub hay hash token.
 * {@code consentRequired}: chưa đồng ý chính sách ở phiên bản hiện hành (Google lần đầu, hoặc chính sách vừa đổi).
 * {@code approvalRequired}: hệ thống đang bắt Admin duyệt tài khoản mới (cấu hình {@code app.auth.require-approval}).
 */
public record MeResponse(
        Long id,
        String email,
        String fullName,
        String avatarUrl,
        SystemRole systemRole,
        AccountStatus status,
        ApprovalStatus approvalStatus,
        boolean consentRequired,
        boolean approvalRequired,
        Long memberId,
        Instant createdAt) {
}
