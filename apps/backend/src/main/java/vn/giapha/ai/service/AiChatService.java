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
import java.util.regex.Pattern;

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

    private static final RateLimiter.Policy BURST_POLICY = new RateLimiter.Policy("ai-chat-burst", 5,
            Duration.ofMinutes(1));

    private static final String SYSTEM_PROMPT = """
            Bạn là trợ lý AI của ứng dụng Tộc Phả, hỗ trợ tra cứu gia phả: thành viên, người thân, cây gia phả, \
            ngày giỗ, sinh nhật và sự kiện chung. Chỉ dùng dữ liệu trả về từ các tool được cung cấp, không tự bịa. \
            Bạn không được cấp quyền xem số điện thoại hay email của thành viên và không bao giờ hỏi chúng; nếu được hỏi, \
            nói rõ là bạn không được phép xem, hướng dẫn xem trong hồ sơ thành viên (chỉ Admin và chính chủ thấy), \
            và KHÔNG nói rằng hệ thống không lưu các thông tin đó. Khi người dùng muốn sửa \
            hồ sơ, người thân hoặc ảnh đại diện của chính họ, hãy hướng dẫn họ vào trang hồ sơ để tự sửa, không soạn \
            bản nháp. Khi người dùng muốn thêm, sửa hoặc xóa MỘT sự kiện chung, hãy gọi draftProposal để soạn bản \
            nháp (không tự ghi dữ liệu). Câu hỏi không liên quan tới gia phả, lịch hoặc sự kiện thì từ chối lịch sự \
            và gợi ý một vài câu có thể hỏi. Trả lời ngắn gọn bằng tiếng Việt.""";

    private static final String GUEST_NOTE = """

            Người hỏi là khách chưa đăng nhập: chỉ tra cứu, không soạn bản nháp. Nếu họ muốn thêm, sửa hoặc xóa sự \
            kiện, hướng dẫn họ đăng nhập (và chờ Admin duyệt) rồi hỏi lại.""";

    private static final Pattern DEVICE_ID = Pattern.compile("[A-Za-z0-9-]{16,64}");

    /** Dòng trạng thái hiện trong lúc Trợ lý gọi từng tool, trước khi có chữ đầu tiên. */
    private static final Map<String, String> TOOL_STATUS = Map.of(
            "searchMembers", "Đang tìm thành viên…",
            "getMember", "Đang xem hồ sơ thành viên…",
            "getRelatives", "Đang xem người thân…",
            "getTreePath", "Đang xem cây gia phả…",
            "upcomingEvents", "Đang xem sự kiện sắp tới…",
            "lunarConvert", "Đang đổi ngày âm dương…",
            "stats", "Đang tổng hợp số liệu…",
            "draftProposal", "Đang soạn bản nháp…");

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

    /**
     * Mở luồng SSE; 429 {@code AI_QUOTA_EXCEEDED} ném ngay ở đây (chưa mở luồng) khi đã hết lượt trong ngày.
     * {@code current} là {@code null} (khách) hoặc chưa duyệt (DECISIONS #91): tính lượt theo {@code deviceId}, giới
     * hạn dồn dập theo IP, không lưu lịch sử, không soạn bản nháp.
     */
    public SseEmitter chat(CurrentUser current, AiChatRequest request, String deviceId, String clientIp) {
        Long accountId = isAccount(current) ? current.userId() : null;
        String guestKey = accountId == null ? guestKey(deviceId, clientIp) : null;
        rateLimiter.acquireOrThrow(BURST_POLICY, accountId != null ? String.valueOf(accountId) : "ip:" + clientIp,
                "AI_RATE_LIMITED", "Bạn hỏi quá nhanh, vui lòng thử lại sau {seconds} giây.");
        AiQuota quotaAfter = accountId != null ? quotaService.checkAndIncrement(accountId, current.isAdmin())
                : quotaService.checkAndIncrementGuest(guestKey);

        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        Thread.startVirtualThread(() -> process(emitter, accountId, guestKey, request, quotaAfter));
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

    /** {@code current} là {@code null} (khách) hoặc chưa duyệt thì trả hạn mức khách theo {@code deviceId}. */
    public AiQuota quota(CurrentUser current, String deviceId, String clientIp) {
        return isAccount(current) ? quotaService.get(current.userId(), current.isAdmin())
                : quotaService.getGuest(guestKey(deviceId, clientIp));
    }

    // ---------- Nội bộ ----------

    /** Tài khoản đã duyệt mới có lượt, lịch sử và bản nháp riêng; còn lại tính như khách. */
    private static boolean isAccount(CurrentUser current) {
        return current != null && current.isApproved();
    }

    /** Mã thiết bị do FE sinh; thiếu hoặc sai dạng thì rơi về IP để vẫn có giới hạn. */
    private static String guestKey(String deviceId, String clientIp) {
        return deviceId != null && DEVICE_ID.matcher(deviceId).matches() ? "dev:" + deviceId : "ip:" + clientIp;
    }

    // accountId == null là khách: không lưu lịch sử, lấy ngữ cảnh từ request, không soạn bản nháp
    private void process(SseEmitter emitter, Long accountId, String guestKey, AiChatRequest request,
            AiQuota quotaAfter) {
        boolean guest = accountId == null;
        try {
            List<AiProvider.Turn> history = guest ? guestTurns(request) : loadTurns(accountId);
            AiToolExecutor executor = toolExecutorFactory.create(guest);
            String prompt = guest ? SYSTEM_PROMPT + GUEST_NOTE : SYSTEM_PROMPT;
            // Chữ nào có là phát ngay (DECISIONS #92); lưu tin nhắn chỉ sau khi trả lời xong để lỗi giữa chừng
            // không để lại câu hỏi mồ côi trong lịch sử
            // Báo trạng thái trong lúc chờ tra cứu (DECISIONS #92); gửi lỗi thì bỏ qua, token phía sau sẽ báo
            AiProvider.ToolExecutor tools = (name, args) -> {
                send(emitter, "status", Map.of("text", TOOL_STATUS.getOrDefault(name, "Đang tra cứu dữ liệu…")));
                return executor.execute(name, args);
            };
            String answer = provider.reply(prompt, history, request.message(), tools,
                    text -> {
                        // Người dùng đã đóng kết nối thì dừng luôn, khỏi tiếp tục tốn quota Gemini
                        if (!send(emitter, "token", Map.of("text", text))) {
                            throw new IllegalStateException("Client đã ngắt kết nối");
                        }
                    });

            if (!guest) {
                messageRepository.save(
                        new AiMessage(accountId, AiRole.USER, request.message(), null, Instant.now(clock)));
                AiMessage assistantRow = messageRepository
                        .save(new AiMessage(accountId, AiRole.ASSISTANT, answer, null, Instant.now(clock)));
                Optional<AiDraftRecord> draft = executor.lastDraft();
                if (draft.isPresent()) {
                    AiDraftRecord withId = draft.get().withId(assistantRow.getId());
                    assistantRow.changeDraft(json.writeValueAsString(withId));
                    messageRepository.save(assistantRow);
                    send(emitter, "draft", withId.toPublic());
                }
            }
            send(emitter, "done", quotaAfter);
            emitter.complete();
        } catch (BusinessException e) {
            refund(accountId, guestKey);
            send(emitter, "error", Map.of("code", e.getCode(), "message", e.getMessage()));
            emitter.complete();
        } catch (RuntimeException e) {
            refund(accountId, guestKey);
            send(emitter, "error", Map.of("code", "AI_UNAVAILABLE", "message",
                    "Trợ lý AI hiện chưa dùng được. Vui lòng thử lại sau."));
            emitter.complete();
        }
    }

    private void refund(Long accountId, String guestKey) {
        if (accountId != null) {
            quotaService.refund(accountId);
        } else {
            quotaService.refundGuest(guestKey);
        }
    }

    private static List<AiProvider.Turn> guestTurns(AiChatRequest request) {
        if (request.history() == null) {
            return List.of();
        }
        return request.history().stream().map(t -> new AiProvider.Turn(t.role(), t.text())).toList();
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

    /** @return {@code false} khi không gửi được (client đã đóng kết nối). */
    private static boolean send(SseEmitter emitter, String event, Object data) {
        try {
            emitter.send(SseEmitter.event().name(event).data(data));
            return true;
        } catch (IOException | IllegalStateException e) {
            emitter.completeWithError(e);
            return false;
        }
    }
}
