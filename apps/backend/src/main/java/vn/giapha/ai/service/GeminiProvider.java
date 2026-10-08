package vn.giapha.ai.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.FunctionCall;
import com.google.genai.types.FunctionDeclaration;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import com.google.genai.types.Tool;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.config.AppProperties;

/**
 * {@link AiProvider} thật bằng {@code com.google.genai} (IDEA §10; DECISIONS #47). Gọi {@code generateContent}
 * không streaming (Gemini Developer API không đảm bảo stream cùng lúc với function calling ở mọi phiên bản mô
 * hình): {@code AiChatService} tự chia câu trả lời cuối cùng thành từng đoạn để phát SSE. Vòng lặp tool tối đa
 * {@value #MAX_TOOL_CALLS} lượt để tránh mô hình gọi tool vô hạn.
 */
@Component
@Profile("!dev & !test")
class GeminiProvider implements AiProvider {

    private static final Logger log = LoggerFactory.getLogger(GeminiProvider.class);
    private static final int MAX_TOOL_CALLS = 6;

    private final AppProperties.Ai config;

    GeminiProvider(AppProperties props) {
        this.config = props.ai();
    }

    @Override
    public String reply(String systemPrompt, List<Turn> history, String userMessage, ToolExecutor tools) {
        if (config.geminiApiKey().isBlank()) {
            throw unavailable();
        }
        try {
            Client client = Client.builder().apiKey(config.geminiApiKey()).build();
            GenerateContentConfig genConfig = GenerateContentConfig.builder()
                    .systemInstruction(Content.fromParts(Part.fromText(systemPrompt)))
                    .tools(Tool.builder().functionDeclarations(toolDeclarations()))
                    .build();

            List<Content> contents = new ArrayList<>();
            for (Turn turn : history) {
                contents.add(Content.builder().role(turn.role()).parts(Part.fromText(turn.text())).build());
            }
            contents.add(Content.builder().role("user").parts(Part.fromText(userMessage)).build());

            GenerateContentResponse response = client.models.generateContent(config.model(), contents, genConfig);
            int guard = 0;
            while (response.functionCalls() != null && !response.functionCalls().isEmpty()
                    && guard++ < MAX_TOOL_CALLS) {
                List<Part> modelParts = response.parts();
                contents.add(Content.builder().role("model").parts(modelParts == null ? List.of() : modelParts)
                        .build());
                List<Part> toolResults = new ArrayList<>();
                for (FunctionCall call : response.functionCalls()) {
                    String name = call.name().orElse("");
                    Map<String, Object> args = call.args().orElse(Map.of());
                    Map<String, Object> result = tools.execute(name, args);
                    toolResults.add(Part.fromFunctionResponse(name, result));
                }
                // API hiện hành chỉ nhận role user/model; role "function" (kiểu cũ) bị trả 400 INVALID_ARGUMENT
                contents.add(Content.builder().role("user").parts(toolResults).build());
                response = client.models.generateContent(config.model(), contents, genConfig);
            }
            String text = response.text();
            if (text == null || text.isBlank()) {
                throw unavailable();
            }
            return text;
        } catch (BusinessException e) {
            throw e;
        } catch (RuntimeException e) {
            // Trước đây nuốt hết nên không biết Gemini từ chối vì sao (khóa sai, hết quota, sai model...)
            log.warn("Gemini lỗi ({}): {}", e.getClass().getSimpleName(), e.getMessage());
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
