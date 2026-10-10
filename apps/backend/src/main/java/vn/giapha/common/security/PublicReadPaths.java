package vn.giapha.common.security;

import org.springframework.http.HttpMethod;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * Các GET xem công khai (DECISIONS #88): khách và tài khoản chưa duyệt đều gọi được, thấy như User đã duyệt.
 * Dùng chung cho {@code SecurityConfig} (permitAll) và {@link ApprovalGateFilter} (bỏ cổng duyệt) để không chép hai nơi.
 * Liệt kê tường minh: đường dẫn mới mặc định vẫn bắt đăng nhập và duyệt. Không gồm tệp đính kèm, báo cáo, AI, file.
 */
public final class PublicReadPaths {

    public static final String[] GET_PATHS = {
            "/api/members",
            "/api/members/*",
            "/api/members/*/relatives",
            "/api/tree",
            "/api/events",
            "/api/events/*",
            "/api/calendar/convert",
            "/api/calendar/lunar-month-info",
            "/api/calendar/upcoming",
            "/api/calendar/month",
            "/api/calendar/recent",
            "/api/dashboard",
    };

    private PublicReadPaths() {
    }

    public static RequestMatcher matcher() {
        PathPatternRequestMatcher.Builder paths = PathPatternRequestMatcher.withDefaults();
        RequestMatcher[] matchers = new RequestMatcher[GET_PATHS.length];
        for (int i = 0; i < GET_PATHS.length; i++) {
            matchers[i] = paths.matcher(HttpMethod.GET, GET_PATHS[i]);
        }
        return request -> {
            for (RequestMatcher m : matchers) {
                if (m.matches(request)) {
                    return true;
                }
            }
            return false;
        };
    }
}
