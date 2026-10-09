package vn.giapha.report.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;
import vn.giapha.report.service.ReportFile;
import vn.giapha.report.service.ReportService;

/**
 * Xuất Excel và PDF (IDEA §6.9). Mọi tài khoản đã duyệt xuất được (cổng duyệt do {@code ApprovalGateFilter} chặn);
 * SĐT và email chỉ có khi người xuất là Admin, do {@link ReportService} kiểm từ DB.
 */
@RestController
@RequestMapping("/api/reports")
@Tag(name = "reports")
class ReportController {

    private final ReportService service;

    ReportController(ReportService service) {
        this.service = service;
    }

    @Operation(operationId = "exportMembersExcel", summary = "Báo cáo danh sách thành viên (Excel)",
            description = "Cột SĐT và email chỉ có khi người xuất là Admin. Tên tệp có ngày xuất.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/members.xlsx")
    ResponseEntity<byte[]> membersExcel(@Parameter(hidden = true) CurrentUser current) {
        return file(service.membersExcel(current.userId()));
    }

    @Operation(operationId = "exportMembersPdf", summary = "Báo cáo danh sách thành viên (PDF)",
            description = "A4 ngang, nhúng font Be Vietnam Pro, có số trang. Cột SĐT và email chỉ có khi người xuất là Admin.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/members.pdf")
    ResponseEntity<byte[]> membersPdf(@Parameter(hidden = true) CurrentUser current) {
        return file(service.membersPdf(current.userId()));
    }

    @Operation(operationId = "exportEventsExcel", summary = "Báo cáo sự kiện (Excel)",
            description = "Giỗ, sinh nhật và sự kiện chung có ngày dương trong năm.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/events.xlsx")
    ResponseEntity<byte[]> eventsExcel(@RequestParam int year) {
        return file(service.eventsExcel(year));
    }

    @Operation(operationId = "exportMemorialsPdf", summary = "Báo cáo lịch giỗ (PDF)",
            description = "Lịch giỗ cả năm âm, nhóm theo tháng âm, kèm ngày dương tương ứng. A4, có số trang.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/memorials.pdf")
    ResponseEntity<byte[]> memorialsPdf(@RequestParam int lunarYear) {
        return file(service.memorialsPdf(lunarYear));
    }

    private static ResponseEntity<byte[]> file(ReportFile f) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(f.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(f.filename()).build().toString())
                .body(f.bytes());
    }
}
