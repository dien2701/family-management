package vn.giapha.proposal.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;
import vn.giapha.common.web.SimplePage;
import vn.giapha.proposal.dto.ApproveProposalRequest;
import vn.giapha.proposal.dto.ProposalInput;
import vn.giapha.proposal.dto.ProposalResponse;
import vn.giapha.proposal.dto.RejectProposalRequest;
import vn.giapha.proposal.service.ProposalService;

/**
 * Đề xuất sự kiện chung (IDEA §6.6, DECISIONS #77). Mọi tài khoản đã duyệt gửi được; danh sách chờ duyệt, duyệt và
 * từ chối chỉ Admin, do {@link ProposalService} kiểm lại từ DB.
 */
@RestController
@RequestMapping("/api/proposals")
@Tag(name = "proposals")
class ProposalController {

    private final ProposalService service;

    ProposalController(ProposalService service) {
        this.service = service;
    }

    @Operation(operationId = "createProposal", summary = "Đề xuất thêm/sửa/xóa sự kiện chung",
            description = "Không cần liên kết \"Tôi là ai\". Server tự tính base_updated_at của sự kiện đích (nếu "
                    + "có) và validate payload bằng đúng quy tắc của POST/PUT /api/events.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @PostMapping
    ProposalResponse create(@Parameter(hidden = true) CurrentUser current, @Valid @RequestBody ProposalInput input) {
        return service.create(current.userId(), input);
    }

    @Operation(operationId = "getProposals", summary = "(Admin) Danh sách đề xuất chờ duyệt (hoặc tất cả)")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping
    SimplePage<ProposalResponse> list(@Parameter(hidden = true) CurrentUser current,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") @Min(value = 1, message = "Trang phải từ 1.") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Số dòng mỗi trang phải từ 1.") int size) {
        return service.list(current.userId(), status, page, size);
    }

    @Operation(operationId = "getMyProposals", summary = "Danh sách đề xuất của tôi")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/mine")
    SimplePage<ProposalResponse> mine(@Parameter(hidden = true) CurrentUser current,
            @RequestParam(defaultValue = "1") @Min(value = 1, message = "Trang phải từ 1.") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Số dòng mỗi trang phải từ 1.") int size) {
        return service.mine(current.userId(), page, size);
    }

    @Operation(operationId = "countPendingProposals", summary = "(Admin) Đếm số lượng đề xuất đang chờ")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/count")
    int count(@Parameter(hidden = true) CurrentUser current) {
        return (int) service.countPending(current.userId());
    }

    @Operation(operationId = "approveProposal", summary = "(Admin) Duyệt đề xuất",
            description = "Áp dụng qua module event trong cùng transaction. Lỗi: 404 PROPOSAL_NOT_FOUND, 409 "
                    + "PROPOSAL_ALREADY_REVIEWED.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/{id}/approve")
    @ResponseStatus(HttpStatus.OK)
    void approve(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @RequestBody(required = false) ApproveProposalRequest req) {
        service.approve(current.userId(), id, req);
    }

    @Operation(operationId = "rejectProposal", summary = "(Admin) Từ chối đề xuất",
            description = "Lỗi: 404 PROPOSAL_NOT_FOUND, 409 PROPOSAL_ALREADY_REVIEWED.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/{id}/reject")
    @ResponseStatus(HttpStatus.OK)
    void reject(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @Valid @RequestBody RejectProposalRequest req) {
        service.reject(current.userId(), id, req);
    }
}
