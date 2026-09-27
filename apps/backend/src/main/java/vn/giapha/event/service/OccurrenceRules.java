package vn.giapha.event.service;

import java.text.Collator;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Supplier;

import vn.giapha.calendar.CalendarFacade;
import vn.giapha.calendar.LunarDate;
import vn.giapha.calendar.LunarMonthDay;
import vn.giapha.event.dto.EventType;
import vn.giapha.event.entity.CustomEvent;
import vn.giapha.event.entity.EventCalendar;
import vn.giapha.member.MemberFacade.OccurrenceMember;

/**
 * Sinh các lần xảy ra của giỗ, sinh nhật và sự kiện chung trong một khoảng ngày dương (IDEA §6.5, §7). Lớp thuần:
 * không đụng DB. Bản TS ở {@code utils/occurrences/generate.ts} phải cho cùng kết quả.
 */
final class OccurrenceRules {

    /** Phải khớp {@code vn.giapha.calendar.service.LunarCalendar.MIN_YEAR}/{@code MAX_YEAR} (1900–2100). */
    private static final int MIN_YEAR = 1900;
    private static final int MAX_YEAR = 2100;

    private static final Map<EventType, Integer> TYPE_ORDER = Map.of(EventType.MEMORIAL, 0, EventType.BIRTHDAY, 1,
            EventType.CUSTOM, 2);
    private static final Collator VIETNAMESE = Collator.getInstance(Locale.forLanguageTag("vi"));

    private OccurrenceRules() {
    }

    private record Range(long fromEpochDay, long toEpochDay) {
        boolean contains(LocalDate d) {
            long e = d.toEpochDay();
            return e >= fromEpochDay && e <= toEpochDay;
        }
    }

    private record Years(List<Integer> solar, List<Integer> lunar) {
    }

    private record Hit(LocalDate solar, LunarDate lunar) {
    }

    /** Chạy {@code fn}; ngày ngoài khoảng lịch hỗ trợ hoặc không tồn tại thì bỏ qua thay vì làm hỏng cả danh sách. */
    private static <T> T safe(Supplier<T> fn) {
        try {
            return fn.get();
        } catch (RuntimeException e) {
            return null;
        }
    }

    private static LocalDate clamp(LocalDate d) {
        if (d.getYear() < MIN_YEAR) {
            return LocalDate.of(MIN_YEAR, 1, 1);
        }
        if (d.getYear() > MAX_YEAR) {
            return LocalDate.of(MAX_YEAR, 12, 31);
        }
        return d;
    }

    private static List<Integer> span(int from, int to) {
        List<Integer> out = new ArrayList<>(Math.max(0, to - from + 1));
        for (int y = from; y <= to; y++) {
            out.add(y);
        }
        return out;
    }

    private static String eventKey(EventType type, Long id, LocalDate solar) {
        return type.name() + ":" + id + ":" + solar;
    }

    // ---------------------------------------------------------------- Ngày lặp hằng năm

    /** Lần xảy ra trong năm dương {@code year} (lịch dương) hoặc năm âm {@code year} (lịch âm). */
    private static Hit yearly(CalendarFacade calendar, boolean lunar, int month, int day, boolean leap, int year) {
        if (!lunar) {
            LocalDate solar = safe(() -> calendar.solarOccurrence(year, month, day));
            if (solar == null) {
                return null;
            }
            LunarDate l = safe(() -> calendar.toLunar(solar));
            return l == null ? null : new Hit(solar, l);
        }
        LunarDate l = safe(() -> calendar.lunarOccurrence(year, new LunarMonthDay(month, day, leap), null));
        if (l == null) {
            return null;
        }
        LocalDate solar = safe(() -> calendar.toSolar(l));
        return solar == null ? null : new Hit(solar, l);
    }

    // ---------------------------------------------------------------- Giỗ

    private static List<Occurrence> memorials(OccurrenceMember m, CalendarFacade calendar, Years years,
            Range range) {
        if (!m.deceased()) {
            return List.of();
        }
        LunarMonthDay monthDay;
        Integer baseYear;
        if (m.deathLunarMonth() != null && m.deathLunarDay() != null) {
            monthDay = new LunarMonthDay(m.deathLunarMonth(), m.deathLunarDay(), m.deathLunarLeap());
            baseYear = m.deathLunarYear();
        } else if (m.deathSolarYear() != null && m.deathSolarMonth() != null && m.deathSolarDay() != null) {
            LocalDate deathSolar = LocalDate.of(m.deathSolarYear(), m.deathSolarMonth(), m.deathSolarDay());
            LunarDate l = safe(() -> calendar.toLunar(deathSolar));
            if (l == null) {
                return List.of();
            }
            monthDay = new LunarMonthDay(l.month(), l.day(), l.leap());
            baseYear = l.year();
        } else if (m.memorialOverrideDay() != null && m.memorialOverrideMonth() != null) {
            monthDay = new LunarMonthDay(m.memorialOverrideMonth(), m.memorialOverrideDay(), false);
            baseYear = null;
        } else {
            return List.of();
        }
        // Ngày ghi đè luôn là tháng thường
        LunarMonthDay override = m.memorialOverrideDay() != null && m.memorialOverrideMonth() != null
                ? new LunarMonthDay(m.memorialOverrideMonth(), m.memorialOverrideDay(), false)
                : null;

        List<Occurrence> out = new ArrayList<>();
        for (int year : years.lunar()) {
            // Năm mất hoặc trước đó chưa có giỗ; giỗ đầu là năm sau
            if (baseYear != null && year <= baseYear) {
                continue;
            }
            LunarDate lunar = safe(() -> calendar.lunarOccurrence(year, monthDay, override));
            LocalDate solar = lunar == null ? null : safe(() -> calendar.toSolar(lunar));
            if (lunar == null || solar == null || !range.contains(solar)) {
                continue;
            }
            out.add(new Occurrence(eventKey(EventType.MEMORIAL, m.id(), solar), EventType.MEMORIAL,
                    "Giỗ " + m.fullName(), null, m.id(), null, solar, lunar,
                    baseYear == null ? null : year - baseYear));
        }
        return out;
    }

