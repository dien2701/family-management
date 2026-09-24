package vn.giapha.calendar.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import vn.giapha.calendar.LunarDate;

/**
 * Lịch âm Việt Nam theo thuật toán của Hồ Ngọc Đức (công thức thiên văn rút gọn từ Meeus, "Astronomical
 * Algorithms", 1998). Lớp thuần, không phụ thuộc Spring; bản TS ở frontend phải cho cùng kết quả.
 *
 * <p>Hai điểm khác bản gốc để khớp bảng tiền tính TK20/TK21 của chính tác giả ({@code shared/fixtures/lunar}):
 * <ul>
 *   <li>Múi giờ: năm âm trước 1968 tính theo UTC+8 (lịch miền Bắc dùng tới Tết Mậu Thân 1968), từ 1968 theo UTC+7.</li>
 *   <li>{@link #NEW_MOON_FIXES}: vài ngày sóc mà công thức rút gọn lệch 1 ngày vì trăng mới sát nửa đêm.</li>
 * </ul>
 * Chỉ nhận năm dương {@value #MIN_YEAR}–{@value #MAX_YEAR} và năm âm {@value #MIN_LUNAR_YEAR}–{@value #MAX_YEAR},
 * đúng khoảng đã đối chiếu.
 */
public final class LunarCalendar {

    /** Khoảng năm dương được hỗ trợ (đã đối chiếu). */
    public static final int MIN_YEAR = 1900;
    public static final int MAX_YEAR = 2100;
    /** Năm âm 1899 kéo sang tháng 1/1900 dương nên cũng được hỗ trợ. */
    public static final int MIN_LUNAR_YEAR = MIN_YEAR - 1;
    /** Năm âm đầu tiên tính theo UTC+7. */
    static final int UTC7_FROM_LUNAR_YEAR = 1968;

    /** JDN của 1970-01-01, để đổi qua lại với {@link LocalDate#toEpochDay()}. */
    private static final long EPOCH_JDN = 2_440_588L;
    private static final double SYNODIC_MONTH = 29.530588853;
    private static final double DR = Math.PI / 180;

    private record FixKey(int timeZone, long computedJdn) {
    }

    /**
     * Ngày sóc theo bảng của Hồ Ngọc Đức khác ngày công thức rút gọn tính ra (khóa: múi giờ + ngày công thức tính).
     * Đều là tháng có trăng mới cách nửa đêm vài phút. Nguồn và cách tìm: {@code shared/fixtures/lunar/README.md}.
     */
    private static final Map<FixKey, Long> NEW_MOON_FIXES = Map.ofEntries(
            fix(8, "1906-04-24", "1906-04-23"),
            fix(8, "1914-11-18", "1914-11-17"),
            fix(8, "1916-02-04", "1916-02-03"),
            fix(8, "1920-11-11", "1920-11-10"),
            fix(8, "1925-01-24", "1925-01-25"),
            fix(7, "2054-05-08", "2054-05-07"),
            fix(7, "2072-12-10", "2072-12-09"),
            fix(7, "2077-11-16", "2077-11-15"));

    /** Một tháng âm: số tháng, cờ nhuận, JDN ngày mùng 1 và số ngày (29/30). */
    record Month(int month, boolean leap, long startJdn, int days) {
    }

    /** Các tháng của một năm âm theo thứ tự, tháng đầu là Tết. */
    record Year(int year, List<Month> months) {
    }

    /** Tối đa ~200 phần tử (một năm âm mỗi phần tử) nên không cần giới hạn. */
    private static final Map<Integer, Year> YEARS = new ConcurrentHashMap<>();

    private LunarCalendar() {
    }

    // ---------------------------------------------------------------- API

