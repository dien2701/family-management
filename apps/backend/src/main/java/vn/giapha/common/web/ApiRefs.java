package vn.giapha.common.web;

/**
 * Tham chiếu tới các response lỗi dùng chung trong {@code shared/api/openapi.yaml} (mục {@code components/responses}),
 * dùng cho {@code @ApiResponse(ref = ...)} để tài liệu do springdoc sinh ra khớp hợp đồng. Khai báo thật ở
 * {@link vn.giapha.config.OpenApiConfig}.
 */
public final class ApiRefs {

    public static final String VALIDATION_ERROR = "#/components/responses/ValidationError";
    public static final String UNAUTHORIZED = "#/components/responses/Unauthorized";
    public static final String FORBIDDEN = "#/components/responses/Forbidden";
    public static final String NOT_FOUND = "#/components/responses/NotFound";
    public static final String CONFLICT = "#/components/responses/Conflict";
    public static final String TOO_MANY_REQUESTS = "#/components/responses/TooManyRequests";

    private ApiRefs() {
    }
}
