package vn.giapha.common.security;

import org.springframework.http.HttpMethod;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * Các API Web Push công khai cho khách và tài khoản chưa duyệt (DECISIONS #89): khóa VAPID công khai và nhóm
 * {@code /api/push/guest}. Dùng chung cho {@code SecurityConfig} (permitAll) và {@link ApprovalGateFilter} (bỏ cổng
 * duyệt). Liệt kê tường minh theo cả phương thức; đường dẫn push khác (subscribe, release, test) vẫn bắt đăng nhập và
 * duyệt.
 */
public final class PublicPushPaths {

    public static final String PUBLIC_KEY = "/api/push/public-key";
    public static final String GUEST = "/api/push/guest";
    public static final String GUEST_LOOKUP = "/api/push/guest/lookup";

    private PublicPushPaths() {
    }

    public static RequestMatcher matcher() {
        PathPatternRequestMatcher.Builder paths = PathPatternRequestMatcher.withDefaults();
        RequestMatcher[] matchers = {
                paths.matcher(HttpMethod.GET, PUBLIC_KEY),
                paths.matcher(HttpMethod.PUT, GUEST),
                paths.matcher(HttpMethod.DELETE, GUEST),
                paths.matcher(HttpMethod.POST, GUEST_LOOKUP),
        };
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
