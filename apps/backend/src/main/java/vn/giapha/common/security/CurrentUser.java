package vn.giapha.common.security;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Người dùng hiện tại, đọc từ claim của access token: {@code sub}, {@code sysRole}, {@code approval},
 * {@code familyId}, {@code familyRole}, {@code memberId}. Claim chỉ mới sau lần refresh gần nhất (tối đa 15 phút),
 * nên thao tác ghi và thao tác quản trị phải kiểm lại vai trò/duyệt từ DB.
 * {@code familyId} luôn lấy từ đây, không tin giá trị client gửi lên.
 */
public record CurrentUser(Long userId, String systemRole, String approval, Long familyId, String familyRole,
        Long memberId) {

    public static final String CLAIM_SYSTEM_ROLE = "sysRole";
    public static final String CLAIM_APPROVAL = "approval";
    public static final String CLAIM_FAMILY_ID = "familyId";
    public static final String CLAIM_FAMILY_ROLE = "familyRole";
    public static final String CLAIM_MEMBER_ID = "memberId";

    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_MANAGER = "MANAGER";
    public static final String APPROVAL_APPROVED = "APPROVED";

    public boolean isAdmin() {
        return ROLE_ADMIN.equals(systemRole);
    }

    /** Theo claim, có thể cũ tới 15 phút. */
    public boolean isApproved() {
        return APPROVAL_APPROVED.equals(approval);
    }

    public boolean isManager() {
        return ROLE_MANAGER.equals(familyRole);
    }

    public boolean hasFamily() {
        return familyId != null;
    }

    public static CurrentUser from(Jwt jwt) {
        return new CurrentUser(
                Long.valueOf(jwt.getSubject()),
                jwt.getClaimAsString(CLAIM_SYSTEM_ROLE),
                jwt.getClaimAsString(CLAIM_APPROVAL),
                asLong(jwt, CLAIM_FAMILY_ID),
                jwt.getClaimAsString(CLAIM_FAMILY_ROLE),
                asLong(jwt, CLAIM_MEMBER_ID));
    }

    /** Lấy người dùng của request hiện tại; ném lỗi xác thực nếu chưa đăng nhập. */
    public static CurrentUser get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            return from(jwt);
        }
        throw new AuthenticationCredentialsNotFoundException("Chưa đăng nhập");
    }

    private static Long asLong(Jwt jwt, String claim) {
        Object v = jwt.getClaim(claim);
        return v instanceof Number n ? Long.valueOf(n.longValue()) : null;
    }
}
