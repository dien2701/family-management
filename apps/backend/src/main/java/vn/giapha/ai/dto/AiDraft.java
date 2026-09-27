package vn.giapha.ai.dto;

import java.util.List;

/** Thẻ xem trước đề xuất sự kiện chung do AI soạn ({@code draftProposal}, DECISIONS #77). Hình dạng công khai qua API. */
public record AiDraft(Long id, AiDraftAction action, Long eventId, String eventTitle, List<AiDraftChange> changes,
        AiDraftStatus status) {
}
