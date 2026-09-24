package vn.giapha.family.dto;

import java.time.Instant;
import java.util.List;

public record FamilyResponse(
        Long id,
        String name,
        String originPlace,
        String description,
        String coverUrl,
        Instant createdAt,
        List<FamilyAccountResponse> accounts) {
}
