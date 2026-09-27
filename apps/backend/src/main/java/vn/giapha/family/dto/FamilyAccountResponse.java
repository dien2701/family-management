package vn.giapha.family.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Một tài khoản trong family. {@code email} chỉ có khi người xem là Manager hoặc chính chủ (security.md). */
public record FamilyAccountResponse(
        Long id,
        String fullName,
        String avatarUrl,
        String familyRole,
        Long memberId,
        @JsonInclude(JsonInclude.Include.NON_NULL) String email) {
}
