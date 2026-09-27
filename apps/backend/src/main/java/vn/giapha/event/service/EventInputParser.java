package vn.giapha.event.service;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import vn.giapha.calendar.CalendarFacade;
import vn.giapha.calendar.LunarDate;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;
import vn.giapha.event.dto.CustomEventInput;
import vn.giapha.event.entity.EventCalendar;

/**
 * Kiểm tra và chuẩn hóa {@link CustomEventInput} (IDEA §7). {@code year = null} (lặp hằng năm) chỉ cần ngày/tháng
 * có thật ở lịch tương ứng, không cần đúng năm nào: quy tắc IDEA §7 tự gập tháng nhuận và ngày 30 khi tính lần xảy
 * ra. Có {@code year} thì ngày phải tồn tại thật trong đúng năm đó, kể cả tháng nhuận, vì chỉ diễn ra một lần.
 */
@Component
class EventInputParser {

    private static final int MAX_TITLE = 200;
    private static final int MAX_DESCRIPTION = 2000;

    private final CalendarFacade calendar;

    EventInputParser(CalendarFacade calendar) {
        this.calendar = calendar;
    }

    ParsedEvent parse(CustomEventInput in) {
        List<FieldError> errors = new ArrayList<>();

        String title = text(in.title());
        if (title == null) {
            errors.add(new FieldError("title", "Vui lòng nhập tên sự kiện."));
        } else if (title.length() > MAX_TITLE) {
            errors.add(new FieldError("title", "Tên sự kiện tối đa " + MAX_TITLE + " ký tự."));
        }

        String description = text(in.description());
        if (description != null && description.length() > MAX_DESCRIPTION) {
            errors.add(new FieldError("description", "Ghi chú tối đa " + MAX_DESCRIPTION + " ký tự."));
        }

        EventCalendar cal = in.calendar();
        if (cal == null) {
            errors.add(new FieldError("calendar", "Chọn lịch dương hoặc âm."));
        }

        Integer day = in.day();
        Integer month = in.month();
        Integer year = in.year();
        if (day == null) {
            errors.add(new FieldError("day", "Vui lòng nhập ngày."));
        }
        if (month == null) {
            errors.add(new FieldError("month", "Vui lòng nhập tháng."));
        }
        boolean leap = cal == EventCalendar.LUNAR && Boolean.TRUE.equals(in.leap());

        if (cal != null && day != null && month != null) {
            FieldError problem = year == null ? repeatingProblem(cal, month, day)
                    : onceProblem(cal, year, month, day, leap);
            if (problem != null) {
                errors.add(problem);
            }
        }

        if (!errors.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
        }
        return new ParsedEvent(title, description, cal, day, month, year, leap);
    }

    /** Ngày lặp hằng năm: chỉ cần ngày/tháng có thật ở lịch tương ứng. */
    private FieldError repeatingProblem(EventCalendar cal, int month, int day) {
        if (month < 1 || month > 12) {
            return new FieldError("month",
                    cal == EventCalendar.LUNAR ? "Tháng âm phải từ 1 đến 12." : "Tháng dương phải từ 1 đến 12.");
        }
        if (cal == EventCalendar.LUNAR) {
            return day < 1 || day > 30 ? new FieldError("day", "Ngày âm phải từ 1 đến 30.") : null;
        }
        // 29/2 vẫn hợp lệ vì có năm nhuận; kiểm bằng một năm nhuận (2000)
        try {
            LocalDate.of(2000, month, day);
            return null;
        } catch (DateTimeException e) {
            return new FieldError("day", "Tháng " + month + " dương lịch không có ngày " + day + ".");
        }
    }

    /** Một lần: ngày phải tồn tại thật trong đúng năm đó, kể cả tháng nhuận âm. */
    private FieldError onceProblem(EventCalendar cal, int year, int month, int day, boolean leap) {
        if (cal == EventCalendar.SOLAR) {
            if (!calendar.isSupportedSolarYear(year)) {
                return new FieldError("year", "Chỉ hỗ trợ năm dương từ 1900 đến 2100.");
            }
            if (month < 1 || month > 12) {
                return new FieldError("month", "Tháng dương phải từ 1 đến 12.");
            }
            int max = YearMonth.of(year, month).lengthOfMonth();
            if (day < 1 || day > max) {
                return new FieldError("day", "Tháng " + month + " năm " + year + " dương lịch chỉ có " + max
                        + " ngày.");
            }
            return null;
        }
        try {
            calendar.toSolar(new LunarDate(year, month, day, leap));
            return null;
        } catch (BusinessException e) {
            return new FieldError("day", e.getMessage());
        }
    }

    private static String text(String raw) {
        if (raw == null) {
            return null;
        }
        String t = raw.trim();
        return t.isEmpty() ? null : t;
    }
}
