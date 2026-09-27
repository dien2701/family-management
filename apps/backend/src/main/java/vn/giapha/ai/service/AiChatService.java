package vn.giapha.ai.service;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.ai.dto.AiChatRequest;
import vn.giapha.ai.dto.AiDraft;
import vn.giapha.ai.dto.AiDraftRecord;
import vn.giapha.ai.dto.AiMessageResponse;
import vn.giapha.ai.dto.AiQuota;
import vn.giapha.ai.entity.AiMessage;
import vn.giapha.ai.entity.AiRole;
import vn.giapha.ai.repository.AiMessageRepository;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.security.RateLimiter;

/**
 * Điều phối một lượt hỏi AI (IDEA §10; DECISIONS #47, #73): kiểm quota rồi tăng, tải lịch sử, gọi {@link AiProvider}
 * (tự gọi tool qua {@link AiToolExecutor}), lưu tin nhắn, phát SSE ({@code token}/{@code draft}/{@code done}/
 * {@code error}). Chạy trên luồng ảo riêng để không giữ luồng servlet trong lúc gọi mô hình.
 */
@Service
public class AiChatService {

    private static final int HISTORY_LIMIT = 20;
    private static final long EMITTER_TIMEOUT_MS = 60_000L;
    private static final int CHUNK_SIZE = 24;

    private static final RateLimiter.Policy BURST_POLICY = new RateLimiter.Policy("ai-chat-burst", 5,
            Duration.ofMinutes(1));

    private static final String SYSTEM_PROMPT = """
            Bạn là trợ lý AI của ứng dụng Tộc Phả, hỗ trợ tra cứu gia phả: thành viên, người thân, cây gia phả, \
            ngày giỗ, sinh nhật và sự kiện chung. Chỉ dùng dữ liệu trả về từ các tool được cung cấp, không tự bịa. \
            Không bao giờ có và không bao giờ hỏi số điện thoại hay email của thành viên. Khi người dùng muốn sửa \
            hồ sơ, người thân hoặc ảnh đại diện của chính họ, hãy hướng dẫn họ vào trang hồ sơ để tự sửa, không soạn \
            bản nháp. Khi người dùng muốn thêm, sửa hoặc xóa MỘT sự kiện chung, hãy gọi draftProposal để soạn bản \
            nháp (không tự ghi dữ liệu). Câu hỏi không liên quan tới gia phả, lịch hoặc sự kiện thì từ chối lịch sự \
            và gợi ý một vài câu có thể hỏi. Trả lời ngắn gọn bằng tiếng Việt.""";

    private final AiMessageRepository messageRepository;
    private final AiQuotaService quotaService;
    private final AiToolExecutorFactory toolExecutorFactory;
    private final AiProvider provider;
    private final RateLimiter rateLimiter;
    private final JsonMapper json;
    private final Clock clock;

    AiChatService(AiMessageRepository messageRepository, AiQuotaService quotaService,
            AiToolExecutorFactory toolExecutorFactory, AiProvider provider, RateLimiter rateLimiter, JsonMapper json,
            Clock clock) {
        this.messageRepository = messageRepository;
        this.quotaService = quotaService;
        this.toolExecutorFactory = toolExecutorFactory;
        this.provider = provider;
        this.rateLimiter = rateLimiter;
        this.json = json;
        this.clock = clock;
    }

    /** Mở luồng SSE; 429 {@code AI_QUOTA_EXCEEDED} ném ngay ở đây (chưa mở luồng) khi đã hết lượt trong ngày. */
    public SseEmitter chat(CurrentUser current, AiChatRequest request) {
        Long accountId = current.userId();
        boolean admin = current.isAdmin();
        rateLimiter.acquireOrThrow(BURST_POLICY, String.valueOf(accountId), "AI_RATE_LIMITED",
                "Bạn hỏi quá nhanh, vui lòng thử lại sau {seconds} giây.");
        AiQuota quotaAfter = quotaService.checkAndIncrement(accountId, admin);

        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        Thread.startVirtualThread(() -> process(emitter, accountId, request, quotaAfter));
        return emitter;
    }

    /** Lịch sử trò chuyện, cũ trước (Đợt 36–37: {@code GET /api/ai/messages}). */
    public List<AiMessageResponse> history(Long accountId, int limit) {
        List<AiMessage> rows = messageRepository.findByAccountIdOrderByCreatedAtDesc(accountId,
                PageRequest.of(0, limit));
        List<AiMessage> chronological = new ArrayList<>(rows);
        Collections.reverse(chronological);
        return chronological.stream().map(this::toResponse).toList();
    }

    public AiQuota quota(Long accountId, boolean admin) {
        return quotaService.get(accountId, admin);
    }

    // ---------- Nội bộ ----------

    private void process(SseEmitter emitter, Long accountId, AiChatRequest request, AiQuota quotaAfter) {
        try {
            List<AiProvider.Turn> history = loadTurns(accountId);
            AiToolExecutor executor = toolExecutorFactory.create();
            String answer = provider.reply(SYSTEM_PROMPT, history, request.message(), executor);

            Instant now = Instant.now(clock);
            messageRepository.save(new AiMessage(accountId, AiRole.USER, request.message(), null, now));

            for (String chunk : chunk(answer)) {
                send(emitter, "token", Map.of("text", chunk));
            }

            AiMessage assistantRow = messageRepository
                    .save(new AiMessage(accountId, AiRole.ASSISTANT, answer, null, Instant.now(clock)));
            Optional<AiDraftRecord> draft = executor.lastDraft();
            if (draft.isPresent()) {
                AiDraftRecord withId = draft.get().withId(assistantRow.getId());
                assistantRow.changeDraft(json.writeValueAsString(withId));
                messageRepository.save(assistantRow);
                send(emitter, "draft", withId.toPublic());
            }
            send(emitter, "done", quotaAfter);
            emitter.complete();
        } catch (BusinessException e) {
            send(emitter, "error", Map.of("code", e.getCode(), "message", e.getMessage()));
            emitter.complete();
        } catch (RuntimeException e) {
            send(emitter, "error", Map.of("code", "AI_UNAVAILABLE", "message",
                    "Trợ lý AI hiện chưa dùng được. Vui lòng thử lại sau."));
            emitter.complete();
        }
    }

    private List<AiProvider.Turn> loadTurns(Long accountId) {
        List<AiMessage> rows = messageRepository.findByAccountIdOrderByCreatedAtDesc(accountId,
                PageRequest.of(0, HISTORY_LIMIT));
        List<AiMessage> chronological = new ArrayList<>(rows);
        Collections.reverse(chronological);
        return chronological.stream()
                .map(m -> new AiProvider.Turn(m.getRole() == AiRole.USER ? "user" : "model", m.getContent()))
                .toList();
    }

    private AiMessageResponse toResponse(AiMessage m) {
        AiDraft draft = m.getDraftJson() == null ? null
                : json.readValue(m.getDraftJson(), AiDraftRecord.class).toPublic();
        return new AiMessageResponse(m.getId(), m.getRole(), m.getContent(), draft, m.getCreatedAt());
    }

    private static List<String> chunk(String text) {
        List<String> parts = new ArrayList<>();
        for (int i = 0; i < text.length(); i += CHUNK_SIZE) {
            parts.add(text.substring(i, Math.min(text.length(), i + CHUNK_SIZE)));
        }
        return parts.isEmpty() ? List.of(text) : parts;
    }

    private static void send(SseEmitter emitter, String event, Object data) {
        try {
            emitter.send(SseEmitter.event().name(event).data(data));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
    }
}
