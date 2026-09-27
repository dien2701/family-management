package vn.giapha.family.dto;

import java.time.Instant;

public record InvitationResponse(
        Long id,
        String code,
        String link,
        Instant expiresAt,
        Instant createdAt,
        Instant revokedAt,
        Status status) {

    public enum Status {
        ACTIVE, EXPIRED, REVOKED
    }
}
