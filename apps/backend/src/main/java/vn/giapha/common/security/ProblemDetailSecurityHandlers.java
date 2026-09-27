package vn.giapha.common.security;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import tools.jackson.databind.json.JsonMapper;

/**
 * 401/403 sinh ra ở filter chain của Spring Security không đi qua {@code GlobalExceptionHandler},
 * nên ghi ProblemDetail cùng dạng ({@code code}, {@code errors[]}) để frontend đọc được.
 */
public class ProblemDetailSecurityHandlers implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final JsonMapper jsonMapper;

    public ProblemDetailSecurityHandlers(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException {
        write(response, HttpStatus.UNAUTHORIZED, "Chưa đăng nhập", "UNAUTHENTICATED",
                "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException {
        write(response, HttpStatus.FORBIDDEN, "Không có quyền", "FORBIDDEN",
                "Bạn không có quyền thực hiện thao tác này.");
    }

    /** Cũng dùng cho {@link ApprovalGateFilter} để 403 {@code ACCOUNT_NOT_APPROVED} cùng dạng với các lỗi khác. */
    public void write(HttpServletResponse response, HttpStatus status, String title, String code, String detail)
            throws IOException {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(title);
        pd.setProperty("code", code);
        pd.setProperty("errors", List.of());
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(jsonMapper.writeValueAsString(pd));
    }
}
