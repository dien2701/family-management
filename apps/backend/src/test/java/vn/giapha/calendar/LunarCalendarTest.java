package vn.giapha.calendar;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import vn.giapha.calendar.service.LunarCalendar;

/** Đối chiếu {@link LunarCalendar} với bảng của Hồ Ngọc Đức cho toàn bộ năm âm 1899–2100 (mọi ngày dương 1900–2100). */
class LunarCalendarTest {

    private static List<LunarFixtures.Year> years;

    @BeforeAll
    static void load() {
        years = LunarFixtures.years();
        assertThat(years).hasSize(202);
        assertThat(years.getFirst().year()).isEqualTo(LunarCalendar.MIN_LUNAR_YEAR);
        assertThat(years.getLast().year()).isEqualTo(LunarCalendar.MAX_YEAR);
    }

    // ---------- Toàn bộ fixture ----------

    @Test
    void newYearAndLeapMonthMatchFixtureForEveryYear() {
        List<String> mismatches = new ArrayList<>();
        for (LunarFixtures.Year y : years) {
            if (!LunarCalendar.newYear(y.year()).equals(y.tet())) {
                mismatches.add(y.year() + " Tết " + LunarCalendar.newYear(y.year()) + " ≠ " + y.tet());
            }
            if (LunarCalendar.leapMonth(y.year()) != y.leapMonth()) {
                mismatches.add(y.year() + " nhuận " + LunarCalendar.leapMonth(y.year()) + " ≠ " + y.leapMonth());
            }
        }
        assertThat(mismatches).isEmpty();
    }

    @Test
    void everyMonthStartAndLengthMatchFixture() {
        List<String> mismatches = new ArrayList<>();
        for (LunarFixtures.Year y : years) {
            for (LunarFixtures.Month m : y.months()) {
                LocalDate start = LunarCalendar.firstDayOfMonth(y.year(), m.month(), m.leap());
                int days = LunarCalendar.daysInMonth(y.year(), m.month(), m.leap());
                if (!start.equals(m.start()) || days != m.days()) {
                    mismatches.add(y.year() + "/" + m.month() + (m.leap() ? "N" : "") + ": " + start + " (" + days
                            + ") ≠ " + m.start() + " (" + m.days() + ")");
                }
            }
        }
        assertThat(mismatches).isEmpty();
    }

    @Test
    void everySolarDayConvertsBothWaysLikeFixture() {
        List<String> mismatches = new ArrayList<>();
        int checked = 0;
        for (LunarFixtures.Year y : years) {
            for (LunarFixtures.Month m : y.months()) {
                for (int d = 1; d <= m.days(); d++) {
                    LocalDate solar = m.start().plusDays(d - 1L);
                    if (solar.getYear() < LunarCalendar.MIN_YEAR || solar.getYear() > LunarCalendar.MAX_YEAR) {
                        continue;
                    }
                    LunarDate expected = new LunarDate(y.year(), m.month(), d, m.leap());
                    LunarDate lunar = LunarCalendar.toLunar(solar);
                    if (!lunar.equals(expected)) {
                        mismatches.add(solar + " → " + lunar + " ≠ " + expected);
                    }
                    if (!LunarCalendar.toSolar(expected).equals(solar)) {
                        mismatches.add(expected + " → " + LunarCalendar.toSolar(expected) + " ≠ " + solar);
                    }
                    checked++;
                }
            }
        }
        assertThat(mismatches).isEmpty();
        // Phủ kín mọi ngày từ 01/01/1900 tới 31/12/2100
        assertThat(checked).isEqualTo(LocalDate.of(2101, 1, 1).toEpochDay() - LocalDate.of(1900, 1, 1).toEpochDay());
    }

    @Test
    void publishedSamplesMatch() {
        for (LunarFixtures.Sample s : LunarFixtures.samples()) {
            assertThat(LunarCalendar.toLunar(s.solar())).as(s.note()).isEqualTo(s.lunar());
            assertThat(LunarCalendar.toSolar(s.lunar())).as(s.note()).isEqualTo(s.solar());
        }
    }

    // ---------- Mốc bắt buộc của đợt ----------

