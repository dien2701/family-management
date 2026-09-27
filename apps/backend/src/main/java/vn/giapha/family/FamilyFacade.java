package vn.giapha.family;

import java.util.Optional;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.AuthFacade;
import vn.giapha.common.security.CurrentUser;

/**
 * API công khai của module family cho module khác: đọc {@code familyId} và vai trò của một tài khoản từ DB
 * (không dùng claim trong token, vì claim có thể cũ tới 15 phút).
 */
@Component
public class FamilyFacade {

    /** Tư cách thành viên; {@code role} là {@code MANAGER} hoặc {@code MEMBER}. */
    public record Membership(Long familyId, String role) {

        public boolean isManager() {
            return CurrentUser.ROLE_MANAGER.equals(role);
        }
    }

    private final AuthFacade auth;

    FamilyFacade(AuthFacade auth) {
        this.auth = auth;
    }

    /** Rỗng nếu tài khoản không tồn tại, chưa xác thực hoặc chưa thuộc family nào. */
    @Transactional(readOnly = true)
    public Optional<Membership> membershipOf(Long userId) {
        return auth.find(userId)
                .filter(a -> a.familyId() != null)
                .map(a -> new Membership(a.familyId(), a.familyRole()));
    }

    @Transactional(readOnly = true)
    public boolean isManagerOf(Long userId, Long familyId) {
        return auth.isManagerOf(userId, familyId);
    }

    /** Tài khoản ACTIVE thuộc đúng family (dùng cho kiểm tra cách ly family ở module khác). */
    @Transactional(readOnly = true)
    public boolean isActiveMemberOf(Long userId, Long familyId) {
        return auth.isActiveMemberOf(userId, familyId);
    }
}
