package vn.giapha.member.dto;

import java.time.Instant;

/** Một dòng người thân: trong hồ sơ này, {@code relative} là "{@code label}". */
public record RelativeResponse(Long id, MemberSummary relative, String label, Instant createdAt) {
}
