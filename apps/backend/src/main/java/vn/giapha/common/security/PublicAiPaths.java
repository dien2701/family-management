package vn.giapha.common.security;

import org.springframework.http.HttpMethod;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * Trợ lý AI mở cho khách và tài khoản chưa duyệt (DECISIONS #91): chỉ hỏi đáp và xem số lượt còn lại. Lịch sử và bản
 * nháp sự kiện vẫn bắt đăng nhập và duyệt. Dùng chung cho {@code SecurityConfig} (permitAll) và
 * {@link ApprovalGateFilter}, nhưng khác {@link PublicReadPaths}: tài khoản đã duyệt vẫn đi qua cổng duyệt đầy đủ
 * (kiểm DB khi ghi) nên tài khoản bị khóa không dùng AI được.
 */
public final class PublicAiPaths {

    public static final String CHAT = "/api/ai/chat";
    public static final String QUOTA = "/api/ai/quota";

    private PublicAiPaths() {
    }

    public static RequestMatcher matcher() {
        PathPatternRequestMatcher.Builder paths = PathPatternRequestMatcher.withDefaults();
        RequestMatcher chat = paths.matcher(HttpMethod.POST, CHAT);
        RequestMatcher quota = paths.matcher(HttpMethod.GET, QUOTA);
        return request -> chat.matches(request) || quota.matches(request);
    }
}
