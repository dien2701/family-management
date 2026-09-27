package vn.giapha.notification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;
import vn.giapha.common.web.SimplePage;
import vn.giapha.notification.dto.NotificationPrefResponse;
import vn.giapha.notification.dto.NotificationResponse;
import vn.giapha.notification.service.NotificationService;

/** Hộp thư và tùy chọn thông báo (IDEA §9). Mỗi người chỉ đọc được thông báo và tùy chọn của chính mình. */
@RestController
@RequestMapping("/api/notifications")
@Tag(name = "notifications")
class NotificationController {

    private final NotificationService service;

    NotificationController(NotificationService service) {
        this.service = service;
    }

    @Operation(operationId = "getNotifications", summary = "Danh sách thông báo")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping
    SimplePage<NotificationResponse> list(@Parameter(hidden = true) CurrentUser current,
            @RequestParam(defaultValue = "1") @Min(value = 1, message = "Trang phải từ 1.") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Số dòng mỗi trang phải từ 1.") int size) {
        return service.inbox(current.userId(), page, size);
    }

    @Operation(operationId = "getUnreadCount", summary = "Số thông báo chưa đọc")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/unread-count")
    int unreadCount(@Parameter(hidden = true) CurrentUser current) {
        return (int) service.unreadCount(current.userId());
    }

    @Operation(operationId = "readNotification", summary = "Đánh dấu đã đọc",
            description = "Lỗi: 404 NOTIFICATION_NOT_FOUND (không có, hoặc không phải của mình).")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @PostMapping("/{id}/read")
    void read(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        service.markRead(current.userId(), id);
    }

    @Operation(operationId = "readAllNotifications", summary = "Đánh dấu tất cả đã đọc")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PostMapping("/read-all")
    void readAll(@Parameter(hidden = true) CurrentUser current) {
        service.markAllRead(current.userId());
    }

    @Operation(operationId = "getNotificationPreferences", summary = "Lấy cài đặt thông báo",
            description = "Tạo giá trị mặc định ở lần đọc đầu tiên (giờ nhận mặc định 07:00, IDEA §9 mục 4).")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/preferences")
    NotificationPrefResponse getPreferences(@Parameter(hidden = true) CurrentUser current) {
        return service.getPreferences(current.userId());
    }

    @Operation(operationId = "updateNotificationPreferences", summary = "Cập nhật cài đặt thông báo")
    @ApiResponse(responseCode = "200", description = "Đã cập nhật")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PutMapping("/preferences")
    NotificationPrefResponse updatePreferences(@Parameter(hidden = true) CurrentUser current,
            @Valid @RequestBody NotificationPrefResponse input) {
        return service.updatePreferences(current.userId(), input);
    }
}
