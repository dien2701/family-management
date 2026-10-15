package vn.giapha.ai.dto;

import jakarta.validation.constraints.Size;

/** Trường nào {@code null} thì giữ nguyên. */
public record AiConversationUpdate(
        @Size(min = 1, max = 60, message = "Tên đoạn chat từ 1 đến 60 ký tự.") String title,
        Boolean pinned) {
}
