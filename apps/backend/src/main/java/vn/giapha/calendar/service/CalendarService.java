package vn.giapha.calendar.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import vn.giapha.calendar.LunarDate;
import vn.giapha.calendar.LunarMonthDay;
import vn.giapha.calendar.dto.ConvertResponse;
import vn.giapha.calendar.dto.LunarMonthInfoResponse;
import vn.giapha.calendar.mapper.CalendarMapper;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;

/**
 * Kiểm tra đầu vào rồi gọi {@link LunarCalendar}/{@link AnniversaryRules}. Mọi lỗi đầu vào thành
 * {@link BusinessException} 400 với thông báo tiếng Việt; lớp thuật toán không bao giờ nhận giá trị sai.
 * Không đụng DB nên không cần transaction.
 */
@Service
public class CalendarService {

    public static final String QUERY_INVALID = "CALENDAR_QUERY_INVALID";
    public static final String OUT_OF_RANGE = "CALENDAR_OUT_OF_RANGE";
    public static final String LUNAR_DATE_INVALID = "LUNAR_DATE_INVALID";

    private final CalendarMapper mapper;

    CalendarService(CalendarMapper mapper) {
        this.mapper = mapper;
    }

    /** Đổi theo đúng một chiều: có {@code solar} thì dương sang âm, có đủ năm/tháng/ngày âm thì âm sang dương. */
    public ConvertResponse convert(LocalDate solar, Integer lunarYear, Integer lunarMonth, Integer lunarDay,
            Boolean leap) {
        boolean anyLunar = lunarYear != null || lunarMonth != null || lunarDay != null || leap != null;
        if (solar != null && !anyLunar) {
            return new ConvertResponse(solar, mapper.toResponse(toLunar(solar)));
        }
        if (solar == null && lunarYear != null && lunarMonth != null && lunarDay != null) {
            LunarDate lunar = new LunarDate(lunarYear, lunarMonth, lunarDay, Boolean.TRUE.equals(leap));
            return new ConvertResponse(toSolar(lunar), mapper.toResponse(lunar));
        }
        throw new BusinessException(QUERY_INVALID,
                "Nhập ngày dương (solar) hoặc đủ năm, tháng, ngày âm (lunarYear, lunarMonth, lunarDay), không nhập cả hai.");
    }

    public LunarMonthInfoResponse monthInfo(int lunarYear, int month, boolean leap) {
        requireLunarMonth(lunarYear, month, leap);
        int days = LunarCalendar.daysInMonth(lunarYear, month, leap);
        LocalDate first = LunarCalendar.firstDayOfMonth(lunarYear, month, leap);
        int yearLeap = LunarCalendar.leapMonth(lunarYear);
        return new LunarMonthInfoResponse(lunarYear, month, leap, days, first, first.plusDays(days - 1L),
                yearLeap == 0 ? null : yearLeap);
    }

    public LunarDate toLunar(LocalDate solar) {
        if (!isSupportedSolarYear(solar.getYear())) {
            throw outOfRange("solar", LunarCalendar.MIN_YEAR);
        }
        return LunarCalendar.toLunar(solar);
    }

    public LocalDate toSolar(LunarDate lunar) {
        requireLunarMonth(lunar.year(), lunar.month(), lunar.leap());
        if (lunar.day() < 1 || lunar.day() > 30) {
            throw invalid("lunarDay", "Ngày âm phải từ 1 đến 30.");
        }
        int days = LunarCalendar.daysInMonth(lunar.year(), lunar.month(), lunar.leap());
        if (lunar.day() > days) {
            throw invalid("lunarDay", "Tháng " + monthLabel(lunar.month(), lunar.leap()) + " năm " + lunar.year()
                    + " âm lịch chỉ có " + days + " ngày.");
        }
        return LunarCalendar.toSolar(lunar);
    }

    public boolean isValid(LunarDate lunar) {
        return LunarCalendar.isValid(lunar);
    }

    /** Số ngày của tháng âm (29 hoặc 30), dùng để dựng lịch tháng theo âm (module event). */
    public int daysInMonth(int lunarYear, int month, boolean leap) {
        requireLunarMonth(lunarYear, month, leap);
        return LunarCalendar.daysInMonth(lunarYear, month, leap);
    }

    /** Ngày dương của mùng 1 tháng âm, dùng để dựng lịch tháng theo âm (module event). */
    public LocalDate firstDayOfMonth(int lunarYear, int month, boolean leap) {
        requireLunarMonth(lunarYear, month, leap);
        return LunarCalendar.firstDayOfMonth(lunarYear, month, leap);
    }

    public int leapMonth(int lunarYear) {
        requireLunarYear(lunarYear);
        return LunarCalendar.leapMonth(lunarYear);
    }

    public LunarDate lunarOccurrence(int lunarYear, LunarMonthDay original, LunarMonthDay override) {
        requireLunarYear(lunarYear);
        LunarMonthDay base = override != null ? override : original;
        if (base == null) {
            throw invalid("lunarDay", "Chưa có ngày/tháng âm.");
        }
        if (base.month() < 1 || base.month() > 12 || base.day() < 1 || base.day() > 30) {
            throw invalid("lunarDay", "Ngày/tháng âm không hợp lệ.");
        }
        return AnniversaryRules.lunarOccurrence(lunarYear, original, override);
    }

    public static boolean isSupportedSolarYear(int year) {
        return year >= LunarCalendar.MIN_YEAR && year <= LunarCalendar.MAX_YEAR;
    }

    public static boolean isSupportedLunarYear(int year) {
        return year >= LunarCalendar.MIN_LUNAR_YEAR && year <= LunarCalendar.MAX_YEAR;
    }

    private void requireLunarYear(int lunarYear) {
        if (!isSupportedLunarYear(lunarYear)) {
            throw outOfRange("lunarYear", LunarCalendar.MIN_LUNAR_YEAR);
        }
    }

    private void requireLunarMonth(int lunarYear, int month, boolean leap) {
        requireLunarYear(lunarYear);
        if (month < 1 || month > 12) {
            throw invalid("lunarMonth", "Tháng âm phải từ 1 đến 12.");
        }
        if (leap && LunarCalendar.leapMonth(lunarYear) != month) {
            int actual = LunarCalendar.leapMonth(lunarYear);
            throw invalid("leap", "Năm " + lunarYear + " âm lịch không có tháng " + month + " nhuận"
                    + (actual == 0 ? " (năm này không nhuận)." : " (năm này nhuận tháng " + actual + ")."));
        }
    }

    private static String monthLabel(int month, boolean leap) {
        return leap ? month + " nhuận" : String.valueOf(month);
    }

    private static BusinessException invalid(String field, String message) {
        return new BusinessException(HttpStatus.BAD_REQUEST, LUNAR_DATE_INVALID, message,
                List.of(new FieldError(field, message)));
    }

    private static BusinessException outOfRange(String field, int min) {
        String message = "Chỉ hỗ trợ năm từ " + min + " đến " + LunarCalendar.MAX_YEAR + ".";
        return new BusinessException(HttpStatus.BAD_REQUEST, OUT_OF_RANGE, message,
                List.of(new FieldError(field, message)));
    }
}
