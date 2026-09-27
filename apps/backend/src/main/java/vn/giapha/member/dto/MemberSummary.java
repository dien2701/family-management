package vn.giapha.member.dto;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import vn.giapha.member.entity.Gender;

/**
 * Dòng trong danh sách thành viên. Họ tên ghi nguyên văn, kể cả "Cụ", "Ông", "Bà", "(Tức ...)".
 * {@code generation} và {@code onTree} lấy từ cây gia phả (Đợt 29); chưa có cây thì {@code null} và {@code false}.
 */
public record MemberSummary(
        Long id,
        String fullName,
        Gender gender,
        String avatarUrl,
        List<String> labels,
        Integer birthYear,
        @JsonProperty("isDeceased") boolean isDeceased,
        Integer deathYear,
        Integer generation,
        boolean onTree,
        Instant createdAt) {
}
