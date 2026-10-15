package vn.giapha.prayer.dto;

import java.time.Instant;

public record PrayerResponse(Long id, String title, String content, Instant createdAt, Instant updatedAt) {
}
