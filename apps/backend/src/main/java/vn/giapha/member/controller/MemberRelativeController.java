package vn.giapha.member.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

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
import vn.giapha.member.dto.RelativeInput;
import vn.giapha.member.dto.RelativeLabelInput;
import vn.giapha.member.dto.RelativeResponse;
import vn.giapha.member.service.RelativeService;

/**
 * Danh sách người thân trong hồ sơ. GET xem được không cần đăng nhập (DECISIONS #88); ghi phải đăng nhập, đã duyệt và
 * do {@link RelativeService} kiểm lại chủ hồ sơ hoặc Admin từ DB.
 */
@RestController
@RequestMapping("/api/members/{id}/relatives")
@Tag(name = "relatives")
class MemberRelativeController {

    private final RelativeService service;

    MemberRelativeController(RelativeService service) {
        this.service = service;
    }

    @Operation(operationId = "listRelatives", summary = "Danh sách người thân của một hồ sơ",
            description = "Không cần đăng nhập (DECISIONS #88). Một chiều: chỉ có các dòng do chủ hồ sơ hoặc Admin khai "
                    + "trong hồ sơ này. Sắp theo thời điểm thêm.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @GetMapping
    List<RelativeResponse> list(@PathVariable Long id) {
        return service.list(id);
    }

    @Operation(operationId = "addRelative", summary = "Thêm người thân vào hồ sơ",
            description = "Chủ hồ sơ (User đã liên kết, user.member_id = id) hoặc Admin; có hiệu lực ngay. "
                    + "409 RELATIVE_EXISTS khi người này đã có trong danh sách.")
    @ApiResponse(responseCode = "201", description = "Đã thêm")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    RelativeResponse add(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @RequestBody RelativeInput input) {
        return service.add(current.userId(), id, input);
    }

    @Operation(operationId = "updateRelative", summary = "Sửa nhãn của một người thân",
            description = "Chỉ đổi được label. Quyền như POST. 404 RELATIVE_NOT_FOUND khi dòng không thuộc hồ sơ này.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @PutMapping("/{relativeId}")
    RelativeResponse update(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @PathVariable Long relativeId, @RequestBody RelativeLabelInput input) {
        return service.updateLabel(current.userId(), id, relativeId, input);
    }

    @Operation(operationId = "deleteRelative", summary = "Xóa một người thân khỏi hồ sơ",
            description = "Quyền như POST. Chỉ xóa dòng trong hồ sơ này, thành viên được nhắc tới vẫn giữ nguyên.")
    @ApiResponse(responseCode = "204", description = "Đã xóa")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @DeleteMapping("/{relativeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id, @PathVariable Long relativeId) {
        service.delete(current.userId(), id, relativeId);
    }
}