    /** Đổi dương sang âm. Năm dương phải trong khoảng hỗ trợ. */
    public static LunarDate toLunar(LocalDate solar) {
        if (solar.getYear() < MIN_YEAR || solar.getYear() > MAX_YEAR) {
            throw new IllegalArgumentException("Chỉ hỗ trợ năm dương từ " + MIN_YEAR + " đến " + MAX_YEAR);
        }
        long jdn = toJdn(solar);
        Year year = year(solar.getYear());
        if (jdn < year.months().getFirst().startJdn()) {
            year = year(solar.getYear() - 1);
        }
        List<Month> months = year.months();
        for (int i = months.size() - 1; i >= 0; i--) {
            Month m = months.get(i);
            if (jdn >= m.startJdn()) {
                return new LunarDate(year.year(), m.month(), (int) (jdn - m.startJdn()) + 1, m.leap());
            }
        }
        throw new IllegalStateException("Không tìm được tháng âm cho " + solar);
    }

    /** Đổi âm sang dương; ngày không tồn tại (tháng nhuận sai, ngày 30 của tháng thiếu...) thì ném lỗi. */
    public static LocalDate toSolar(LunarDate lunar) {
        requireDay(lunar.day());
        Month m = month(lunar.year(), lunar.month(), lunar.leap());
        if (lunar.day() > m.days()) {
            throw new IllegalArgumentException("Tháng âm " + lunar.month() + " năm " + lunar.year() + " chỉ có "
                    + m.days() + " ngày");
        }
        return toDate(m.startJdn() + lunar.day() - 1);
    }

    /** Ngày có tồn tại trong lịch âm và nằm trong khoảng hỗ trợ hay không. */
    public static boolean isValid(LunarDate lunar) {
        if (lunar.year() < MIN_LUNAR_YEAR || lunar.year() > MAX_YEAR || lunar.month() < 1 || lunar.month() > 12
                || lunar.day() < 1 || lunar.day() > 30) {
            return false;
        }
        if (lunar.leap() && leapMonth(lunar.year()) != lunar.month()) {
            return false;
        }
        return lunar.day() <= daysInMonth(lunar.year(), lunar.month(), lunar.leap());
    }

    /** Số ngày của tháng âm (29 hoặc 30). */
    public static int daysInMonth(int lunarYear, int month, boolean leap) {
        return month(lunarYear, month, leap).days();
    }

    /** Tháng nhuận của năm âm, 0 nếu năm không nhuận. */
    public static int leapMonth(int lunarYear) {
        requireYear(lunarYear);
        return year(lunarYear).months().stream().filter(Month::leap).mapToInt(Month::month).findFirst().orElse(0);
    }

    /** Ngày dương của mùng 1 tháng âm. */
    public static LocalDate firstDayOfMonth(int lunarYear, int month, boolean leap) {
        return toDate(month(lunarYear, month, leap).startJdn());
    }

    /** Ngày dương của mùng 1 Tết năm âm. */
    public static LocalDate newYear(int lunarYear) {
        requireYear(lunarYear);
        return toDate(year(lunarYear).months().getFirst().startJdn());
    }

    // ---------------------------------------------------------------- Dựng năm âm

    static int timeZone(int lunarYear) {
        return lunarYear < UTC7_FROM_LUNAR_YEAR ? 8 : 7;
    }

