package vn.giapha.member.dto;

/** Ngày âm; {@code year} bỏ trống nghĩa là chỉ biết ngày/tháng (không tính "giỗ lần thứ N"). */
public record MemberLunarDate(Integer day, Integer month, Boolean leap, Integer year) {
}
