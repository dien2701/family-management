package vn.giapha.calendar.dto;

import java.time.LocalDate;

/** Một ngày ở cả hai lịch. */
public record ConvertResponse(LocalDate solar, LunarDateResponse lunar) {
}
