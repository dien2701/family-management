package vn.giapha.common.security;

import java.io.IOException;
import java.util.Set;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Chặn mọi API với tài khoản chưa được duyệt (403 {@code ACCOUNT_NOT_APPROVED}, DECISIONS #56).
 * Chỉ {@code /api/auth/**}, {@code GET /api/me}, {@code POST /api/me/consent} và các GET trong {@link PublicReadPaths}
 * được miễn; đường dẫn mới mặc định bị chặn.
 *
 * <p>Request đọc tin claim {@code approval} của access token (tối đa 15 phút cũ). Request ghi kiểm lại từ DB,
 * nên tài khoản vừa bị từ chối hoặc khóa không ghi được nữa dù token còn hạn.
 */
public class ApprovalGateFilter extends OncePerRequestFilter {

    private static final Set<String> READ_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    private final AccountAccessLookup lookup;
    private final ProblemDetailSecurityHandlers problems;
    private final RequestMatcher exempt;

    public ApprovalGateFilter(AccountAccessLookup lookup, ProblemDetailSecurityHandlers problems) {
        this.lookup = lookup;
        this.problems = problems;
        PathPatternRequestMatcher.Builder paths = PathPatternRequestMatcher.withDefaults();
        RequestMatcher auth = paths.matcher("/api/auth/**");
        RequestMatcher me = paths.matcher(HttpMethod.GET, "/api/me");
        RequestMatcher consent = paths.matcher(HttpMethod.POST, "/api/me/consent");
        // GET xem công khai (DECISIONS #88): tài khoản chưa duyệt đi qua như khách, cùng danh sách với SecurityConfig
        RequestMatcher publicRead = PublicReadPaths.matcher();
        this.exempt = request -> auth.matches(request) || me.matches(request) || consent.matches(request)
                || publicRead.matches(request);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // Chưa đăng nhập: để bước phân quyền phía sau trả 401
        if (!(auth != null && auth.getPrincipal() instanceof Jwt jwt) || exempt.matches(request)) {
            chain.doFilter(request, response);
            return;
        }
        CurrentUser user = CurrentUser.from(jwt);
        if (!user.isApproved()) {
            notApproved(response);
            return;
        }
        if (!READ_METHODS.contains(request.getMethod())) {
            switch (lookup.accessOf(user.userId())) {
                case OK -> {
                }
                case NOT_APPROVED -> {
                    notApproved(response);
                    return;
                }
                case LOCKED -> {
                    problems.write(response, HttpStatus.FORBIDDEN, "Không có quyền", "ACCOUNT_LOCKED",
                            "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
                    return;
                }
                case GONE -> {
                    problems.write(response, HttpStatus.UNAUTHORIZED, "Chưa đăng nhập", "UNAUTHENTICATED",
                            "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
                    return;
                }
            }
        }
        chain.doFilter(request, response);
    }

    private void notApproved(HttpServletResponse response) throws IOException {
        problems.write(response, HttpStatus.FORBIDDEN, "Không có quyền", "ACCOUNT_NOT_APPROVED",
                "Tài khoản của bạn chưa được Admin duyệt.");
    }
}
