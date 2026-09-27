package vn.giapha.event.dto;

import java.time.Instant;

import vn.giapha.event.entity.EventCalendar;

/** Sự kiện chung. {@code year = null} nghĩa là lặp hằng năm; {@code leap} chỉ có nghĩa khi {@code calendar = LUNAR}. */
public record CustomEventResponse(
        Long id,
        String title,
        String description,
        EventCalendar calendar,
        int day,
        int month,
        Integer year,
        boolean leap,
        Instant createdAt,
        Instant updatedAt) {
}
