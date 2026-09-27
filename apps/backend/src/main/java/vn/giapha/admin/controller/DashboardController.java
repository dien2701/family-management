package vn.giapha.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.admin.dto.DashboardResponse;
import vn.giapha.admin.service.DashboardService;
import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;

/** Tổng quan (IDEA §6.8), mọi tài khoản đã duyệt xem được. */
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
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping
    DashboardResponse get(@Parameter(hidden = true) CurrentUser current) {
        return service.get(current.userId());
    }
}
