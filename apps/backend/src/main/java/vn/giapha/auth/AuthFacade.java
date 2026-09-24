package vn.giapha.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.FamilyRole;
import vn.giapha.auth.entity.SystemRole;
import vn.giapha.auth.entity.UserAccount;
import vn.giapha.auth.repository.UserAccountRepository;
import vn.giapha.auth.service.RefreshTokenService;

/**
 * API công khai của module auth cho module khác (chủ yếu {@code family}). Chỉ trả bản sao chỉ-đọc, không lộ
 * entity hay trường bí mật; vai trò trao đổi dạng chuỗi ({@code MANAGER} / {@code MEMBER}).
 */
@Component
public class AuthFacade {

    /** Ảnh chụp tài khoản; {@code email} chỉ để module gọi quyết định có trả ra hay không. */
    public record Account(Long id, String email, String fullName, String avatarUrl, boolean admin,
            Long familyId, String familyRole, Long memberId, boolean locked) {
    }

    private final UserAccountRepository users;
    private final RefreshTokenService refreshTokens;

    AuthFacade(UserAccountRepository users, RefreshTokenService refreshTokens) {
        this.users = users;
        this.refreshTokens = refreshTokens;
    }

    /** Tài khoản ACTIVE hoặc LOCKED (không tính PENDING). */
    @Transactional(readOnly = true)
    public Optional<Account> find(Long userId) {
        return users.findById(userId).filter(u -> u.getStatus() != AccountStatus.PENDING).map(AuthFacade::toAccount);
    }

    @Transactional(readOnly = true)
    public List<Account> findByFamily(Long familyId) {
        return users.findByFamilyId(familyId).stream().map(AuthFacade::toAccount).toList();
    }

    /** Đọc thẳng DB (không dùng bản đã nạp trong phiên), để kiểm quyền chính xác sau khi đã khóa family. */
    @Transactional(readOnly = true)
    public boolean isManagerOf(Long userId, Long familyId) {
        return users.existsByIdAndFamilyIdAndFamilyRole(userId, familyId, FamilyRole.MANAGER);
    }

    /** Tài khoản đang ACTIVE và thuộc đúng family này. */
    @Transactional(readOnly = true)
    public boolean isActiveMemberOf(Long userId, Long familyId) {
        return users.existsByIdAndFamilyIdAndStatus(userId, familyId, AccountStatus.ACTIVE);
    }

    /** @return false nếu tài khoản đã thuộc một family, không hoạt động hoặc là Admin (Admin không thuộc family nào). */
    @Transactional
    public boolean assignFamily(Long userId, Long familyId, String role) {
        return users.assignFamily(userId, familyId, FamilyRole.valueOf(role)) == 1;
    }

    /** Gỡ tài khoản khỏi family và gỡ liên kết member; @return false nếu tài khoản không thuộc family đó. */
    @Transactional
    public boolean clearFamily(Long userId, Long familyId) {
        return users.clearFamily(userId, familyId) == 1;
    }

    @Transactional
    public boolean changeFamilyRole(Long userId, Long familyId, String role) {
        return users.updateFamilyRole(userId, familyId, FamilyRole.valueOf(role)) == 1;
    }

    /** Thu hồi mọi refresh token: buộc đăng nhập lại để claim trong token khớp với thay đổi vừa xảy ra. */
    @Transactional
    public void revokeSessions(Long userId) {
        refreshTokens.revokeAll(userId);
    }

    private static Account toAccount(UserAccount u) {
        return new Account(u.getId(), u.getEmail(), u.getFullName(), u.getAvatarUrl(),
                u.getSystemRole() == SystemRole.ADMIN, u.getFamilyId(),
                u.getFamilyRole() == null ? null : u.getFamilyRole().name(), u.getMemberId(),
                u.getStatus() == AccountStatus.LOCKED);
    }
}
