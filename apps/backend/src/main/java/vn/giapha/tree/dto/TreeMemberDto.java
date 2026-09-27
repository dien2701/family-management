package vn.giapha.tree.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Tóm tắt thành viên hiển thị trong ô của cây. Họ tên ghi nguyên văn; {@code gender} là M, F hoặc null (chưa rõ). */
public record TreeMemberDto(
        String fullName,
        String gender,
        String avatarUrl,
        List<String> labels,
        Integer birthYear,
        @JsonProperty("isDeceased") boolean isDeceased,
        Integer deathYear) {
}
