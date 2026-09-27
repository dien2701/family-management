package vn.giapha.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiChatRequest(
        @NotBlank(message = "Vui lòng nhập câu hỏi.")
        @Size(max = 1000, message = "Câu hỏi tối đa 1000 ký tự.") String message) {
}
