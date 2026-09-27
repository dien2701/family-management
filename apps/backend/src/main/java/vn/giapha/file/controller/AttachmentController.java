package vn.giapha.file.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;
import vn.giapha.file.dto.AttachmentResponse;
import vn.giapha.file.dto.DownloadUrlResponse;
import vn.giapha.file.service.AttachmentService;

/**
 * Xem, tải và xóa tệp đính kèm. Mọi tài khoản đã duyệt xem và tải được (cổng duyệt do {@code ApprovalGateFilter});
 * xóa chỉ Admin, kiểm ở service.
 */
@RestController
class AttachmentController {

    private final AttachmentService service;

    AttachmentController(AttachmentService service) {
        this.service = service;
    }

    @Operation(operationId = "listMemberAttachments", summary = "Danh sách đính kèm của thành viên",
            description = "Chỉ các tài liệu (kind = DOCUMENT) gắn với thành viên, mới nhất trước. Ảnh đại diện nằm ở "
                    + "avatarUrl của hồ sơ.", tags = "members")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @GetMapping("/api/members/{id}/attachments")
    List<AttachmentResponse> listForMember(@PathVariable Long id) {
        return service.listForMember(id);
    }

    @Operation(operationId = "listCommonAttachments", summary = "Danh sách tài liệu chung", tags = "files")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/api/attachments/common")
    List<AttachmentResponse> listCommon() {
        return service.listCommon();
    }

    @Operation(operationId = "getAttachmentDownloadUrl", summary = "Tải tệp đính kèm", tags = "files",
            description = "Trả về URL tải có chữ ký ngắn hạn.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @GetMapping("/api/attachments/{id}/download")
    DownloadUrlResponse download(@PathVariable Long id) {
        return service.downloadUrl(id);
    }

    @Operation(operationId = "deleteAttachment", summary = "Xóa tệp đính kèm", tags = "files",
            description = "Chỉ Admin. Xóa cả trên Cloudinary (sau khi commit).")
    @ApiResponse(responseCode = "204", description = "Đã xóa")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @DeleteMapping("/api/attachments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        service.delete(current.userId(), id);
    }
}
