package vn.giapha.calendar.controller;

import java.time.LocalDate;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.calendar.dto.ConvertResponse;
import vn.giapha.calendar.dto.LunarMonthInfoResponse;
import vn.giapha.calendar.service.CalendarService;

/** Đổi lịch âm–dương. Không đọc dữ liệu family nên chỉ cần đăng nhập. */
@RestController
@RequestMapping("/api/calendar")
class CalendarController {

    private final CalendarService service;

    CalendarController(CalendarService service) {
        this.service = service;
    }

    @Operation(summary = "Đổi ngày dương sang âm (truyền solar) hoặc âm sang dương (truyền lunarYear, lunarMonth, lunarDay, leap)")
    @GetMapping("/convert")
    ConvertResponse convert(
            @Parameter(description = "Ngày dương, dạng yyyy-MM-dd", example = "2026-02-17")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate solar,
            @RequestParam(required = false) Integer lunarYear,
            @RequestParam(required = false) Integer lunarMonth,
            @RequestParam(required = false) Integer lunarDay,
            @Parameter(description = "Ngày thuộc tháng nhuận") @RequestParam(required = false) Boolean leap) {
        return service.convert(solar, lunarYear, lunarMonth, lunarDay, leap);
    }

    @Operation(summary = "Số ngày (29/30), ngày dương đầu và cuối của một tháng âm, kèm tháng nhuận của năm")
    @GetMapping("/lunar-month-info")
    LunarMonthInfoResponse lunarMonthInfo(@RequestParam int year, @RequestParam int month,
            @RequestParam(defaultValue = "false") boolean leap) {
        return service.monthInfo(year, month, leap);
    }
}