    @Test
    void tet1985IsVietnameseDate() {
        assertThat(LunarCalendar.newYear(1985)).isEqualTo(LocalDate.of(1985, 1, 21));
        assertThat(LunarCalendar.toLunar(LocalDate.of(1985, 1, 21))).isEqualTo(new LunarDate(1985, 1, 1, false));
    }

    @ParameterizedTest
    @CsvSource({"2026-02-17, 2026", "2025-01-29, 2025", "1968-01-29, 1968"})
    void knownNewYears(LocalDate solar, int year) {
        assertThat(LunarCalendar.toLunar(solar)).isEqualTo(new LunarDate(year, 1, 1, false));
    }

    @ParameterizedTest
    @CsvSource({"2020, 4", "2023, 2", "2025, 6"})
    void leapMonths(int year, int leapMonth) {
        assertThat(LunarCalendar.leapMonth(year)).isEqualTo(leapMonth);
    }

    @Test
    void yearWithoutLeapMonthReturnsZero() {
        assertThat(LunarCalendar.leapMonth(2024)).isZero();
        assertThat(LunarCalendar.leapMonth(2026)).isZero();
    }

    @Test
    void leapSixthMonth2025RoundTrips() {
        LunarDate leap = new LunarDate(2025, 6, 15, true);
        LocalDate solar = LunarCalendar.toSolar(leap);
        assertThat(solar).isEqualTo(LocalDate.of(2025, 8, 8));
        assertThat(LunarCalendar.toLunar(solar)).isEqualTo(leap);
        // Cùng ngày 15/6 tháng thường cách đúng một tháng
        assertThat(LunarCalendar.toSolar(new LunarDate(2025, 6, 15, false))).isEqualTo(LocalDate.of(2025, 7, 9));
    }

    /** Năm đổi múi giờ: lịch UTC+8 có Tết 30/01/1968, lịch Việt Nam (UTC+7) là 29/01 nên tháng Chạp 1967 chỉ 29 ngày. */
    @Test
    void timezoneSwitchIn1968IsSeamless() {
        assertThat(LunarCalendar.toLunar(LocalDate.of(1968, 1, 28))).isEqualTo(new LunarDate(1967, 12, 29, false));
        assertThat(LunarCalendar.daysInMonth(1967, 12, false)).isEqualTo(29);
    }

    /** Công thức rút gọn gốc trả "ngày 0" ở tháng này; có hiệu chỉnh thì ra mùng 1 tháng 4. */
    @Test
    void correctedNewMoonNeverGivesDayZero() {
        assertThat(LunarCalendar.toLunar(LocalDate.of(2054, 5, 7))).isEqualTo(new LunarDate(2054, 4, 1, false));
    }

    // ---------- Đầu vào sai ----------

    @Test
    void rejectsLeapFlagForMonthThatIsNotLeap() {
        assertThat(LunarCalendar.isValid(new LunarDate(2025, 5, 1, true))).isFalse();
        assertThatThrownBy(() -> LunarCalendar.toSolar(new LunarDate(2025, 5, 1, true)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsDay30InShortMonth() {
        assertThat(LunarCalendar.daysInMonth(2025, 12, false)).isEqualTo(29);
        assertThat(LunarCalendar.isValid(new LunarDate(2025, 12, 30, false))).isFalse();
        assertThatThrownBy(() -> LunarCalendar.toSolar(new LunarDate(2025, 12, 30, false)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(LunarCalendar.isValid(new LunarDate(2025, 11, 30, false))).isTrue();
    }

    @Test
    void rejectsYearsOutsideVerifiedRange() {
        assertThatThrownBy(() -> LunarCalendar.toLunar(LocalDate.of(1899, 12, 31)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> LunarCalendar.toLunar(LocalDate.of(2101, 1, 1)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> LunarCalendar.leapMonth(1898)).isInstanceOf(IllegalArgumentException.class);
        assertThat(LunarCalendar.isValid(new LunarDate(2101, 1, 1, false))).isFalse();
        assertThat(LunarCalendar.toLunar(LocalDate.of(1900, 1, 1)).year()).isEqualTo(1899);
    }
}
