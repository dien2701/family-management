package vn.giapha.calendar.service;

import java.time.LocalDate;
import java.time.Year;

import vn.giapha.calendar.LunarDate;
import vn.giapha.calendar.LunarMonthDay;

/**
 * Quy tắc ngày cúng giỗ, sinh nhật và sự kiện lặp hằng năm (IDEA §7). Lớp thuần; bản TS phải giống hệt.
 *
 * <p>Ngày âm trong năm âm Y được chọn theo thứ tự:
 * <ol>
 *   <li>có ngày ghi đè (Manager đặt ngày cúng khác) thì lấy ngày ghi đè thay cho ngày gốc;</li>
 *   <li>ngày thuộc tháng nhuận thì cúng vào tháng thường cùng số, kể cả khi năm Y cũng nhuận tháng đó;</li>
 *   <li>năm Y tháng đó thiếu (29 ngày) mà ngày là 30 thì cúng ngày 29.</li>
 * </ol>
 * Bước 2 và 3 áp dụng cả cho ngày ghi đè, để ngày cúng luôn tồn tại.
 */
public final class AnniversaryRules {

    private AnniversaryRules() {
    }

    /** Ngày âm (luôn là tháng thường) để cúng giỗ, mừng sinh nhật âm hoặc làm sự kiện âm trong năm âm Y. */
    public static LunarDate lunarOccurrence(int lunarYear, LunarMonthDay original, LunarMonthDay override) {
        LunarMonthDay base = override != null ? override : original;
        requireMonthDay(base);
        int days = LunarCalendar.daysInMonth(lunarYear, base.month(), false);
        return new LunarDate(lunarYear, base.month(), Math.min(base.day(), days), false);
    }

    /** Như {@link #lunarOccurrence} nhưng trả về ngày dương tương ứng. */
    public static LocalDate lunarOccurrenceSolar(int lunarYear, LunarMonthDay original, LunarMonthDay override) {
        return LunarCalendar.toSolar(lunarOccurrence(lunarYear, original, override));
    }

    /** Sinh nhật hoặc sự kiện dương trong năm Y; 29/2 ở năm không nhuận dời sang 28/2. */
    public static LocalDate solarOccurrence(int year, int month, int day) {
        if (month == 2 && day == 29 && !Year.isLeap(year)) {
            return LocalDate.of(year, 2, 28);
        }
        return LocalDate.of(year, month, day);
    }

    private static void requireMonthDay(LunarMonthDay d) {
        if (d.month() < 1 || d.month() > 12 || d.day() < 1 || d.day() > 30) {
            throw new IllegalArgumentException("Ngày âm không hợp lệ: " + d.day() + "/" + d.month());
        }
    }
}
