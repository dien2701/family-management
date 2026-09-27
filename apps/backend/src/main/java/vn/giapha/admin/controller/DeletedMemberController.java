package vn.giapha.admin.controller;

import java.util.Map;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.admin.dto.DeletedMemberSnapshotSummaryResponse;
import vn.giapha.admin.service.DeletedMemberQueryService;
import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;
import vn.giapha.common.web.PageResponse;

/** Thành viên đã xóa (IDEA §6.10; DECISIONS #62), chỉ Admin: đọc lại bản sao đã ghi vào audit log lúc xóa. */
@RestController
@RequestMapping("/api/admin/deleted-members")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin-deleted-members")
class DeletedMemberController {

    private final DeletedMemberQueryService service;

    DeletedMemberController(DeletedMemberQueryService service) {
        this.service = service;
    }

    @Operation(operationId = "listDeletedMembers", summary = "Danh sách snapshot thành viên đã xóa")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping
    PageResponse<DeletedMemberSnapshotSummaryResponse> list(@Parameter(hidden = true) CurrentUser current,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Trang phải từ 0.") int page,
            @RequestParam(defaultValue = "20")
            @Min(value = 1, message = "Kích thước trang phải từ 1.")
            @Max(value = 100, message = "Kích thước trang tối đa 100.") int size) {
        return service.list(current.userId(), page, size);
    }

    @Operation(operationId = "getDeletedMemberSnapshot", summary = "Chi tiết snapshot thành viên đã xóa")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @GetMapping("/{auditId}")
    Map<String, Object> get(@Parameter(hidden = true) CurrentUser current, @PathVariable Long auditId) {
        return service.get(current.userId(), auditId);
    }
}
