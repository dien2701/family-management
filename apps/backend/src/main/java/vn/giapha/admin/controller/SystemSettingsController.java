package vn.giapha.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.admin.dto.SystemSettingsResponse;
import vn.giapha.admin.service.SystemSettingsService;
import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;

/** Cấu hình hệ thống, chỉ Admin. Service kiểm lại vai trò từ DB nên claim cũ không đủ để qua. */
@RestController
@RequestMapping("/api/admin/settings")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin-settings")
class SystemSettingsController {

    private final SystemSettingsService service;

    SystemSettingsController(SystemSettingsService service) {
        this.service = service;
    }

    @Operation(operationId = "getSettings", summary = "Lấy cấu hình hệ thống")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping
    SystemSettingsResponse get(@Parameter(hidden = true) CurrentUser current) {
        return service.get(current.userId());
    }

    @Operation(operationId = "updateSettings", summary = "Cập nhật cấu hình hệ thống")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PutMapping
    SystemSettingsResponse update(@Parameter(hidden = true) CurrentUser current,
            @Valid @RequestBody SystemSettingsResponse input) {
        return service.update(current.userId(), input);
    }
}
