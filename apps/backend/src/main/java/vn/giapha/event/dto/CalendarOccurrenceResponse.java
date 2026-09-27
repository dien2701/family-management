package vn.giapha.event.dto;

/**
 * Một lần xảy ra của giỗ, sinh nhật hoặc sự kiện chung. {@code eventKey} ổn định giữa các lần gọi:
 * {@code MEMORIAL:{memberId}:{yyyy-MM-dd}}, {@code BIRTHDAY:{memberId}:{yyyy-MM-dd}},
 * {@code CUSTOM:{eventId}:{yyyy-MM-dd}} (ngày dương của lần xảy ra).
 */
public record CalendarOccurrenceResponse(
        String eventKey,
        EventType type,
        String title,
        String description,
        Long memberId,
        Long eventId,
        SolarDateResponse solar,
        LunarDateResponse lunar,
        int daysUntil,
        Integer ordinal) {
}
