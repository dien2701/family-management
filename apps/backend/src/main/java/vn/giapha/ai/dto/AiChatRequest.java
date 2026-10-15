package vn.giapha.ai.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * {@code history} chỉ dùng cho khách (DECISIONS #91): khách không có lịch sử lưu ở server nên FE gửi kèm vài lượt
 * gần nhất của phiên. Tài khoản đã duyệt bỏ qua trường này, server tự tải lịch sử của đoạn chat {@code conversationId}
 * ({@code null}: mở đoạn mới, DECISIONS #94). Khách bỏ qua {@code conversationId}.
 */
public record AiChatRequest(
        @NotBlank(message = "Vui lòng nhập câu hỏi.")
        @Size(max = 1000, message = "Câu hỏi tối đa 1000 ký tự.") String message,
        @Size(max = 10, message = "Lịch sử tối đa 10 lượt.") List<@Valid Turn> history,
        Long conversationId) {

    public record Turn(
            @Pattern(regexp = "user|model", message = "Vai trò phải là user hoặc model.") String role,
            @NotBlank @Size(max = 2000, message = "Mỗi lượt tối đa 2000 ký tự.") String text) {
    }
}
