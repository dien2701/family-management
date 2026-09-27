package vn.giapha.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.auth.dto.ConsentRequest;
import vn.giapha.auth.dto.MeResponse;
import vn.giapha.auth.service.AuthService;
import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;

/** {@code /api/me} và {@code /api/me/consent} dùng được cả khi chưa được duyệt (miễn ở ApprovalGateFilter). */
@RestController
@Tag(name = "me")
class MeController {

    private final AuthService authService;

    MeController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(operationId = "me", summary = "Thông tin tài khoản đang đăng nhập")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/api/me")
    MeResponse me(@Parameter(hidden = true) CurrentUser current) {
        return authService.me(current.userId());
    }

    @Operation(operationId = "consent", summary = "Ghi nhận đồng ý chính sách dữ liệu cá nhân")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PostMapping("/api/me/consent")
    MeResponse consent(@Parameter(hidden = true) CurrentUser current,
            // Chỉ để @Valid bắt buộc tick đồng ý; service không cần nội dung
            @Valid @RequestBody ConsentRequest ignored, HttpServletRequest http) {
        return authService.acceptConsent(current.userId(), http.getRemoteAddr());
    }
}
