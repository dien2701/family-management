package vn.giapha.event.service;

import java.time.LocalDate;

import vn.giapha.calendar.LunarDate;
import vn.giapha.event.dto.EventType;

/** Một lần xảy ra của giỗ, sinh nhật hoặc sự kiện chung. */
record Occurrence(String eventKey, EventType type, String title, String description, Long memberId, Long eventId,
        LocalDate solar, LunarDate lunar, Integer ordinal) {
}
