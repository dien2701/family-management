package vn.giapha.prayer.controller;

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
import vn.giapha.prayer.dto.PrayerFillBody;
import vn.giapha.prayer.dto.PrayerInput;
import vn.giapha.prayer.dto.PrayerResponse;
import vn.giapha.prayer.dto.PrayerSummaryResponse;
import vn.giapha.prayer.service.PrayerService;

/**
 * Bài khấn (DECISIONS #90). GET danh sách và chi tiết xem được không cần đăng nhập (DECISIONS #88, liệt kê trong
 * {@code PublicReadPaths}); thêm, sửa, xóa chỉ Admin; {@code /fill} cần đăng nhập, đã duyệt và chỉ của chính người gọi.
 */
@RestController
@RequestMapping("/api/prayers")
@Tag(name = "prayers")
class PrayerController {

    private final PrayerService service;

    PrayerController(PrayerService service) {
        this.service = service;
    }

    @Operation(operationId = "listPrayers", summary = "Danh sách bài khấn",
            description = "Không cần đăng nhập. Xếp theo tiêu đề; không kèm nội dung.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @GetMapping
    List<PrayerSummaryResponse> list() {
        return service.list();
    }

    @Operation(operationId = "createPrayer", summary = "Thêm bài khấn", description = "Chỉ Admin.")
    @ApiResponse(responseCode = "201", description = "Đã thêm")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    PrayerResponse create(@Parameter(hidden = true) CurrentUser current, @Valid @RequestBody PrayerInput input) {
        return service.create(current.userId(), input);
    }

    @Operation(operationId = "getPrayer", summary = "Chi tiết một bài khấn",
            description = "Không cần đăng nhập. Lỗi: 404 PRAYER_NOT_FOUND.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @GetMapping("/{id}")
    PrayerResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @Operation(operationId = "updatePrayer", summary = "Sửa bài khấn",
            description = "Chỉ Admin. Thay toàn bộ nội dung. Lỗi: 404 PRAYER_NOT_FOUND.")
    @ApiResponse(responseCode = "200", description = "Đã sửa")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @PutMapping("/{id}")
    PrayerResponse update(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @Valid @RequestBody PrayerInput input) {
        return service.update(current.userId(), id, input);
    }

    @Operation(operationId = "deletePrayer", summary = "Xóa bài khấn",
            description = "Chỉ Admin. Xóa luôn thông tin mọi người đã điền. Lỗi: 404 PRAYER_NOT_FOUND.")
    @ApiResponse(responseCode = "204", description = "Đã xóa")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        service.delete(current.userId(), id);
    }

    @Operation(operationId = "getPrayerFill", summary = "Thông tin tôi đã điền cho bài khấn",
            description = "Tài khoản đã duyệt. Chỉ của chính người gọi; chưa điền thì values rỗng. "
                    + "Lỗi: 404 PRAYER_NOT_FOUND.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @GetMapping("/{id}/fill")
    PrayerFillBody getFill(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.getFill(current.userId(), id);
    }

    @Operation(operationId = "savePrayerFill", summary = "Lưu thông tin tôi đã điền cho bài khấn",
            description = "Tài khoản đã duyệt. Thay toàn bộ values của chính người gọi (tài khoản lấy từ token). "
                    + "Lỗi: 404 PRAYER_NOT_FOUND.")
    @ApiResponse(responseCode = "200", description = "Đã lưu")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @PutMapping("/{id}/fill")
    PrayerFillBody saveFill(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @Valid @RequestBody PrayerFillBody body) {
        return service.saveFill(current.userId(), id, body);
    }
}
