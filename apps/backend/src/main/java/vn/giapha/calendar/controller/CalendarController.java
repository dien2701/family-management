package vn.giapha.calendar.controller;

import java.time.LocalDate;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.calendar.dto.ConvertResponse;
import vn.giapha.calendar.dto.LunarMonthInfoResponse;
import vn.giapha.calendar.service.CalendarService;
import vn.giapha.common.web.ApiRefs;

/** Đổi lịch âm–dương. Không đọc dữ liệu gia phả nên chỉ cần đăng nhập. */
@RestController
@RequestMapping("/api/calendar")
@Tag(name = "calendar")
class CalendarController {

    private final CalendarService service;

    CalendarController(CalendarService service) {
        this.service = service;
    }

    @Operation(operationId = "convert", summary = "Đổi ngày dương và âm", description = "Đổi ngày dương sang âm (truyền solar) hoặc âm sang dương (truyền lunarYear, lunarMonth, lunarDay, leap)")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
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

    @Operation(operationId = "lunarMonthInfo", summary = "Thông tin một tháng âm", description = "Số ngày (29/30), ngày dương đầu và cuối của một tháng âm, kèm tháng nhuận của năm")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/lunar-month-info")
    LunarMonthInfoResponse lunarMonthInfo(@RequestParam int year, @RequestParam int month,
            @RequestParam(defaultValue = "false") boolean leap) {
        return service.monthInfo(year, month, leap);
    }
}
