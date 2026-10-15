package vn.giapha.prayer.dto;

import java.time.Instant;

/** Một dòng của danh sách, không kèm nội dung. */
public record PrayerSummaryResponse(Long id, String title, Instant createdAt, Instant updatedAt) {
}
