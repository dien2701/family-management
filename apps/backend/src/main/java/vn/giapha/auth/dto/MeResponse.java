package vn.giapha.auth.dto;

import java.time.Instant;

import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.FamilyRole;
import vn.giapha.auth.entity.SystemRole;

/** Thông tin tài khoản đang đăng nhập. Tuyệt đối không có password_hash, google_sub hay hash token. */
public record MeResponse(
        Long id,
        String email,
        String fullName,
        String avatarUrl,
        SystemRole systemRole,
        AccountStatus status,
        Long familyId,
        FamilyRole familyRole,
        Long memberId,
        boolean hideMaternalLine,
        Instant createdAt) {
}
