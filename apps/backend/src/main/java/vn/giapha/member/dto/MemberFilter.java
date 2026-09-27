package vn.giapha.member.dto;

/**
 * Bộ lọc danh sách thành viên; các điều kiện kết hợp bằng AND. {@code sort} là một trong {@code name}, {@code age},
 * {@code created}, {@code generation}. {@code generation} và {@code onTree} lấy từ cây gia phả.
 */
public record MemberFilter(String q, String sort, Integer ageMin, Integer ageMax, Integer generation,
        Boolean deceased, Boolean onTree) {
}
