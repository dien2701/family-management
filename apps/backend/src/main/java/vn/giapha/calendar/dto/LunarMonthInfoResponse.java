package vn.giapha.calendar.dto;

import java.time.LocalDate;

/**
 * Thông tin một tháng âm: số ngày (29/30), ngày dương của mùng 1 và ngày cuối tháng,
 * và tháng nhuận của cả năm âm ({@code null} nếu năm không nhuận).
 */
public record LunarMonthInfoResponse(int year, int month, boolean leap, int days, LocalDate firstDay,
        LocalDate lastDay, Integer yearLeapMonth) {
}
