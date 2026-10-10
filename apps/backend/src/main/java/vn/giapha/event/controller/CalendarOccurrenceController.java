package vn.giapha.event.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.web.ApiRefs;
import vn.giapha.event.dto.CalendarMonthResponse;
import vn.giapha.event.dto.CalendarOccurrenceResponse;
import vn.giapha.event.service.OccurrenceService;

/**
 * Giỗ, sinh nhật và sự kiện chung theo lịch (IDEA §6.5, §7). Xem được không cần đăng nhập (DECISIONS #88).
 */
@RestController
@RequestMapping("/api/calendar")
@Tag(name = "calendar")
class CalendarOccurrenceController {

    private final OccurrenceService service;

    CalendarOccurrenceController(OccurrenceService service) {
        this.service = service;
    }

    @Operation(operationId = "upcomingOccurrences", summary = "Các sự kiện sắp diễn ra",
            description = "Giỗ, sinh nhật và sự kiện chung có ngày dương từ hôm nay (giờ +7, daysUntil = 0) đến hôm "
                    + "nay + days ngày. Xếp theo ngày dương, cùng ngày thì Giỗ, Sinh nhật, Sự kiện chung rồi theo tên.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @GetMapping("/upcoming")
    List<CalendarOccurrenceResponse> upcoming(
            @RequestParam(required = false) Integer days,
            @Parameter(description = "Chỉ lấy một loại; bỏ trống là cả ba loại")
            @RequestParam(required = false) String type,
            @Parameter(description = "asc gần nhất trước (mặc định), desc xa nhất trước")
            @RequestParam(required = false) String sort) {
        return service.upcoming(days, type, sort);
    }

    @Operation(operationId = "calendarMonth", summary = "Lịch một tháng",
            description = "mode = solar: year/month là tháng dương. mode = lunar: là tháng âm (leap = true cho "
                    + "tháng nhuận), các ngày đi từ mùng 1 đến hết tháng âm đó, mỗi ngày kèm ngày dương.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @GetMapping("/month")
    CalendarMonthResponse month(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) String mode,
            @Parameter(description = "Chỉ có nghĩa khi mode = lunar")
            @RequestParam(defaultValue = "false") boolean leap) {
        return service.month(year, month, mode, leap);
    }

    @Operation(operationId = "recentOccurrences", summary = "Các sự kiện vừa diễn ra",
            description = "Các sự kiện có ngày dương trước hôm nay (trong vòng một năm), gần nhất trước "
                    + "(daysUntil âm). Dùng cho dashboard.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @GetMapping("/recent")
    List<CalendarOccurrenceResponse> recent(@RequestParam(required = false) Integer limit) {
        return service.recent(limit);
    }
}
