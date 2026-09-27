package vn.giapha.member.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;
import vn.giapha.member.dto.LinkRequestInput;
import vn.giapha.member.dto.LinkRequestResponse;
import vn.giapha.member.entity.LinkRequestStatus;
import vn.giapha.member.service.MemberLinkService;

/**
 * Yêu cầu liên kết "Tôi là ai". Gửi, xem của mình và tự hủy liên kết: mọi tài khoản đã duyệt. Hàng đợi, duyệt và từ chối:
 * chỉ Admin ({@link MemberLinkService} kiểm lại vai trò từ DB). Admin gán/hủy trực tiếp nằm ở
 * {@code /api/admin/accounts/{id}/member-link} (module auth).
 */
@RestController
@Tag(name = "member-links")
class LinkRequestController {

    private final MemberLinkService service;

    LinkRequestController(MemberLinkService service) {
        this.service = service;
    }

    @Operation(operationId = "listLinkRequests", summary = "Danh sách yêu cầu liên kết (Admin)",
            description = "Hàng đợi duyệt của Admin. Cũ nhất trước.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/link-requests")
    List<LinkRequestResponse> list(@Parameter(hidden = true) CurrentUser current,
            @RequestParam(required = false) LinkRequestStatus status) {
        return service.list(current.userId(), status);
    }

    @Operation(operationId = "createLinkRequest", summary = "Gửi yêu cầu \"Đây là tôi\"",
            description = "Tài khoản đã duyệt yêu cầu liên kết với một thành viên; Admin duyệt thì mới có hiệu lực. "
                    + "409 ACCOUNT_ALREADY_LINKED, MEMBER_ALREADY_LINKED, LINK_REQUEST_EXISTS.")
    @ApiResponse(responseCode = "201", description = "Đã gửi")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/api/link-requests")
    @ResponseStatus(HttpStatus.CREATED)
    LinkRequestResponse create(@Parameter(hidden = true) CurrentUser current,
            @Valid @RequestBody LinkRequestInput input) {
        return service.create(current.userId(), input.memberId());
    }

    @Operation(operationId = "myLinkRequests", summary = "Các yêu cầu liên kết của tôi",
            description = "Mới nhất trước, gồm mọi trạng thái.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/api/link-requests/mine")
    List<LinkRequestResponse> mine(@Parameter(hidden = true) CurrentUser current) {
        return service.mine(current.userId());
    }

    @Operation(operationId = "approveLinkRequest", summary = "Duyệt yêu cầu liên kết (Admin)",
            description = "Gán user.member_id. Nếu hồ sơ chưa có email thì chép email tài khoản sang (một lần, "
                    + "DECISIONS #81). 404 LINK_REQUEST_NOT_FOUND; 409 LINK_REQUEST_NOT_PENDING, MEMBER_ALREADY_LINKED, "
                    + "ACCOUNT_ALREADY_LINKED, INVALID_ACCOUNT_STATE.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/link-requests/{id}/approve")
    LinkRequestResponse approve(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.approve(current.userId(), id);
    }

    @Operation(operationId = "rejectLinkRequest", summary = "Từ chối yêu cầu liên kết (Admin)",
            description = "404 LINK_REQUEST_NOT_FOUND, 409 LINK_REQUEST_NOT_PENDING.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/link-requests/{id}/reject")
    LinkRequestResponse reject(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.reject(current.userId(), id);
    }

    @Operation(operationId = "unlinkMe", summary = "Tự hủy liên kết của tôi",
            description = "Gỡ user.member_id. Không xóa email đã chép sang hồ sơ. 409 NOT_LINKED khi chưa liên kết.")
    @ApiResponse(responseCode = "204", description = "Đã hủy liên kết")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @DeleteMapping("/api/me/member-link")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void unlinkMe(@Parameter(hidden = true) CurrentUser current) {
        service.unlinkMe(current.userId());
    }
}
