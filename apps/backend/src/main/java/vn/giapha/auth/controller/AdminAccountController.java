package vn.giapha.auth.controller;

import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.auth.dto.AccountAdminResponse;
import vn.giapha.auth.dto.AccountFilter;
import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.ApprovalStatus;
import vn.giapha.auth.entity.SystemRole;
import vn.giapha.auth.service.AdminAccountService;
import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.PageResponse;

/** Quản lý tài khoản, chỉ Admin. Service kiểm lại vai trò từ DB nên claim cũ không đủ để qua. */
@RestController
@RequestMapping("/api/admin/accounts")
@PreAuthorize("hasRole('ADMIN')")
class AdminAccountController {

    private final AdminAccountService service;

    AdminAccountController(AdminAccountService service) {
        this.service = service;
    }

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

    @PostMapping("/{id}/approve")
    AccountAdminResponse approve(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.approve(current.userId(), id);
    }

    @PostMapping("/{id}/reject")
    AccountAdminResponse reject(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.reject(current.userId(), id);
    }

    @PostMapping("/{id}/lock")
    AccountAdminResponse lock(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.lock(current.userId(), id);
    }

    @PostMapping("/{id}/unlock")
    AccountAdminResponse unlock(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.unlock(current.userId(), id);
    }

    @PostMapping("/{id}/grant-admin")
    AccountAdminResponse grantAdmin(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.grantAdmin(current.userId(), id);
    }

    @PostMapping("/{id}/revoke-admin")
    AccountAdminResponse revokeAdmin(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.revokeAdmin(current.userId(), id);
    }
}
