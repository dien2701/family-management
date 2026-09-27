package vn.giapha.calendar;

/**
 * Một ngày âm lịch. {@code leap = true} nghĩa là ngày thuộc tháng nhuận {@code month}.
 * Record chỉ giữ giá trị; ngày có tồn tại trong năm âm hay không do {@link CalendarFacade} kiểm tra.
 */
public record LunarDate(int year, int month, int day, boolean leap) {
}