    // ---------------------------------------------------------------- Sinh nhật

    private static List<Occurrence> birthdays(OccurrenceMember m, CalendarFacade calendar, Years years,
            Range range) {
        if (m.deceased() || m.birthMonth() == null || m.birthDay() == null) {
            return List.of();
        }
        boolean lunar = m.birthLunar();
        boolean leap = lunar && m.birthLeap();
        List<Occurrence> out = new ArrayList<>();
        for (int year : lunar ? years.lunar() : years.solar()) {
            // Năm sinh hoặc trước đó chưa có sinh nhật
            if (m.birthYear() != null && year <= m.birthYear()) {
                continue;
            }
            Hit hit = yearly(calendar, lunar, m.birthMonth(), m.birthDay(), leap, year);
            if (hit == null || !range.contains(hit.solar())) {
                continue;
            }
            out.add(new Occurrence(eventKey(EventType.BIRTHDAY, m.id(), hit.solar()), EventType.BIRTHDAY,
                    "Sinh nhật " + m.fullName(), null, m.id(), null, hit.solar(), hit.lunar(),
                    m.birthYear() == null ? null : year - m.birthYear()));
        }
        return out;
    }

    // ---------------------------------------------------------------- Sự kiện chung

    private static List<Occurrence> customs(CustomEvent e, CalendarFacade calendar, Years years, Range range) {
        boolean lunar = e.getCalendar() == EventCalendar.LUNAR;
        List<Hit> hits = new ArrayList<>();
        if (e.getYear() == null) {
            for (int year : lunar ? years.lunar() : years.solar()) {
                Hit hit = yearly(calendar, lunar, e.getMonth(), e.getDay(), e.isLeap(), year);
                if (hit != null) {
                    hits.add(hit);
                }
            }
        } else if (!lunar) {
            int year = e.getYear();
            int month = e.getMonth();
            int day = e.getDay();
            LocalDate solar = safe(() -> LocalDate.of(year, month, day));
            if (solar != null) {
                LunarDate l = safe(() -> calendar.toLunar(solar));
                if (l != null) {
                    hits.add(new Hit(solar, l));
                }
            }
        } else {
            // Một lần: ngày âm đúng như nhập, kể cả tháng nhuận
            LunarDate lunarDate = new LunarDate(e.getYear(), e.getMonth(), e.getDay(), e.isLeap());
            LocalDate solar = safe(() -> calendar.toSolar(lunarDate));
            if (solar != null) {
                hits.add(new Hit(solar, lunarDate));
            }
        }
        List<Occurrence> out = new ArrayList<>();
        for (Hit hit : hits) {
            if (!range.contains(hit.solar())) {
                continue;
            }
            out.add(new Occurrence(eventKey(EventType.CUSTOM, e.getId(), hit.solar()), EventType.CUSTOM,
                    e.getTitle(), e.getDescription(), null, e.getId(), hit.solar(), hit.lunar(), null));
        }
        return out;
    }

    // ---------------------------------------------------------------- Điểm vào

    /**
     * Mọi lần xảy ra có ngày dương trong {@code [from, to]} (gồm cả hai đầu), xếp theo ngày, rồi Giỗ, Sinh nhật,
     * Sự kiện chung, rồi theo tên.
     */
    static List<Occurrence> generate(List<OccurrenceMember> members, List<CustomEvent> events,
            CalendarFacade calendar, LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            return List.of();
        }
        Range range = new Range(from.toEpochDay(), to.toEpochDay());
        LocalDate lo = clamp(from);
        LocalDate hi = clamp(to);
        // Một năm âm trải từ Tết đến Tết sau, nên phủ hết các năm âm chạm vào khoảng này
        Integer lunarFromYear = safe(() -> calendar.toLunar(lo).year());
        Integer lunarToYear = safe(() -> calendar.toLunar(hi).year());
        Years years = new Years(span(from.getYear(), to.getYear()),
                span(lunarFromYear == null ? lo.getYear() : lunarFromYear,
                        lunarToYear == null ? hi.getYear() : lunarToYear));

        List<Occurrence> out = new ArrayList<>();
        for (OccurrenceMember m : members) {
            out.addAll(memorials(m, calendar, years, range));
            out.addAll(birthdays(m, calendar, years, range));
        }
        for (CustomEvent e : events) {
            out.addAll(customs(e, calendar, years, range));
        }
        out.sort(Comparator.<Occurrence, LocalDate>comparing(Occurrence::solar)
                .thenComparingInt(o -> TYPE_ORDER.get(o.type()))
                .thenComparing(Occurrence::title, VIETNAMESE)
                .thenComparing(Occurrence::eventKey));
        return out;
    }
}
