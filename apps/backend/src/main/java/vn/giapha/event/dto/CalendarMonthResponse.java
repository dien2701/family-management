package vn.giapha.event.dto;

import java.util.List;

public record CalendarMonthResponse(
        String mode,
        int year,
        int month,
        boolean leap,
        List<CalendarDayResponse> days) {
}
