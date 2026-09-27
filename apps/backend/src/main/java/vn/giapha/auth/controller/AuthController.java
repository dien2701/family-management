package vn.giapha.auth.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.auth.dto.AuthResponse;
import vn.giapha.auth.dto.EmailRequest;
import vn.giapha.auth.dto.GoogleLoginRequest;
import vn.giapha.auth.dto.LoginRequest;
import vn.giapha.auth.dto.OtpSentResponse;
import vn.giapha.auth.dto.RegisterRequest;
import vn.giapha.auth.dto.ResetPasswordRequest;
import vn.giapha.auth.dto.VerifyOtpRequest;
import vn.giapha.auth.service.AuthService;
import vn.giapha.auth.service.AuthService.AuthResult;

/** Các endpoint mở cho người chưa đăng nhập; refresh token đi qua cookie, không nằm trong body. */
@RestController
@RequestMapping("/api/auth")
@SecurityRequirements
class AuthController {

    private final AuthService authService;
    private final RefreshCookieFactory cookies;

    AuthController(AuthService authService, RefreshCookieFactory cookies) {
        this.authService = authService;
        this.cookies = cookies;
    }

    @PostMapping("/register")
    OtpSentResponse register(@Valid @RequestBody RegisterRequest req, HttpServletRequest http) {
        return authService.register(req, http.getRemoteAddr());
    }

    @PostMapping("/resend-otp")
    OtpSentResponse resendOtp(@Valid @RequestBody EmailRequest req, HttpServletRequest http) {
        return authService.resendRegisterOtp(req, http.getRemoteAddr());
    }

    @PostMapping("/verify-otp")
    ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        return withCookie(authService.verifyRegisterOtp(req));
    }

    @PostMapping("/login")
    ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        return withCookie(authService.login(req, http.getRemoteAddr()));
    }

    @PostMapping("/google")
    ResponseEntity<AuthResponse> google(@Valid @RequestBody GoogleLoginRequest req) {
        return withCookie(authService.loginWithGoogle(req));
    }

    @PostMapping("/refresh")
    ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = RefreshCookieFactory.NAME, required = false) String refreshToken) {
        return withCookie(authService.refresh(refreshToken));
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(
            @CookieValue(name = RefreshCookieFactory.NAME, required = false) String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookies.clear()).build();
    }

    @PostMapping("/forgot-password")
    OtpSentResponse forgotPassword(@Valid @RequestBody EmailRequest req, HttpServletRequest http) {
        return authService.forgotPassword(req, http.getRemoteAddr());
    }

    @PostMapping("/verify-reset-otp")
    ResponseEntity<Void> verifyResetOtp(@Valid @RequestBody VerifyOtpRequest req) {
        authService.verifyResetOtp(req);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<AuthResponse> withCookie(AuthResult result) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookies.create(result.refreshToken()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(result.body());
    }
}
