package vn.giapha.ai.service;

import java.util.List;
import java.util.Map;

/**
 * Nhà cung cấp mô hình AI (IDEA §10; DECISIONS #47), đặt sau interface này để đổi nhà cung cấp chỉ cần thêm một bản
 * cài đặt. {@link GeminiProvider} dùng thật ở prod, {@link FakeAiProvider} dùng ở dev và test (không tốn quota trả
 * phí, trả lời tất định để test tay lặp lại được).
 */
public interface AiProvider {

    /** Gọi một tool chỉ đọc (DECISIONS #73) theo tên, trả kết quả dạng JSON (map/list/giá trị nguyên thủy). */
    interface ToolExecutor {
        Map<String, Object> execute(String name, Map<String, Object> args);
    }

    /** Một lượt trong lịch sử chat. {@code role} là {@code "user"} hoặc {@code "model"}. */
    record Turn(String role, String text) {
    }

    /**
     * Trả lời một câu hỏi, tự gọi {@code tools} khi cần cho tới khi có câu trả lời cuối cùng (không lộ ra ngoài các
     * lượt gọi tool giữa chừng). Ném {@link vn.giapha.common.exception.BusinessException} 503 {@code AI_UNAVAILABLE}
     * khi mô hình lỗi hoặc chưa cấu hình.
     */
    String reply(String systemPrompt, List<Turn> history, String userMessage, ToolExecutor tools);
}
