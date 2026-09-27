package vn.giapha.calendar;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.support.IntegrationTest;

/**
 * API đổi lịch và {@link CalendarFacade} trên Spring context thật. Module calendar không đọc dữ liệu gia phả
 * nên chỉ cần đăng nhập.
 */
@IntegrationTest
@AutoConfigureMockMvc
class CalendarApiTest {

    @Autowired MockMvc mvc;
    @Autowired CalendarFacade facade;

    // ---------- /convert dương → âm ----------

    @Test
    void convertsSolarNewYears() throws Exception {
        expectLunar("2026-02-17", 2026, 1, 1, false);
        expectLunar("2025-01-29", 2025, 1, 1, false);
        expectLunar("1985-01-21", 1985, 1, 1, false);
    }

    @Test
    void convertsSolarDayInLeapMonth() throws Exception {
        expectLunar("2025-08-08", 2025, 6, 15, true);
    }

    // ---------- /convert âm → dương ----------

    @Test
    void convertsLeapLunarDateBackToSameSolarDay() throws Exception {
        call(get("/api/calendar/convert").param("lunarYear", "2025").param("lunarMonth", "6")
                .param("lunarDay", "15").param("leap", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.solar").value("2025-08-08"))
                .andExpect(jsonPath("$.lunar.leap").value(true));
        call(get("/api/calendar/convert").param("lunarYear", "2025").param("lunarMonth", "6")
                .param("lunarDay", "15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.solar").value("2025-07-09"))
                .andExpect(jsonPath("$.lunar.leap").value(false));
    }

    @Test
    void rejectsLeapFlagForNonLeapMonth() throws Exception {
        call(get("/api/calendar/convert").param("lunarYear", "2025").param("lunarMonth", "5")
                .param("lunarDay", "1").param("leap", "true"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("LUNAR_DATE_INVALID"))
                .andExpect(jsonPath("$.errors[0].field").value("leap"))
                .andExpect(jsonPath("$.detail").value("Năm 2025 âm lịch không có tháng 5 nhuận (năm này nhuận tháng 6)."));
    }

    @Test
    void rejectsDay30OfShortMonth() throws Exception {
        call(get("/api/calendar/convert").param("lunarYear", "2025").param("lunarMonth", "12")
                .param("lunarDay", "30"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("LUNAR_DATE_INVALID"))
                .andExpect(jsonPath("$.errors[0].field").value("lunarDay"));
    }

    @Test
    void rejectsAmbiguousOrIncompleteQuery() throws Exception {
        call(get("/api/calendar/convert"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CALENDAR_QUERY_INVALID"));
        call(get("/api/calendar/convert").param("solar", "2025-01-29").param("lunarYear", "2025"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CALENDAR_QUERY_INVALID"));
        call(get("/api/calendar/convert").param("lunarYear", "2025").param("lunarMonth", "1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CALENDAR_QUERY_INVALID"));
    }

    @Test
    void rejectsYearsOutsideRangeAndMalformedDate() throws Exception {
        call(get("/api/calendar/convert").param("solar", "1899-12-31"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CALENDAR_OUT_OF_RANGE"));
        call(get("/api/calendar/convert").param("lunarYear", "2101").param("lunarMonth", "1").param("lunarDay", "1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CALENDAR_OUT_OF_RANGE"));
        call(get("/api/calendar/convert").param("solar", "17/02/2026"))
                .andExpect(status().isBadRequest());
    }

    // ---------- /lunar-month-info ----------

    @Test
    void returnsLeapMonthInfo() throws Exception {
        call(get("/api/calendar/lunar-month-info").param("year", "2025").param("month", "6").param("leap", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days").value(29))
                .andExpect(jsonPath("$.firstDay").value("2025-07-25"))
                .andExpect(jsonPath("$.lastDay").value("2025-08-22"))
                .andExpect(jsonPath("$.yearLeapMonth").value(6));
    }

    @Test
    void returnsMonthInfoForYearWithoutLeap() throws Exception {
        call(get("/api/calendar/lunar-month-info").param("year", "2026").param("month", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstDay").value("2026-02-17"))
                .andExpect(jsonPath("$.leap").value(false))
                .andExpect(jsonPath("$.yearLeapMonth").isEmpty());
    }

    @Test
    void rejectsInvalidMonthInfo() throws Exception {
        call(get("/api/calendar/lunar-month-info").param("year", "2026").param("month", "3").param("leap", "true"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("LUNAR_DATE_INVALID"));
        call(get("/api/calendar/lunar-month-info").param("year", "2026").param("month", "13"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("LUNAR_DATE_INVALID"));
    }

    // ---------- Bảo mật ----------

    @Test
    void requiresAuthentication() throws Exception {
        mvc.perform(get("/api/calendar/convert").param("solar", "2026-02-17"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/calendar/lunar-month-info").param("year", "2026").param("month", "1"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- Facade cho module khác ----------

    @Test
    void facadeConvertsAndAppliesAnniversaryRules() {
        assertThat(facade.toLunar(LocalDate.of(2026, 2, 17))).isEqualTo(new LunarDate(2026, 1, 1, false));
        assertThat(facade.toSolar(new LunarDate(2025, 6, 15, true))).isEqualTo(LocalDate.of(2025, 8, 8));
        assertThat(facade.leapMonth(2023)).isEqualTo(2);
        assertThat(facade.isValid(new LunarDate(2025, 12, 30, false))).isFalse();
        assertThat(facade.lunarOccurrenceSolar(2026, new LunarMonthDay(6, 15, true), null))
                .isEqualTo(LocalDate.of(2026, 7, 28));
        assertThat(facade.lunarOccurrence(2024, LunarMonthDay.of(6, 30), null))
                .isEqualTo(new LunarDate(2024, 6, 29, false));
        assertThat(facade.solarOccurrence(2025, 2, 29)).isEqualTo(LocalDate.of(2025, 2, 28));
        assertThat(facade.isSupportedSolarYear(1899)).isFalse();
        assertThat(facade.isSupportedLunarYear(1899)).isTrue();
    }

    @Test
    void facadeThrowsBusinessExceptionForBadInput() {
        assertThatThrownBy(() -> facade.toSolar(new LunarDate(2025, 12, 30, false)))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> facade.toLunar(LocalDate.of(2101, 1, 1)))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> facade.lunarOccurrence(2026, LunarMonthDay.of(0, 1), null))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> facade.lunarOccurrence(2026, null, null))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> facade.leapMonth(3000))
                .isInstanceOf(BusinessException.class);
    }

    private void expectLunar(String solar, int year, int month, int day, boolean leap) throws Exception {
        call(get("/api/calendar/convert").param("solar", solar))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.solar").value(solar))
                .andExpect(jsonPath("$.lunar.year").value(year))
                .andExpect(jsonPath("$.lunar.month").value(month))
                .andExpect(jsonPath("$.lunar.day").value(day))
                .andExpect(jsonPath("$.lunar.leap").value(leap));
    }

    private ResultActions call(MockHttpServletRequestBuilder request) throws Exception {
        // Request đọc chỉ tin claim approval; người gọi phải là tài khoản đã duyệt (DECISIONS #56)
        return mvc.perform(request.with(jwt().jwt(j -> j.subject("1").claim("approval", "APPROVED"))));
    }
}
