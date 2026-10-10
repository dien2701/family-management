package vn.giapha.member.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;
import vn.giapha.member.dto.MemberDetail;
import vn.giapha.member.dto.MemberFilter;
import vn.giapha.member.dto.MemberInput;
import vn.giapha.member.dto.MemberPage;
import vn.giapha.member.service.MemberService;

/**
 * Thành viên gia phả. Hai GET xem được không cần đăng nhập (DECISIONS #88); thêm, sửa, xóa phải đăng nhập, đã duyệt
 * và do {@link MemberService} kiểm lại vai trò Admin từ DB.
 */
@RestController
@RequestMapping("/api/members")
@Tag(name = "members")
class MemberController {

    private final MemberService service;

    MemberController(MemberService service) {
        this.service = service;
    }

    @Operation(operationId = "listMembers", summary = "Danh sách thành viên",
            description = "Không cần đăng nhập (DECISIONS #88). Tìm theo tên không cần gõ dấu. Các bộ lọc kết hợp bằng AND.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @GetMapping
    MemberPage list(
            @Parameter(description = "Tìm theo họ tên, không phân biệt hoa thường và dấu")
            @RequestParam(required = false) @Size(max = 100, message = "Từ khóa tối đa 100 ký tự.") String q,
            @Parameter(description = "name (A-Z), age (lớn tuổi trước), created (mới thêm trước), generation (đời nhỏ trước)")
            @RequestParam(defaultValue = "name")
            @Pattern(regexp = "name|age|created|generation",
                    message = "sort chỉ nhận: name, age, created, generation.") String sort,
            @RequestParam(required = false)
            @Min(value = 0, message = "ageMin phải từ 0 đến 150.")
            @Max(value = 150, message = "ageMin phải từ 0 đến 150.") Integer ageMin,
            @RequestParam(required = false)
            @Min(value = 0, message = "ageMax phải từ 0 đến 150.")
            @Max(value = 150, message = "ageMax phải từ 0 đến 150.") Integer ageMax,
            @Parameter(description = "Đời (độ sâu trên cây, đời 1 là gốc)")
            @RequestParam(required = false) @Min(value = 1, message = "generation phải từ 1.") Integer generation,
            @Parameter(description = "true chỉ người đã mất, false chỉ người còn sống")
            @RequestParam(required = false) Boolean deceased,
            @Parameter(description = "true chỉ người đã có trên cây, false chỉ người chưa có")
            @RequestParam(required = false) Boolean onTree,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Trang phải từ 0.") int page,
            @RequestParam(defaultValue = "20")
            @Min(value = 1, message = "Kích thước trang phải từ 1.")
            @Max(value = 100, message = "Kích thước trang tối đa 100.") int size) {
        return service.list(new MemberFilter(q, sort, ageMin, ageMax, generation, deceased, onTree), page, size);
    }

    @Operation(operationId = "createMember", summary = "Thêm thành viên",
            description = "Chỉ Admin. Chỉ fullName là bắt buộc. Các trường về việc đã mất chỉ hợp lệ khi isDeceased = true.")
    @ApiResponse(responseCode = "201", description = "Đã tạo")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    MemberDetail create(@Parameter(hidden = true) CurrentUser current, @Valid @RequestBody MemberInput input) {
        return service.create(current.userId(), input);
    }

    @Operation(operationId = "getMember", summary = "Chi tiết thành viên",
            description = "Không cần đăng nhập (DECISIONS #88). phone và email chỉ có khi người gọi là Admin hoặc chính chủ hồ sơ.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @GetMapping("/{id}")
    MemberDetail get(@PathVariable Long id) {
        // Khách (chưa đăng nhập) là viewer null: không phải Admin, không phải chính chủ nên không thấy SĐT/email
        return service.get(CurrentUser.idOrNull(), id);
    }

    @Operation(operationId = "updateMember", summary = "Sửa thành viên",
            description = "Thay toàn bộ hồ sơ. Admin sửa mọi hồ sơ; User đã liên kết chỉ sửa hồ sơ của mình và không đổi "
                    + "được nhóm \"đã mất\" (403 DEATH_FIELDS_ADMIN_ONLY, giữ nguyên giá trị thì bỏ qua). Người khác thì "
                    + "403 FORBIDDEN.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @PutMapping("/{id}")
    MemberDetail update(@Parameter(hidden = true) CurrentUser current,
            @PathVariable Long id,
            @Valid @RequestBody MemberInput input) {
        return service.update(current.userId(), id, input);
    }

    @Operation(operationId = "deleteMember", summary = "Xóa thành viên",
            description = "Chỉ Admin. Bị chặn nếu người đó đang có trên cây (409 MEMBER_ON_TREE).")
    @ApiResponse(responseCode = "204", description = "Đã xóa")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@Parameter(hidden = true) CurrentUser current,
            @PathVariable Long id) {
        service.delete(current.userId(), id);
    }
}
