package vn.giapha.event.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.calendar.CalendarFacade;
import vn.giapha.calendar.LunarDate;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;
import vn.giapha.event.dto.CalendarDayResponse;
import vn.giapha.event.dto.CalendarMonthResponse;
import vn.giapha.event.dto.CalendarOccurrenceResponse;
import vn.giapha.event.dto.EventType;
import vn.giapha.event.dto.LunarDateResponse;
import vn.giapha.event.dto.SolarDateResponse;
import vn.giapha.event.repository.CustomEventRepository;
import vn.giapha.member.MemberFacade;

/**
 * Giỗ, sinh nhật và sự kiện chung sắp diễn ra, theo tháng hoặc vừa diễn ra (IDEA §6.5, §7; DECISIONS #65, #72).
 * Đọc toàn bộ thành viên và sự kiện chung rồi tính bằng {@link OccurrenceRules} (vài trăm thành viên nên không cần
 * tối ưu ở DB).
 */
@Service
public class OccurrenceService {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final List<Integer> UPCOMING_DAYS = List.of(7, 15, 30, 90, 365);
    private static final String OUT_OF_RANGE_MESSAGE = "Tháng này không có trong khoảng lịch được hỗ trợ (năm 1900–2100).";

    private final MemberFacade members;
    private final CustomEventRepository events;
    private final CalendarFacade calendar;
    private final Clock clock;

    OccurrenceService(MemberFacade members, CustomEventRepository events, CalendarFacade calendar, Clock clock) {
        this.members = members;
        this.events = events;
        this.calendar = calendar;
        this.clock = clock;
    }

    /** Mọi lần xảy ra có ngày dương trong {@code [from, to]}; {@code type = null} là cả ba loại. Gọi trong transaction
     * đọc của phương thức public gọi nó. */
    private List<Occurrence> between(LocalDate from, LocalDate to, EventType type) {
        List<Occurrence> all = OccurrenceRules.generate(members.findAllForOccurrences(), events.findAll(), calendar,
                from, to);
        return type == null ? all : all.stream().filter(o -> o.type() == type).toList();
    }

    @Transactional(readOnly = true)
    public List<CalendarOccurrenceResponse> upcoming(Integer daysParam, String typeParam, String sortParam) {
        List<FieldError> errors = new ArrayList<>();
        int days = daysParam == null ? 30 : daysParam;
        if (!UPCOMING_DAYS.contains(days)) {
            errors.add(new FieldError("days", "Khoảng thời gian chỉ nhận 7, 15, 30, 90 hoặc 365 ngày."));
        }
        EventType type = null;
        if (typeParam != null && !typeParam.isBlank()) {
            try {
                type = EventType.valueOf(typeParam);
            } catch (IllegalArgumentException e) {
                errors.add(new FieldError("type", "Loại sự kiện không hợp lệ."));
            }
        }
        String sort = sortParam == null || sortParam.isBlank() ? "asc" : sortParam;
        if (!"asc".equals(sort) && !"desc".equals(sort)) {
            errors.add(new FieldError("sort", "Cách sắp xếp không hợp lệ."));
        }
        if (!errors.isEmpty()) {
            throw validationError(errors);
        }

        LocalDate today = today();
        List<CalendarOccurrenceResponse> dtos = new ArrayList<>();
        for (Occurrence o : between(today, today.plusDays(days), type)) {
            dtos.add(toDto(o, today));
        }
        if ("desc".equals(sort)) {
            Collections.reverse(dtos);
        }
        return dtos;
    }

