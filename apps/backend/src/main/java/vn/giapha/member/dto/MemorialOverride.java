package vn.giapha.member.dto;

/** Ngày giỗ ghi đè (âm lịch, không nhuận), dùng thay cho ngày mất khi gia đình cúng ngày khác. */
public record MemorialOverride(Integer day, Integer month) {
}
