package vn.giapha.event.dto;

import java.util.List;

public record CalendarDayResponse(
        SolarDateResponse solar,
        LunarDateResponse lunar,
        List<CalendarOccurrenceResponse> occurrences) {
}
