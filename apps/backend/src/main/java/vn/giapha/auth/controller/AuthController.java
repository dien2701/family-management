package vn.giapha.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
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
import vn.giapha.common.web.ApiRefs;

/**
 * Các endpoint mở cho người chưa đăng nhập; refresh token đi qua cookie, không nằm trong body.
 * Ba endpoint trả 204 ({@code logout}, {@code verify-reset-otp}, {@code reset-password}) vẫn ghi 200 trong tài liệu
 * cho khớp hợp đồng hiện có.
 */
@RestController
@RequestMapping("/api/auth")
@SecurityRequirements
@Tag(name = "auth")
class AuthController {

    private final AuthService authService;
    private final RefreshCookieFactory cookies;

    AuthController(AuthService authService, RefreshCookieFactory cookies) {
        this.authService = authService;
        this.cookies = cookies;
    }

    @Operation(operationId = "register", summary = "Đăng ký bằng email và gửi OTP")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "429", ref = ApiRefs.TOO_MANY_REQUESTS)
    @PostMapping("/register")
    OtpSentResponse register(@Valid @RequestBody RegisterRequest req, HttpServletRequest http) {
        return authService.register(req, http.getRemoteAddr());
    }

    @Operation(operationId = "resendOtp", summary = "Gửi lại OTP đăng ký")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "429", ref = ApiRefs.TOO_MANY_REQUESTS)
    @PostMapping("/resend-otp")
    OtpSentResponse resendOtp(@Valid @RequestBody EmailRequest req, HttpServletRequest http) {
        return authService.resendRegisterOtp(req, http.getRemoteAddr());
    }

    @Operation(operationId = "verifyOtp", summary = "Xác thực OTP đăng ký và đăng nhập luôn")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "429", ref = ApiRefs.TOO_MANY_REQUESTS)
    @PostMapping("/verify-otp")
    ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        return withCookie(authService.verifyRegisterOtp(req));
    }

    @Operation(operationId = "login", summary = "Đăng nhập bằng email và mật khẩu")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "429", ref = ApiRefs.TOO_MANY_REQUESTS)
    @PostMapping("/login")
    ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        return withCookie(authService.login(req, http.getRemoteAddr()));
    }

    @Operation(operationId = "google", summary = "Đăng nhập bằng Google ID token")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "429", ref = ApiRefs.TOO_MANY_REQUESTS)
    @PostMapping("/google")
    ResponseEntity<AuthResponse> google(@Valid @RequestBody GoogleLoginRequest req) {
        return withCookie(authService.loginWithGoogle(req));
    }

    @Operation(operationId = "refresh", summary = "Đổi refresh cookie lấy access token mới")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "429", ref = ApiRefs.TOO_MANY_REQUESTS)
    @PostMapping("/refresh")
    ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = RefreshCookieFactory.NAME, required = false) String refreshToken) {
        return withCookie(authService.refresh(refreshToken));
    }

    @Operation(operationId = "logout", summary = "Đăng xuất, thu hồi refresh token")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @PostMapping("/logout")
    ResponseEntity<Void> logout(
            @CookieValue(name = RefreshCookieFactory.NAME, required = false) String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookies.clear()).build();
    }

    @Operation(operationId = "forgotPassword", summary = "Quên mật khẩu, gửi OTP đặt lại")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "429", ref = ApiRefs.TOO_MANY_REQUESTS)
    @PostMapping("/forgot-password")
    OtpSentResponse forgotPassword(@Valid @RequestBody EmailRequest req, HttpServletRequest http) {
        return authService.forgotPassword(req, http.getRemoteAddr());
    }

    @Operation(operationId = "verifyResetOtp", summary = "Kiểm tra OTP đặt lại mật khẩu (chưa tiêu OTP)")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "429", ref = ApiRefs.TOO_MANY_REQUESTS)
    @PostMapping("/verify-reset-otp")
    ResponseEntity<Void> verifyResetOtp(@Valid @RequestBody VerifyOtpRequest req) {
        authService.verifyResetOtp(req);
        return ResponseEntity.noContent().build();
    }

    @Operation(operationId = "resetPassword", summary = "Đặt mật khẩu mới bằng OTP")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "429", ref = ApiRefs.TOO_MANY_REQUESTS)
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
