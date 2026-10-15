package vn.giapha.ai.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.Content;
import com.google.genai.types.FunctionCall;
import com.google.genai.types.FunctionDeclaration;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import com.google.genai.types.ThinkingConfig;
import com.google.genai.types.Tool;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.config.AppProperties;

/**
 * {@link AiProvider} thật bằng {@code com.google.genai} (IDEA §10; DECISIONS #47, #92). Gọi
 * {@code generateContentStream}: chữ nào có là phát ngay cho {@code AiChatService} đẩy SSE. Lời gọi tool nằm trong
 * luồng nên mỗi vòng gom hết lời gọi rồi chạy tool và gọi stream tiếp. Vòng lặp tool tối đa {@value #MAX_TOOL_CALLS}
 * lượt để tránh mô hình gọi tool vô hạn.
 */
@Component
@Profile("!dev & !test")
class GeminiProvider implements AiProvider {

    private static final Logger log = LoggerFactory.getLogger(GeminiProvider.class);
    private static final int MAX_TOOL_CALLS = 6;

    private final AppProperties.Ai config;
    // Dùng chung một Client (giữ kết nối HTTP/TLS) thay vì dựng lại mỗi câu hỏi
    private volatile Client client;

    GeminiProvider(AppProperties props) {
        this.config = props.ai();
    }

    private Client client() {
        Client c = client;
        if (c == null) {
            synchronized (this) {
                if (client == null) {
                    client = Client.builder().apiKey(config.geminiApiKey()).build();
                }
                c = client;
            }
        }
        return c;
    }

    @Override
    public String reply(String systemPrompt, List<Turn> history, String userMessage, ToolExecutor tools,
            Consumer<String> onToken) {
        if (config.geminiApiKey().isBlank()) {
            throw unavailable();
        }
        try {
            long startedAt = System.nanoTime();
            long[] firstTokenAt = { 0 };
            Client client = client();
            GenerateContentConfig.Builder genBuilder = GenerateContentConfig.builder()
                    .systemInstruction(Content.fromParts(Part.fromText(systemPrompt)))
                    .tools(Tool.builder().functionDeclarations(toolDeclarations()));
            // Tra cứu bằng tool không cần suy nghĩ dài; tắt đi tiết kiệm vài giây mỗi vòng gọi. Chỉ gửi cho họ
            // 2.5 Flash: các mô hình khác (Pro, 2.0, 3.x) không nhận ngân sách 0 và trả 400 INVALID_ARGUMENT
            if (config.thinkingBudget() >= 0 && config.model().startsWith("gemini-2.5-flash")) {
                genBuilder.thinkingConfig(ThinkingConfig.builder().thinkingBudget(config.thinkingBudget()).build());
            }
            GenerateContentConfig genConfig = genBuilder.build();

            List<Content> contents = new ArrayList<>();
            for (Turn turn : history) {
                contents.add(Content.builder().role(turn.role()).parts(Part.fromText(turn.text())).build());
            }
            contents.add(Content.builder().role("user").parts(Part.fromText(userMessage)).build());

            StringBuilder answer = new StringBuilder();
            for (int round = 0;; round++) {
                // Mỗi vòng là một lần gọi stream: chữ phát ngay, lời gọi tool gom lại rồi chạy sau khi hết luồng
                List<Part> modelParts = new ArrayList<>();
                List<FunctionCall> calls = new ArrayList<>();
                boolean needBreak = answer.length() > 0;
                try (ResponseStream<GenerateContentResponse> stream = client.models
                        .generateContentStream(config.model(), contents, genConfig)) {
                    for (GenerateContentResponse chunk : stream) {
                        List<Part> parts = chunk.parts();
                        if (parts == null) {
                            continue;
                        }
                        for (Part part : parts) {
                            // Chunk cuối của luồng hay có part chữ rỗng; gửi lại part rỗng cho Gemini là 400
                            boolean emptyText = part.functionCall().isEmpty()
                                    && part.text().map(String::isEmpty).orElse(false);
                            if (!emptyText) {
                                modelParts.add(part);
                            }
                            part.functionCall().ifPresent(calls::add);
                            // Chữ suy nghĩ (thought) không phát cho người dùng
                            boolean thought = part.thought().orElse(false);
                            String piece = part.text().orElse("");
                            if (!thought && !piece.isEmpty()) {
                                // Có lời dẫn trước khi gọi tool ở vòng trước thì tách đoạn, khỏi dính liền câu trả lời
                                String out = needBreak ? "\n\n" + piece : piece;
                                needBreak = false;
                                if (firstTokenAt[0] == 0) {
                                    firstTokenAt[0] = System.nanoTime();
                                }
                                answer.append(out);
                                onToken.accept(out);
                            }
                        }
                    }
                }
                if (calls.isEmpty() || round >= MAX_TOOL_CALLS) {
                    break;
                }
                contents.add(Content.builder().role("model").parts(modelParts).build());
                List<Part> toolResults = new ArrayList<>();
                for (FunctionCall call : calls) {
                    String name = call.name().orElse("");
                    Map<String, Object> args = call.args().orElse(Map.of());
                    Map<String, Object> result = tools.execute(name, args);
                    toolResults.add(Part.fromFunctionResponse(name, result));
                }
                // API hiện hành chỉ nhận role user/model; role "function" (kiểu cũ) bị trả 400 INVALID_ARGUMENT
                contents.add(Content.builder().role("user").parts(toolResults).build());
            }
            if (answer.toString().isBlank()) {
                throw unavailable();
            }
            long now = System.nanoTime();
            log.info("Gemini trả lời: chữ đầu sau {} ms, xong sau {} ms ({} ký tự, model {})",
                    firstTokenAt[0] == 0 ? -1 : (firstTokenAt[0] - startedAt) / 1_000_000,
                    (now - startedAt) / 1_000_000, answer.length(), config.model());
            return answer.toString();
        } catch (BusinessException e) {
            throw e;
        } catch (RuntimeException e) {
            // Trước đây nuốt hết nên không biết Gemini từ chối vì sao (khóa sai, hết quota, sai model...)
            log.warn("Gemini lỗi (model {}, suy nghĩ {}): {} {}", config.model(), config.thinkingBudget(),
                    e.getClass().getSimpleName(), e.getMessage());
            throw unavailable();
        }
    }

