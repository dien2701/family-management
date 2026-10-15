package vn.giapha.prayer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Nội dung bài khấn khi thêm hoặc sửa (PUT thay toàn bộ). Quy tắc ô {@code {Tên ô}} do PrayerService kiểm tra. */
public record PrayerInput(
        @NotBlank(message = "Vui lòng nhập tiêu đề.") @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự.") String title,
        @NotNull(message = "Vui lòng nhập nội dung.") @Size(max = 20000, message = "Nội dung tối đa 20.000 ký tự.") String content) {
}
