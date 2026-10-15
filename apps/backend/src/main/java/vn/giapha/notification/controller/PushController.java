package vn.giapha.notification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;
import vn.giapha.notification.dto.GuestPushPref;
import vn.giapha.notification.dto.GuestPushRequest;
import vn.giapha.notification.dto.PushSubscribeRequest;
import vn.giapha.notification.dto.PushUnsubscribeRequest;
import vn.giapha.notification.service.PushSubscriptionService;

/**
 * Web Push (IDEA §9, DECISIONS #46, #89). Chưa cấu hình VAPID thì trả 503 {@code PUSH_NOT_CONFIGURED}. Khóa công khai
 * và nhóm {@code /guest} mở cho người chưa đăng nhập (xem {@code PublicPushPaths}); còn lại cần đăng nhập và đã duyệt.
 */
@RestController
@RequestMapping("/api/push")
@Tag(name = "push")
class PushController {

    private final PushSubscriptionService service;

    PushController(PushSubscriptionService service) {
        this.service = service;
    }

    @Operation(operationId = "getPushPublicKey", summary = "Lấy VAPID public key")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping(value = "/public-key", produces = MediaType.TEXT_PLAIN_VALUE)
    String publicKey() {
        return service.publicKey();
    }

    @Operation(operationId = "subscribePush", summary = "Đăng ký thiết bị nhận thông báo push")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PostMapping("/subscribe")
    void subscribe(@Parameter(hidden = true) CurrentUser current, @Valid @RequestBody PushSubscribeRequest input,
            HttpServletRequest request) {
        service.subscribe(current.userId(), input, request.getHeader("User-Agent"));
    }

    @Operation(operationId = "unsubscribePush", summary = "Hủy đăng ký push trên thiết bị")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @DeleteMapping("/subscribe")
    void unsubscribe(@Parameter(hidden = true) CurrentUser current, @Valid @RequestBody PushUnsubscribeRequest input) {
        service.unsubscribe(current.userId(), input.endpoint());
    }

    @Operation(operationId = "releasePush", summary = "Chuyển push của thiết bị này từ tài khoản về khách",
            description = "Gọi khi đăng xuất (DECISIONS #89). Không có hoặc không phải của mình thì vẫn 200.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PostMapping("/release")
    void release(@Parameter(hidden = true) CurrentUser current, @Valid @RequestBody PushUnsubscribeRequest input) {
        service.releaseToGuest(current.userId(), input.endpoint());
    }

    // ---------- Khách, không cần đăng nhập (DECISIONS #89): nhận diện bằng endpoint, giới hạn theo IP ----------

    @Operation(operationId = "putGuestPush", summary = "Khách đăng ký hoặc cập nhật tùy chọn push của thiết bị",
            description = "Công khai. Lỗi: 404 PUSH_SUBSCRIPTION_NOT_FOUND (endpoint đang gắn với tài khoản), 429 RATE_LIMITED.")
    @ApiResponse(responseCode = "200", description = "Tùy chọn hiện tại của thiết bị")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @PutMapping("/guest")
    GuestPushPref putGuest(@Valid @RequestBody GuestPushRequest input, HttpServletRequest request) {
        return service.guestUpsert(input, request.getHeader("User-Agent"), request.getRemoteAddr());
    }

    @Operation(operationId = "lookupGuestPush", summary = "Khách đọc tùy chọn push của thiết bị",
            description = "Công khai; dùng POST để endpoint không nằm trên URL. Lỗi: 404 PUSH_SUBSCRIPTION_NOT_FOUND, 429 RATE_LIMITED.")
    @ApiResponse(responseCode = "200", description = "Tùy chọn hiện tại của thiết bị")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @PostMapping("/guest/lookup")
    GuestPushPref lookupGuest(@Valid @RequestBody PushUnsubscribeRequest input, HttpServletRequest request) {
        return service.guestLookup(input.endpoint(), request.getRemoteAddr());
    }

    @Operation(operationId = "deleteGuestPush", summary = "Khách hủy push của thiết bị",
            description = "Công khai. Không có subscription khách thì vẫn 200.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @DeleteMapping("/guest")
    void deleteGuest(@Valid @RequestBody PushUnsubscribeRequest input, HttpServletRequest request) {
        service.guestUnsubscribe(input.endpoint(), request.getRemoteAddr());
    }

    @Operation(operationId = "testPush", summary = "Gửi thử thông báo push đến thiết bị hiện tại",
            description = "Lỗi: 404 PUSH_NOT_SUBSCRIBED (thiết bị này chưa đăng ký).")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @PostMapping("/test")
    void test(@Parameter(hidden = true) CurrentUser current) {
        service.sendTest(current.userId());
    }
}