    private static Month month(int lunarYear, int month, boolean leap) {
        requireYear(lunarYear);
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Tháng âm phải từ 1 đến 12");
        }
        return year(lunarYear).months().stream()
                .filter(m -> m.month() == month && m.leap() == leap)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Năm âm " + lunarYear + " không có tháng " + month + " nhuận"));
    }

    static Year year(int lunarYear) {
        return YEARS.computeIfAbsent(lunarYear, LunarCalendar::buildYear);
    }

    /**
     * Năm âm Y gồm các tháng 1..10 của đoạn [tháng 11 năm Y-1, tháng 11 năm Y) và các tháng 11, 12 ở đầu đoạn kế tiếp.
     * Tháng cuối kéo tới ngay trước Tết năm Y+1 (tính theo múi giờ của năm Y+1), nên năm đổi múi giờ vẫn liền mạch.
     */
    private static Year buildYear(int lunarYear) {
        int tz = timeZone(lunarYear);
        List<MonthStart> starts = new ArrayList<>();
        for (MonthStart m : segment(lunarYear, tz)) {
            if (!m.ofPreviousYear()) {
                starts.add(m);
            }
        }
        List<MonthStart> following = segment(lunarYear + 1, tz);
        for (MonthStart m : following) {
            if (m.ofPreviousYear()) {
                starts.add(m);
            }
        }
        // Cùng múi giờ thì Tết năm sau nằm ngay trong đoạn vừa tính, khỏi tính lại
        long end = timeZone(lunarYear + 1) == tz ? firstMonthOfYear(following) : newYearJdn(lunarYear + 1);
        List<Month> months = new ArrayList<>(starts.size());
        for (int i = 0; i < starts.size(); i++) {
            MonthStart m = starts.get(i);
            long next = i + 1 < starts.size() ? starts.get(i + 1).jdn() : end;
            months.add(new Month(m.month(), m.leap(), m.jdn(), (int) (next - m.jdn())));
        }
        return new Year(lunarYear, List.copyOf(months));
    }

    /** JDN mùng 1 Tết năm âm, tính theo múi giờ của chính năm đó. */
    private static long newYearJdn(int lunarYear) {
        return firstMonthOfYear(segment(lunarYear, timeZone(lunarYear)));
    }

    private static long firstMonthOfYear(List<MonthStart> segment) {
        for (MonthStart m : segment) {
            if (!m.ofPreviousYear()) {
                return m.jdn();
            }
        }
        throw new IllegalStateException("Đoạn tháng âm không có tháng Giêng");
    }

    /** Mùng 1 của một tháng âm; {@code ofPreviousYear} = tháng 11, 12 (kể cả nhuận) thuộc năm âm trước. */
    private record MonthStart(int month, boolean leap, long jdn, boolean ofPreviousYear) {
    }

    /** Các tháng âm từ tháng 11 của năm dương {@code solarYear - 1} tới trước tháng 11 của năm dương {@code solarYear}. */
    private static List<MonthStart> segment(int solarYear, int tz) {
        long a11 = lunarMonth11(solarYear - 1, tz);
        long b11 = lunarMonth11(solarYear, tz);
        int k = (int) Math.floor((a11 - 2415021.076998695) / SYNODIC_MONTH + 0.5);
        int leapOffset = b11 - a11 > 365 ? leapMonthOffset(a11, tz) : -1;
        List<MonthStart> result = new ArrayList<>(13);
        for (int diff = 0; ; diff++) {
            long start = newMoonDay(k + diff, tz);
            if (start >= b11) {
                break;
            }
            int number = leapOffset >= 0 && diff >= leapOffset ? diff + 10 : diff + 11;
            int month = (number - 1) % 12 + 1;
            result.add(new MonthStart(month, diff == leapOffset, start, month >= 11 && diff < 4));
        }
        return result;
    }

    // ---------------------------------------------------------------- Thiên văn (Hồ Ngọc Đức)

    /** JDN của ngày bắt đầu tháng âm 11 (tháng chứa Đông chí) của năm dương. */
    private static long lunarMonth11(int solarYear, int tz) {
        long off = toJdn(LocalDate.of(solarYear, 12, 31)) - 2415021;
        int k = (int) Math.floor(off / SYNODIC_MONTH);
        long nm = newMoonDay(k, tz);
        if (sunLongitudeSector(nm, tz) >= 9) {
            nm = newMoonDay(k - 1, tz);
        }
        return nm;
    }

    /** Vị trí (tính từ tháng 11) của tháng đầu tiên không chứa trung khí, tức tháng nhuận. */
    private static int leapMonthOffset(long a11, int tz) {
        int k = (int) Math.floor((a11 - 2415021.076998695) / SYNODIC_MONTH + 0.5);
        int i = 1;
        int arc = sunLongitudeSector(newMoonDay(k + i, tz), tz);
        int last;
        do {
            last = arc;
            i++;
            arc = sunLongitudeSector(newMoonDay(k + i, tz), tz);
        } while (arc != last && i < 14);
        return i - 1;
    }

    /** JDN ngày chứa sóc thứ k (tính từ sóc 1/1/1900) theo giờ địa phương. */
    static long newMoonDay(int k, int tz) {
        long computed = (long) Math.floor(newMoon(k) + 0.5 + tz / 24.0);
        return NEW_MOON_FIXES.getOrDefault(new FixKey(tz, computed), computed);
    }

    /** Cung hoàng đạo 30° (0..11) của Mặt Trời lúc 0h giờ địa phương; 0 là sau Xuân phân. */
    private static int sunLongitudeSector(long dayNumber, int tz) {
        return (int) Math.floor(sunLongitude(dayNumber - 0.5 - tz / 24.0) / Math.PI * 6);
    }

    /** Thời điểm sóc thứ k (ngày Julius, UTC). */
    private static double newMoon(int k) {
        double t = k / 1236.85;
        double t2 = t * t;
        double t3 = t2 * t;
        double jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
        jd1 += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * DR);
        double m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
        double mpr = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
        double f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;
        double c1 = (0.1734 - 0.000393 * t) * Math.sin(m * DR) + 0.0021 * Math.sin(2 * DR * m);
        c1 = c1 - 0.4068 * Math.sin(mpr * DR) + 0.0161 * Math.sin(DR * 2 * mpr);
        c1 = c1 - 0.0004 * Math.sin(DR * 3 * mpr);
        c1 = c1 + 0.0104 * Math.sin(DR * 2 * f) - 0.0051 * Math.sin(DR * (m + mpr));
        c1 = c1 - 0.0074 * Math.sin(DR * (m - mpr)) + 0.0004 * Math.sin(DR * (2 * f + m));
        c1 = c1 - 0.0004 * Math.sin(DR * (2 * f - m)) - 0.0006 * Math.sin(DR * (2 * f + mpr));
        c1 = c1 + 0.0010 * Math.sin(DR * (2 * f - mpr)) + 0.0005 * Math.sin(DR * (2 * mpr + m));
        double deltaT = t < -11
                ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
                : -0.000278 + 0.000265 * t + 0.000262 * t2;
        return jd1 + c1 - deltaT;
    }

    /** Kinh độ Mặt Trời (radian, 0..2π) tại ngày Julius {@code jdn}. */
    private static double sunLongitude(double jdn) {
        double t = (jdn - 2451545.0) / 36525;
        double t2 = t * t;
        double m = 357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
        double l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
        double dl = (1.914600 - 0.004817 * t - 0.000014 * t2) * Math.sin(DR * m);
        dl = dl + (0.019993 - 0.000101 * t) * Math.sin(DR * 2 * m) + 0.000290 * Math.sin(DR * 3 * m);
        double l = (l0 + dl) * DR;
        return l - Math.PI * 2 * Math.floor(l / (Math.PI * 2));
    }

    // ---------------------------------------------------------------- Tiện ích

    private static void requireYear(int lunarYear) {
        if (lunarYear < MIN_LUNAR_YEAR || lunarYear > MAX_YEAR) {
            throw new IllegalArgumentException("Chỉ hỗ trợ năm âm từ " + MIN_LUNAR_YEAR + " đến " + MAX_YEAR);
        }
    }

    private static void requireDay(int day) {
        if (day < 1 || day > 30) {
            throw new IllegalArgumentException("Ngày âm phải từ 1 đến 30");
        }
    }

    static long toJdn(LocalDate date) {
        return date.toEpochDay() + EPOCH_JDN;
    }

    static LocalDate toDate(long jdn) {
        return LocalDate.ofEpochDay(jdn - EPOCH_JDN);
    }

    private static Map.Entry<FixKey, Long> fix(int tz, String computed, String official) {
        return Map.entry(new FixKey(tz, toJdn(LocalDate.parse(computed))), toJdn(LocalDate.parse(official)));
    }
}
