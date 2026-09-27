package vn.giapha.event.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;
import vn.giapha.event.dto.CustomEventInput;
import vn.giapha.event.dto.CustomEventResponse;
import vn.giapha.event.service.EventService;

/**
 * Sự kiện chung. Mọi tài khoản đã duyệt xem được (cổng duyệt do {@code ApprovalGateFilter} chặn); thêm, sửa, xóa
 * chỉ Admin, do {@link EventService} kiểm lại từ DB.
 */
@RestController
@RequestMapping("/api/events")
@Tag(name = "events")
class EventController {

    private final EventService service;

    EventController(EventService service) {
        this.service = service;
    }

    @Operation(operationId = "listEvents", summary = "Danh sách sự kiện chung",
            description = "Mọi tài khoản đã duyệt xem được. Xếp theo id tăng dần. Chỉ gồm sự kiện chung; giỗ và "
                    + "sinh nhật do /api/calendar/* tự sinh từ hồ sơ thành viên.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping
    List<CustomEventResponse> list() {
        return service.list();
    }

    @Operation(operationId = "createEvent", summary = "Thêm sự kiện chung",
            description = "Chỉ Admin (User gửi đề xuất, Đợt 20-21/33). year = null nghĩa là lặp hằng năm theo "
                    + "calendar; có year thì chỉ diễn ra một lần vào đúng ngày đó.")
    @ApiResponse(responseCode = "201", description = "Đã thêm")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    CustomEventResponse create(@Parameter(hidden = true) CurrentUser current,
            @Valid @RequestBody CustomEventInput input) {
        return service.create(current.userId(), input);
    }

    @Operation(operationId = "getEvent", summary = "Chi tiết một sự kiện chung",
            description = "Lỗi: 404 EVENT_NOT_FOUND.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @GetMapping("/{id}")
    CustomEventResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @Operation(operationId = "updateEvent", summary = "Sửa sự kiện chung",
            description = "Chỉ Admin. Thay toàn bộ nội dung. Lỗi: 404 EVENT_NOT_FOUND.")
    @ApiResponse(responseCode = "200", description = "Đã sửa")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @PutMapping("/{id}")
    CustomEventResponse update(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @Valid @RequestBody CustomEventInput input) {
        return service.update(current.userId(), id, input);
    }

    @Operation(operationId = "deleteEvent", summary = "Xóa sự kiện chung",
            description = "Chỉ Admin. Lỗi: 404 EVENT_NOT_FOUND.")
    @ApiResponse(responseCode = "204", description = "Đã xóa")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        service.delete(current.userId(), id);
    }
}
