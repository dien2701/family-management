package vn.giapha.auth.controller;

import io.swagger.v3.oas.annotations.Parameter;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.auth.dto.MeResponse;
import vn.giapha.auth.service.AuthService;
import vn.giapha.common.security.CurrentUser;

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
}
