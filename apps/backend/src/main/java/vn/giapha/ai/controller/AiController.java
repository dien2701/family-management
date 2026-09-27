package vn.giapha.ai.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import vn.giapha.ai.dto.AiChatRequest;
import vn.giapha.ai.dto.AiDraft;
import vn.giapha.ai.dto.AiMessageResponse;
import vn.giapha.ai.dto.AiQuota;
import vn.giapha.ai.service.AiChatService;
import vn.giapha.ai.service.AiDraftService;
import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;

/** Trợ lý AI (IDEA §10; DECISIONS #47, #73, #77). Tài khoản chưa duyệt bị {@code ApprovalGateFilter} chặn trước. */
@RestController
@RequestMapping("/api/ai")
@Tag(name = "ai")
class AiController {

    private final AiChatService chatService;
    private final AiDraftService draftService;

    AiController(AiChatService chatService, AiDraftService draftService) {
        this.chatService = chatService;
        this.draftService = draftService;
    }

    @Operation(operationId = "aiChat", summary = "Hỏi trợ lý AI (streaming SSE)")
    @ApiResponse(responseCode = "200", description = "Luồng sự kiện")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "429", ref = ApiRefs.TOO_MANY_REQUESTS)
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    SseEmitter chat(@Parameter(hidden = true) CurrentUser current, @Valid @RequestBody AiChatRequest request) {
        return chatService.chat(current, request);
    }

    @Operation(operationId = "getAiQuota", summary = "Số lượt hỏi còn lại hôm nay")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/quota")
    AiQuota quota(@Parameter(hidden = true) CurrentUser current) {
        return chatService.quota(current.userId(), current.isAdmin());
    }

    @Operation(operationId = "listAiMessages", summary = "Lịch sử trò chuyện của tài khoản hiện tại")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping("/messages")
    List<AiMessageResponse> messages(@Parameter(hidden = true) CurrentUser current,
            @RequestParam(defaultValue = "50") @Min(1) @Max(200) int limit) {
        return chatService.history(current.userId(), limit);
    }

    @Operation(operationId = "submitAiDraft", summary = "User gửi bản nháp của AI thành đề xuất sự kiện")
    @ApiResponse(responseCode = "200", description = "Thành công (bản nháp chuyển sang SUBMITTED)")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/drafts/{id}/submit")
    @ResponseStatus(HttpStatus.OK)
    AiDraft submit(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return draftService.submit(current.userId(), id);
    }

    @Operation(operationId = "applyAiDraft", summary = "Admin áp dụng thẳng bản nháp của AI vào sự kiện chung")
    @ApiResponse(responseCode = "200", description = "Thành công (bản nháp chuyển sang APPLIED)")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/drafts/{id}/apply")
    @ResponseStatus(HttpStatus.OK)
    AiDraft apply(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return draftService.apply(current.userId(), id);
    }
}
