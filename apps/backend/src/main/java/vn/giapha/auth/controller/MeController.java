package vn.giapha.auth.controller;

import io.swagger.v3.oas.annotations.Parameter;
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

/** {@code /api/me} và {@code /api/me/consent} dùng được cả khi chưa được duyệt (miễn ở ApprovalGateFilter). */
@RestController
class MeController {

    private final AuthService authService;

    MeController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/api/me")
    MeResponse me(@Parameter(hidden = true) CurrentUser current) {
        return authService.me(current.userId());
    }

    @PostMapping("/api/me/consent")
    MeResponse consent(@Parameter(hidden = true) CurrentUser current,
            // Chỉ để @Valid bắt buộc tick đồng ý; service không cần nội dung
            @Valid @RequestBody ConsentRequest ignored, HttpServletRequest http) {
        return authService.acceptConsent(current.userId(), http.getRemoteAddr());
    }
}
