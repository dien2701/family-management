package vn.giapha.prayer.dto;

import java.util.Map;

import jakarta.validation.constraints.NotNull;

/** Thông tin đã điền cho một bài, dùng cho cả request và response: tên ô → giá trị. Giới hạn do service kiểm tra. */
public record PrayerFillBody(@NotNull(message = "Thiếu thông tin đã điền.") Map<String, String> values) {
}
