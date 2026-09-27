package vn.giapha.calendar;

/** Ngày/tháng âm lặp hằng năm (giỗ, sinh nhật âm, sự kiện âm), không gắn với năm nào. */
public record LunarMonthDay(int month, int day, boolean leap) {

    public static LunarMonthDay of(int month, int day) {
        return new LunarMonthDay(month, day, false);
    }
}
