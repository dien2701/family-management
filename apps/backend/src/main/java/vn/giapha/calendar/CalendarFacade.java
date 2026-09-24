package vn.giapha.calendar;

import java.time.LocalDate;

import org.springframework.stereotype.Component;

import vn.giapha.calendar.service.AnniversaryRules;
import vn.giapha.calendar.service.CalendarService;

/**
 * API công khai của module calendar: đổi lịch âm–dương (Hồ Ngọc Đức, UTC+8 trước 1968, UTC+7 từ 1968) và quy tắc
 * ngày giỗ/sinh nhật/sự kiện lặp hằng năm. Đầu vào sai hoặc ngoài khoảng 1900–2100 thì ném
 * {@link vn.giapha.common.exception.BusinessException} 400.
 */
@Component
public class CalendarFacade {

    private final CalendarService service;

    CalendarFacade(CalendarService service) {
        this.service = service;
    }

    /** Năm dương có đổi được không (dùng để quyết định có tự điền lịch còn lại hay không). */
    public boolean isSupportedSolarYear(int year) {
        return CalendarService.isSupportedSolarYear(year);
    }

    public boolean isSupportedLunarYear(int year) {
        return CalendarService.isSupportedLunarYear(year);
    }

    public LunarDate toLunar(LocalDate solar) {
        return service.toLunar(solar);
    }

    public LocalDate toSolar(LunarDate lunar) {
        return service.toSolar(lunar);
    }

    /** Ngày âm có tồn tại (đúng tháng nhuận, không phải ngày 30 của tháng thiếu, trong khoảng hỗ trợ). */
    public boolean isValid(LunarDate lunar) {
        return service.isValid(lunar);
    }

    /** Tháng nhuận của năm âm, 0 nếu không nhuận. */
    public int leapMonth(int lunarYear) {
        return service.leapMonth(lunarYear);
    }

    /**
     * Ngày âm (tháng thường) để cúng giỗ, mừng sinh nhật âm hoặc làm sự kiện âm trong năm âm {@code lunarYear}.
     * {@code override} là ngày cúng do Manager ghi đè, {@code null} nếu không có.
     */
    public LunarDate lunarOccurrence(int lunarYear, LunarMonthDay original, LunarMonthDay override) {
        return service.lunarOccurrence(lunarYear, original, override);
    }

    /** Như {@link #lunarOccurrence} nhưng trả ngày dương. */
    public LocalDate lunarOccurrenceSolar(int lunarYear, LunarMonthDay original, LunarMonthDay override) {
        return service.toSolar(service.lunarOccurrence(lunarYear, original, override));
    }

    /** Sinh nhật/sự kiện dương trong năm {@code year}; 29/2 ở năm không nhuận dời sang 28/2. */
    public LocalDate solarOccurrence(int year, int month, int day) {
        return AnniversaryRules.solarOccurrence(year, month, day);
    }
}
