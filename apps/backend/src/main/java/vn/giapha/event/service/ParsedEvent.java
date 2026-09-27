package vn.giapha.event.service;

import vn.giapha.event.entity.EventCalendar;

/** Nội dung sự kiện chung đã kiểm tra và chuẩn hóa. */
record ParsedEvent(String title, String description, EventCalendar calendar, int day, int month, Integer year,
        boolean leap) {
}
