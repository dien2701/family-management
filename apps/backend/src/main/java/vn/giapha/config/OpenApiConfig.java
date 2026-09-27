package vn.giapha.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.ArraySchema;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.IntegerSchema;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Khung tài liệu API. Các response lỗi dùng chung và schema {@code ProblemDetail} khai báo ở đây để tên và hình dạng
 * giống mục {@code components} của {@code shared/api/openapi.yaml} (DECISIONS #70).
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER = "bearerAuth";
    private static final String PROBLEM_JSON = "application/problem+json";

    @Bean
    OpenAPI giaPhaOpenApi() {
        return new OpenAPI()
                .info(new Info().title("Tộc Phả API").version("v2"))
                .components(new Components()
                        .addSecuritySchemes(BEARER,
                                new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT"))
                        .addSchemas("FieldError", fieldError())
                        .addSchemas("ProblemDetail", problemDetail())
                        .addResponses("ValidationError", problem(
                                "Dữ liệu không hợp lệ (`VALIDATION_ERROR`, `MALFORMED_REQUEST`, lỗi lịch âm...)"))
                        .addResponses("Unauthorized", problem(
                                "Chưa đăng nhập, phiên hết hạn hoặc sai thông tin đăng nhập (`UNAUTHENTICATED`, "
                                        + "`INVALID_CREDENTIALS`...)"))
                        .addResponses("Forbidden", problem(
                                "Không có quyền (`FORBIDDEN`), tài khoản chưa được duyệt (`ACCOUNT_NOT_APPROVED`) "
                                        + "hoặc bị khóa (`ACCOUNT_LOCKED`)"))
                        .addResponses("NotFound", problem(
                                "Không tìm thấy (`ACCOUNT_NOT_FOUND`, `MEMBER_NOT_FOUND`, `EVENT_NOT_FOUND`, "
                                        + "`TREE_NODE_NOT_FOUND`, `RELATIVE_NOT_FOUND`, `LINK_REQUEST_NOT_FOUND`)"))
                        .addResponses("Conflict", problem(
                                "Xung đột trạng thái (`SELF_ACTION_FORBIDDEN`, `LAST_ADMIN`, `INVALID_ACCOUNT_STATE`, "
                                        + "`MEMBER_ON_TREE`, `RELATIVE_EXISTS`, `MEMBER_ALREADY_LINKED`, "
                                        + "`ACCOUNT_ALREADY_LINKED`, `LINK_REQUEST_EXISTS`, `LINK_REQUEST_NOT_PENDING`, "
                                        + "`NOT_LINKED`, các mã cây `MEMBER_ALREADY_ON_TREE`, `TREE_*`)"))
                        .addResponses("TooManyRequests", problem(
                                "Vượt giới hạn tần suất hoặc tài khoản bị khóa đăng nhập tạm (`LOGIN_LOCKED`, "
                                        + "`RATE_LIMITED`, `OTP_RATE_LIMITED`)")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER));
    }

    private static ApiResponse problem(String description) {
        return new ApiResponse().description(description).content(new Content().addMediaType(PROBLEM_JSON,
                new MediaType().schema(new Schema<>().$ref("#/components/schemas/ProblemDetail"))));
    }

    private static Schema<?> fieldError() {
        return new ObjectSchema()
                .addProperty("field", new StringSchema())
                .addProperty("message", new StringSchema())
                .addRequiredItem("field")
                .addRequiredItem("message");
    }

    private static Schema<?> problemDetail() {
        return new ObjectSchema()
                .description("Lỗi theo RFC 9457; `detail` là thông báo tiếng Việt hiển thị được cho người dùng.")
                .addProperty("type", new StringSchema())
                .addProperty("title", new StringSchema())
                .addProperty("status", new IntegerSchema())
                .addProperty("detail", new StringSchema())
                .addProperty("instance", new StringSchema())
                .addProperty("code", new StringSchema()
                        .description("Mã lỗi máy đọc được, ví dụ `ACCOUNT_NOT_APPROVED`, `MEMBER_NOT_FOUND`."))
                .addProperty("errors", new ArraySchema()
                        .description("Lỗi theo từng trường (chỉ có khi `code = VALIDATION_ERROR` hoặc lỗi lịch âm).")
                        .items(new Schema<>().$ref("#/components/schemas/FieldError")));
    }
}
