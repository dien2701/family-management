package vn.giapha.calendar;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

import vn.giapha.calendar.service.AnniversaryRules;
import vn.giapha.calendar.service.LunarCalendar;

/**
 * Các nhánh của {@link AnniversaryRules}. Dữ liệu năm lấy từ bảng đối chiếu: 2024 tháng 6 thiếu (29 ngày),
 * 2026 tháng 6 đủ (30 ngày) và tháng 8 thiếu, 2025 nhuận tháng 6.
 */
class AnniversaryRulesTest {

    @Test
    void plainDateIsKept() {
        assertThat(AnniversaryRules.lunarOccurrence(2026, LunarMonthDay.of(3, 10), null))
                .isEqualTo(new LunarDate(2026, 3, 10, false));
    }

    // ---------- Ưu tiên 1: ngày ghi đè ----------

    @Test
    void overrideWinsOverOriginal() {
        assertThat(AnniversaryRules.lunarOccurrence(2026, LunarMonthDay.of(3, 10), LunarMonthDay.of(3, 9)))
                .isEqualTo(new LunarDate(2026, 3, 9, false));
    }

    @Test
    void overrideWinsEvenWhenOriginalIsLeap() {
        LunarMonthDay leapDeath = new LunarMonthDay(6, 15, true);
        assertThat(AnniversaryRules.lunarOccurrence(2025, leapDeath, LunarMonthDay.of(6, 14)))
                .isEqualTo(new LunarDate(2025, 6, 14, false));
    }

    @Test
    void overrideOnDay30FallsBackTo29InShortMonth() {
        assertThat(LunarCalendar.daysInMonth(2026, 8, false)).isEqualTo(29);
        assertThat(AnniversaryRules.lunarOccurrence(2026, LunarMonthDay.of(8, 1), LunarMonthDay.of(8, 30)))
                .isEqualTo(new LunarDate(2026, 8, 29, false));
    }

    // ---------- Ưu tiên 2: tháng nhuận cúng tháng thường ----------

    @Test
    void leapMonthDateUsesRegularMonth() {
        assertThat(AnniversaryRules.lunarOccurrence(2026, new LunarMonthDay(6, 15, true), null))
                .isEqualTo(new LunarDate(2026, 6, 15, false));
        assertThat(AnniversaryRules.lunarOccurrenceSolar(2026, new LunarMonthDay(6, 15, true), null))
                .isEqualTo(LocalDate.of(2026, 7, 28));
    }

    @Test
    void leapMonthDateUsesRegularMonthEvenWhenYearHasSameLeapMonth() {
        assertThat(LunarCalendar.leapMonth(2025)).isEqualTo(6);
        assertThat(AnniversaryRules.lunarOccurrenceSolar(2025, new LunarMonthDay(6, 15, true), null))
                .isEqualTo(LocalDate.of(2025, 7, 9));
    }

    // ---------- Ưu tiên 3: ngày 30 cúng 29 ----------

    @Test
    void day30FallsBackTo29WhenMonthIsShort() {
        assertThat(LunarCalendar.daysInMonth(2024, 6, false)).isEqualTo(29);
        assertThat(AnniversaryRules.lunarOccurrence(2024, LunarMonthDay.of(6, 30), null))
                .isEqualTo(new LunarDate(2024, 6, 29, false));
        assertThat(AnniversaryRules.lunarOccurrenceSolar(2024, LunarMonthDay.of(6, 30), null))
                .isEqualTo(LocalDate.of(2024, 8, 3));
    }

    @Test
    void day30IsKeptWhenMonthIsFull() {
        assertThat(LunarCalendar.daysInMonth(2026, 6, false)).isEqualTo(30);
        assertThat(AnniversaryRules.lunarOccurrenceSolar(2026, LunarMonthDay.of(6, 30), null))
                .isEqualTo(LocalDate.of(2026, 8, 12));
    }

    @Test
    void leapAndDay30RulesCombine() {
        assertThat(AnniversaryRules.lunarOccurrence(2024, new LunarMonthDay(6, 30, true), null))
                .isEqualTo(new LunarDate(2024, 6, 29, false));
    }

    @Test
    void rejectsImpossibleMonthDay() {
        assertThatThrownBy(() -> AnniversaryRules.lunarOccurrence(2026, LunarMonthDay.of(13, 1), null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> AnniversaryRules.lunarOccurrence(2026, LunarMonthDay.of(1, 31), null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ---------- Sinh nhật dương ----------

    @Test
    void solarFeb29MovesToFeb28InCommonYear() {
        assertThat(AnniversaryRules.solarOccurrence(2025, 2, 29)).isEqualTo(LocalDate.of(2025, 2, 28));
        assertThat(AnniversaryRules.solarOccurrence(2100, 2, 29)).isEqualTo(LocalDate.of(2100, 2, 28));
    }

    @Test
    void solarFeb29IsKeptInLeapYear() {
        assertThat(AnniversaryRules.solarOccurrence(2024, 2, 29)).isEqualTo(LocalDate.of(2024, 2, 29));
        assertThat(AnniversaryRules.solarOccurrence(2000, 2, 29)).isEqualTo(LocalDate.of(2000, 2, 29));
    }

    @Test
    void ordinarySolarDateIsKept() {
        assertThat(AnniversaryRules.solarOccurrence(2025, 5, 15)).isEqualTo(LocalDate.of(2025, 5, 15));
    }
}
