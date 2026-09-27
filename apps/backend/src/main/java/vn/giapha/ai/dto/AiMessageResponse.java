package vn.giapha.ai.dto;

import java.time.Instant;

import vn.giapha.ai.entity.AiRole;

public record AiMessageResponse(Long id, AiRole role, String content, AiDraft draft, Instant createdAt) {
}
