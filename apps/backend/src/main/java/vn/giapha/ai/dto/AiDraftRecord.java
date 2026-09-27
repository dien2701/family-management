package vn.giapha.ai.dto;

import java.util.List;
import java.util.Map;

/**
 * Toàn bộ dữ liệu của một bản nháp, lưu trong {@code ai_message.draft_json} (id chính là id dòng tin nhắn).
 * {@code payload} là {@code CustomEventInput} để áp dụng thật khi submit/apply; {@code null} khi {@code action =
 * DELETE}. Không trả thẳng ra API: {@link #toPublic()} bỏ {@code payload}.
 */
public record AiDraftRecord(Long id, AiDraftAction action, Long eventId, String eventTitle,
        List<AiDraftChange> changes, AiDraftStatus status, Map<String, Object> payload) {

    public AiDraftRecord withStatus(AiDraftStatus newStatus) {
        return new AiDraftRecord(id, action, eventId, eventTitle, changes, newStatus, payload);
    }

    public AiDraftRecord withId(Long newId) {
        return new AiDraftRecord(newId, action, eventId, eventTitle, changes, status, payload);
    }

    public AiDraft toPublic() {
        return new AiDraft(id, action, eventId, eventTitle, changes, status);
    }
}
