package vn.giapha.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.admin.dto.DashboardResponse;
import vn.giapha.admin.service.DashboardService;
import vn.giapha.common.security.CurrentUser;

/** Tổng quan (IDEA §6.8), xem được không cần đăng nhập (DECISIONS #88); khách không có số chờ duyệt. */
@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "dashboard")
class DashboardController {

    private final DashboardService service;

    DashboardController(DashboardService service) {
        this.service = service;
    }

    @Operation(operationId = "getDashboard", summary = "Tổng quan")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping
    DashboardResponse get() {
        return service.get(CurrentUser.idOrNull());
    }
}
