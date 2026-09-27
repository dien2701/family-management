package vn.giapha.calendar.dto;

/** Ngày âm; {@code leap = true} khi thuộc tháng nhuận. */
public record LunarDateResponse(int year, int month, int day, boolean leap) {
}
