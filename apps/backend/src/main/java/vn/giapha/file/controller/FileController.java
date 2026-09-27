package vn.giapha.file.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;
import vn.giapha.file.dto.AttachmentResponse;
import vn.giapha.file.dto.FileConfirmRequest;
import vn.giapha.file.dto.FileSignRequest;
import vn.giapha.file.dto.FileSignResponse;
import vn.giapha.file.dto.QuotaResponse;
import vn.giapha.file.service.AttachmentService;

/** Tải tệp lên Cloudinary (xin chữ ký, xác nhận) và xem dung lượng. Quyền do {@link AttachmentService} kiểm từ DB. */
@RestController
@RequestMapping("/api/files")
@Tag(name = "files")
class FileController {

    private final AttachmentService service;

    FileController(AttachmentService service) {
        this.service = service;
    }

    @Operation(operationId = "signUpload", summary = "Xin chữ ký để tải tệp lên Cloudinary",
            description = "Chỉ Admin, trừ kind = AVATAR cho hồ sơ của chính User đã liên kết. Kiểm MIME, tối đa 10 MB "
                    + "mỗi tệp và 1 GB toàn hệ thống.")
    @ApiResponse(responseCode = "200", description = "Chữ ký có hiệu lực ngắn")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PostMapping("/sign")
    FileSignResponse sign(@Parameter(hidden = true) CurrentUser current, @RequestBody FileSignRequest request) {
        return service.sign(current.userId(), request);
    }

    @Operation(operationId = "confirmUpload", summary = "Xác nhận tệp đã tải lên Cloudinary",
            description = "Máy chủ kiểm lại tệp trên Cloudinary rồi ghi nhận. Với AVATAR, ảnh cũ bị thay và avatarUrl "
                    + "được cập nhật. Quyền như /api/files/sign.")
    @ApiResponse(responseCode = "200", description = "Đã ghi nhận")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PostMapping("/confirm")
    AttachmentResponse confirm(@Parameter(hidden = true) CurrentUser current,
            @RequestBody FileConfirmRequest request) {
        return service.confirm(current.userId(), request);
    }

    @Operation(operationId = "getQuota", summary = "Lấy thông tin dung lượng lưu trữ")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/quota")
    QuotaResponse quota() {
        return service.quota();
    }
}