    private static BusinessException unavailable() {
        return new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "AI_UNAVAILABLE",
                "Trợ lý AI hiện chưa dùng được. Vui lòng thử lại sau.");
    }

    private static List<FunctionDeclaration> toolDeclarations() {
        return List.of(
                FunctionDeclaration.builder().name("searchMembers")
                        .description("Tìm thành viên theo họ tên, không cần gõ dấu.")
                        .parametersJsonSchema(schema(Map.of("query", type("string")), List.of("query"))).build(),
                FunctionDeclaration.builder().name("getMember")
                        .description("Chi tiết một thành viên theo id (không có SĐT hay email).")
                        .parametersJsonSchema(schema(Map.of("memberId", type("integer")), List.of("memberId")))
                        .build(),
                FunctionDeclaration.builder().name("getRelatives")
                        .description(
                                "Người thân trong hồ sơ của một thành viên, cộng với cha mẹ, vợ chồng, con theo cây gia phả.")
                        .parametersJsonSchema(schema(Map.of("memberId", type("integer")), List.of("memberId")))
                        .build(),
                FunctionDeclaration.builder().name("getTreePath")
                        .description("Tổ tiên và con cháu trên cây gia phả của một thành viên.")
                        .parametersJsonSchema(schema(Map.of("memberId", type("integer")), List.of("memberId")))
                        .build(),
                FunctionDeclaration.builder().name("upcomingEvents")
                        .description("Giỗ, sinh nhật và sự kiện chung trong 30 ngày tới.")
                        .parametersJsonSchema(schema(Map.of(), List.of())).build(),
                FunctionDeclaration.builder().name("lunarConvert")
                        .description("Đổi một ngày âm lịch sang dương lịch, hoặc dương lịch sang âm lịch.")
                        .parametersJsonSchema(schema(
                                Map.of("direction", enumType("string", "TO_LUNAR", "TO_SOLAR"), "year",
                                        type("integer"), "month", type("integer"), "day", type("integer"), "leap",
                                        type("boolean")),
                                List.of("direction", "year", "month", "day")))
                        .build(),
                FunctionDeclaration.builder().name("stats")
                        .description(
                                "Số liệu tổng quan: tổng thành viên, còn sống/đã mất, số người trên cây, đời sâu nhất.")
                        .parametersJsonSchema(schema(Map.of(), List.of())).build(),
                FunctionDeclaration.builder().name("draftProposal")
                        .description(
                                "Soạn bản nháp đề xuất thêm, sửa hoặc xóa MỘT sự kiện chung. Không áp dụng ngay, không ghi dữ liệu.")
                        .parametersJsonSchema(schema(
                                Map.ofEntries(
                                        Map.entry("action", enumType("string", "CREATE", "UPDATE", "DELETE")),
                                        Map.entry("eventId", type("integer")),
                                        Map.entry("title", type("string")),
                                        Map.entry("description", type("string")),
                                        Map.entry("calendar", enumType("string", "SOLAR", "LUNAR")),
                                        Map.entry("day", type("integer")),
                                        Map.entry("month", type("integer")),
                                        Map.entry("year", type("integer")),
                                        Map.entry("leap", type("boolean"))),
                                List.of("action")))
                        .build());
    }

    private static Map<String, Object> schema(Map<String, Object> properties, List<String> required) {
        return required.isEmpty()
                ? Map.of("type", "object", "properties", properties)
                : Map.of("type", "object", "properties", properties, "required", required);
    }

    private static Map<String, Object> type(String jsonType) {
        return Map.of("type", jsonType);
    }

    private static Map<String, Object> enumType(String jsonType, String... values) {
        return Map.of("type", jsonType, "enum", List.of(values));
    }
}
