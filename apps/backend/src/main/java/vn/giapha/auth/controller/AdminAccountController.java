package vn.giapha.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.auth.dto.AccountAdminResponse;
import vn.giapha.auth.dto.AccountFilter;
import vn.giapha.auth.dto.AdminMemberLinkInput;
import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.ApprovalStatus;
import vn.giapha.auth.entity.SystemRole;
import vn.giapha.auth.service.AdminAccountService;
import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;
import vn.giapha.common.web.PageResponse;

/** Quản lý tài khoản, chỉ Admin. Service kiểm lại vai trò từ DB nên claim cũ không đủ để qua. */
@RestController
@RequestMapping("/api/admin/accounts")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin-accounts")
class AdminAccountController {

    private final AdminAccountService service;

    AdminAccountController(AdminAccountService service) {
        this.service = service;
    }

    @Operation(operationId = "list", summary = "Danh sách tài khoản (Admin)")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping
    PageResponse<AccountAdminResponse> list(@Parameter(hidden = true) CurrentUser current,
            @RequestParam(required = false) ApprovalStatus approval,
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) SystemRole role,
            @Parameter(description = "Tìm theo họ tên (không phân biệt hoa thường, dấu) hoặc email")
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Trang phải từ 0.") int page,
            @RequestParam(defaultValue = "20")
            @Min(value = 1, message = "Kích thước trang phải từ 1.")
            @Max(value = 100, message = "Kích thước trang tối đa 100.") int size) {
        return service.list(current.userId(), new AccountFilter(approval, status, role, q), page, size);
    }

    @Operation(operationId = "approve", summary = "Duyệt tài khoản")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/{id}/approve")
    AccountAdminResponse approve(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.approve(current.userId(), id);
    }

    @Operation(operationId = "reject", summary = "Từ chối duyệt tài khoản")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/{id}/reject")
    AccountAdminResponse reject(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.reject(current.userId(), id);
    }

    @Operation(operationId = "lock", summary = "Khóa tài khoản")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/{id}/lock")
    AccountAdminResponse lock(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.lock(current.userId(), id);
    }

    @Operation(operationId = "unlock", summary = "Mở khóa tài khoản")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/{id}/unlock")
    AccountAdminResponse unlock(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.unlock(current.userId(), id);
    }

    @Operation(operationId = "grantAdmin", summary = "Cấp quyền Admin")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/{id}/grant-admin")
    AccountAdminResponse grantAdmin(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.grantAdmin(current.userId(), id);
    }

    @Operation(operationId = "revokeAdmin", summary = "Gỡ quyền Admin")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/{id}/revoke-admin")
    AccountAdminResponse revokeAdmin(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.revokeAdmin(current.userId(), id);
    }

    @Operation(operationId = "adminLinkMember", summary = "Admin gán thành viên cho tài khoản",
            description = "Không cần yêu cầu. Chỉ tài khoản đã duyệt và đang hoạt động (409 INVALID_ACCOUNT_STATE). "
                    + "409 MEMBER_ALREADY_LINKED, 409 ACCOUNT_ALREADY_LINKED. Yêu cầu \"Đây là tôi\" đang chờ của tài khoản "
                    + "đó chuyển sang CANCELLED; chép email tài khoản sang hồ sơ nếu hồ sơ chưa có (DECISIONS #81).")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PutMapping("/{id}/member-link")
    AccountAdminResponse linkMember(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @Valid @RequestBody AdminMemberLinkInput input) {
        return service.linkMember(current.userId(), id, input.memberId());
    }

    @Operation(operationId = "adminUnlinkMember", summary = "Admin hủy liên kết của một tài khoản",
            description = "Hủy được của bất kỳ ai. Không xóa email đã chép sang hồ sơ. 409 NOT_LINKED khi chưa liên kết.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @DeleteMapping("/{id}/member-link")
    AccountAdminResponse unlinkMember(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.unlinkMember(current.userId(), id);
    }
}
