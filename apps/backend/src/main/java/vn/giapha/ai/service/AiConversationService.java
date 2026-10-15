package vn.giapha.ai.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.ai.dto.AiConversationResponse;
import vn.giapha.ai.dto.AiConversationUpdate;
import vn.giapha.ai.entity.AiConversation;
import vn.giapha.ai.repository.AiConversationRepository;
import vn.giapha.common.exception.BusinessException;

/** Quản lý đoạn chat của tài khoản đã duyệt (DECISIONS #94). Mọi thao tác chỉ trên đoạn của chính tài khoản. */
@Service
public class AiConversationService {

    static final int MAX_CONVERSATIONS = 50;
    private static final int TITLE_MAX = 40;

    private final AiConversationRepository conversations;
    private final Clock clock;

    AiConversationService(AiConversationRepository conversations, Clock clock) {
        this.conversations = conversations;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<AiConversationResponse> list(Long accountId, String q) {
        String term = q == null ? "" : q.trim();
        List<AiConversation> rows = term.isEmpty()
                ? conversations.findByAccountIdOrderByPinnedDescUpdatedAtDesc(accountId)
                : conversations.search(accountId, term);
        return rows.stream().map(AiConversationResponse::of).toList();
    }

    @Transactional
    public AiConversationResponse update(Long accountId, Long id, AiConversationUpdate request) {
        AiConversation c = require(accountId, id);
        if (request.title() != null) {
            String title = request.title().strip();
            if (title.isEmpty()) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                        "Tên đoạn chat không được để trống.");
            }
            c.rename(title);
        }
        if (request.pinned() != null) {
            c.pin(request.pinned());
        }
        return AiConversationResponse.of(c);
    }

    @Transactional
    public void delete(Long accountId, Long id) {
        conversations.delete(require(accountId, id));
    }

    /**
     * Gọi trước khi mở luồng chat để lỗi trả về dạng HTTP thường: đoạn phải thuộc tài khoản, hoặc (đoạn mới) còn
     * chỗ, tức chưa đủ 50 đoạn hoặc còn đoạn không ghim để dọn.
     */
    @Transactional(readOnly = true)
    public void check(Long accountId, Long conversationId) {
        if (conversationId != null) {
            require(accountId, conversationId);
        } else if (conversations.countByAccountId(accountId) >= MAX_CONVERSATIONS
                && conversations.findFirstByAccountIdAndPinnedFalseOrderByUpdatedAtAsc(accountId).isEmpty()) {
            throw new BusinessException(HttpStatus.CONFLICT, "AI_CONVERSATION_LIMIT",
                    "Bạn đã ghim đủ " + MAX_CONVERSATIONS + " đoạn chat. Hãy bỏ ghim hoặc xóa bớt rồi tạo đoạn mới.");
        }
    }

    /** Đoạn mới từ câu hỏi đầu tiên; đủ 50 thì xóa đoạn không ghim có lần chat cuối cũ nhất. */
    @Transactional
    public AiConversation create(Long accountId, String firstMessage) {
        if (conversations.countByAccountId(accountId) >= MAX_CONVERSATIONS) {
            conversations.findFirstByAccountIdAndPinnedFalseOrderByUpdatedAtAsc(accountId)
                    .ifPresent(conversations::delete);
        }
        return conversations.save(new AiConversation(accountId, titleOf(firstMessage), Instant.now(clock)));
    }

    @Transactional
    public AiConversation touch(Long accountId, Long id) {
        AiConversation c = require(accountId, id);
        c.touch(Instant.now(clock));
        return c;
    }

    /** Dùng cho đọc tin nhắn: có đoạn và đúng chủ. */
    public AiConversation require(Long accountId, Long id) {
        return conversations.findByIdAndAccountId(id, accountId).orElseThrow(() -> new BusinessException(
                HttpStatus.NOT_FOUND, "AI_CONVERSATION_NOT_FOUND", "Không tìm thấy đoạn chat này."));
    }

    private static String titleOf(String message) {
        String flat = message.strip().replaceAll("\\s+", " ");
        return flat.length() <= TITLE_MAX ? flat : flat.substring(0, TITLE_MAX).stripTrailing() + "…";
    }
}
