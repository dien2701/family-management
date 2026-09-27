package vn.giapha.member.dto;

/**
 * Thêm người thân vào hồ sơ. Không dùng annotation kiểm tra: {@code RelativeService} gom mọi lỗi (chọn người, nhãn,
 * tự thêm chính mình) thành một {@code VALIDATION_ERROR} theo từng trường, giống handler giả lập của frontend.
 */
public record RelativeInput(Long relativeMemberId, String label) {
}