    @Transactional(readOnly = true)
    public CalendarMonthResponse month(int year, int monthNo, String modeParam, boolean leapParam) {
        List<FieldError> errors = new ArrayList<>();
        String mode = modeParam == null || modeParam.isBlank() ? "solar" : modeParam;
        if (!"solar".equals(mode) && !"lunar".equals(mode)) {
            errors.add(new FieldError("mode", "Chế độ xem không hợp lệ."));
        }
        if (monthNo < 1 || monthNo > 12) {
            errors.add(new FieldError("month", "Tháng phải từ 1 đến 12."));
        }
        if (!errors.isEmpty()) {
            throw validationError(errors);
        }
        boolean leap = "lunar".equals(mode) && leapParam;

        List<LocalDate> solarDates;
        List<LunarDate> lunarDates;
        try {
            if ("solar".equals(mode)) {
                if (!calendar.isSupportedSolarYear(year)) {
                    throw new IllegalArgumentException();
                }
                int count = YearMonth.of(year, monthNo).lengthOfMonth();
                LocalDate first = LocalDate.of(year, monthNo, 1);
                solarDates = new ArrayList<>(count);
                lunarDates = new ArrayList<>(count);
                for (int i = 0; i < count; i++) {
                    LocalDate d = first.plusDays(i);
                    solarDates.add(d);
                    lunarDates.add(calendar.toLunar(d));
                }
            } else {
                if (!calendar.isSupportedLunarYear(year)) {
                    throw new IllegalArgumentException();
                }
                int count = calendar.daysInMonth(year, monthNo, leap);
                LocalDate first = calendar.firstDayOfMonth(year, monthNo, leap);
                solarDates = new ArrayList<>(count);
                lunarDates = new ArrayList<>(count);
                for (int i = 0; i < count; i++) {
                    LocalDate d = first.plusDays(i);
                    solarDates.add(d);
                    lunarDates.add(calendar.toLunar(d));
                }
            }
        } catch (RuntimeException e) {
            throw validationError(List.of(new FieldError("month", OUT_OF_RANGE_MESSAGE)));
        }

        LocalDate today = today();
        List<Occurrence> occurrences = between(solarDates.get(0), solarDates.get(solarDates.size() - 1), null);
        Map<LocalDate, List<CalendarOccurrenceResponse>> byDay = new HashMap<>();
        for (Occurrence o : occurrences) {
            byDay.computeIfAbsent(o.solar(), k -> new ArrayList<>()).add(toDto(o, today));
        }
        List<CalendarDayResponse> days = new ArrayList<>(solarDates.size());
        for (int i = 0; i < solarDates.size(); i++) {
            LocalDate d = solarDates.get(i);
            days.add(new CalendarDayResponse(toSolarResponse(d), toLunarResponse(lunarDates.get(i)),
                    byDay.getOrDefault(d, List.of())));
        }
        return new CalendarMonthResponse(mode, year, monthNo, leap, days);
    }

    @Transactional(readOnly = true)
    public List<CalendarOccurrenceResponse> recent(Integer limitParam) {
        int limit = limitParam == null ? 10 : limitParam;
        if (limit < 1 || limit > 50) {
            throw validationError(List.of(new FieldError("limit", "Số lượng phải từ 1 đến 50.")));
        }
        LocalDate today = today();
        List<CalendarOccurrenceResponse> dtos = new ArrayList<>();
        for (Occurrence o : between(today.minusDays(365), today.minusDays(1), null)) {
            dtos.add(toDto(o, today));
        }
        Collections.reverse(dtos);
        return dtos.size() > limit ? dtos.subList(0, limit) : dtos;
    }

    private LocalDate today() {
        return LocalDate.now(clock.withZone(VIETNAM));
    }

    private static BusinessException validationError(List<FieldError> errors) {
        return new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
    }

    private static CalendarOccurrenceResponse toDto(Occurrence o, LocalDate today) {
        return new CalendarOccurrenceResponse(o.eventKey(), o.type(), o.title(), o.description(), o.memberId(),
                o.eventId(), toSolarResponse(o.solar()), toLunarResponse(o.lunar()),
                (int) (o.solar().toEpochDay() - today.toEpochDay()), o.ordinal());
    }

    private static SolarDateResponse toSolarResponse(LocalDate d) {
        return new SolarDateResponse(d.getYear(), d.getMonthValue(), d.getDayOfMonth());
    }

    private static LunarDateResponse toLunarResponse(LunarDate d) {
        return new LunarDateResponse(d.year(), d.month(), d.day(), d.leap());
    }
}
