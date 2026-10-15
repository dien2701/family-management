package vn.giapha.ai.dto;

import java.time.Instant;

import vn.giapha.ai.entity.AiConversation;

public record AiConversationResponse(Long id, String title, boolean pinned, Instant updatedAt) {

    public static AiConversationResponse of(AiConversation c) {
        return new AiConversationResponse(c.getId(), c.getTitle(), c.isPinned(), c.getUpdatedAt());
    }
}
