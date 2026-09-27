package vn.giapha.member.dto;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import vn.giapha.member.entity.Gender;

/**
 * Hồ sơ đầy đủ của một thành viên: các trường của {@link MemberSummary} cộng thêm phần còn lại. {@code phone} và
 * {@code email} chỉ có khi người gọi là Admin hoặc chính chủ (DECISIONS #66); với người khác hai khóa này
 * <b>không xuất hiện</b> trong JSON, nên chỉ hai trường này dùng {@code NON_NULL}.
 */
public record MemberDetail(
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
        Instant createdAt,
        String tabooName,
        @JsonInclude(JsonInclude.Include.NON_NULL) String phone,
        @JsonInclude(JsonInclude.Include.NON_NULL) String email,
        String biography,
        MemberBirth birth,
        SolarDate deathSolar,
        MemberLunarDate deathLunar,
        MemorialOverride memorialOverride,
        String burialPlace,
        Instant updatedAt) {
}
