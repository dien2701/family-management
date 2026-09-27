package vn.giapha.auth;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.ApprovalStatus;
import vn.giapha.auth.entity.SystemRole;
import vn.giapha.auth.entity.UserAccount;
import vn.giapha.auth.repository.UserAccountRepository;
import vn.giapha.auth.service.AccountLinking;
import vn.giapha.auth.service.RefreshTokenService;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.security.AccountAccessLookup;

/**
 * API công khai của module auth cho module khác (chủ yếu {@code member}). Chỉ trả bản sao chỉ-đọc, không lộ
 * entity hay trường bí mật.
 */
@Component
public class AuthFacade implements AccountAccessLookup {

    /**
     * Ảnh chụp tài khoản; {@code email} chỉ để module gọi quyết định có trả ra hay không.
     * {@code usable}: ACTIVE và đã được duyệt.
     */
    public record Account(Long id, String email, String fullName, String avatarUrl, boolean admin, Long memberId,
            boolean locked, boolean usable) {
    }

    private final UserAccountRepository users;
    private final RefreshTokenService refreshTokens;
    private final AccountLinking linking;

    AuthFacade(UserAccountRepository users, RefreshTokenService refreshTokens, AccountLinking linking) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.linking = linking;
    }

    /** Tài khoản ACTIVE hoặc LOCKED (không tính PENDING). Đọc từ DB nên vai trò và liên kết luôn mới nhất. */
    @Transactional(readOnly = true)
    public Optional<Account> find(Long userId) {
        return users.findById(userId).filter(u -> u.getStatus() != AccountStatus.PENDING).map(AuthFacade::toAccount);
    }

    /** Các tài khoản có id trong {@code userIds} (không tính PENDING); id không tồn tại thì bỏ qua. */
    @Transactional(readOnly = true)
    public List<Account> findAll(Collection<Long> userIds) {
        return users.findAllById(userIds).stream()
                .filter(u -> u.getStatus() != AccountStatus.PENDING)
                .map(AuthFacade::toAccount)
                .toList();
    }

    /** Thành viên này đã có tài khoản liên kết chưa. */
    @Transactional(readOnly = true)
    public boolean isMemberLinked(Long memberId) {
        return users.existsByMemberId(memberId);
    }

    /** Số tài khoản đang chờ Admin duyệt (dashboard, IDEA §6.8). */
    @Transactional(readOnly = true)
    public long pendingAccountCount() {
        return users.countByApprovalStatusAndStatusNot(ApprovalStatus.WAITING, AccountStatus.PENDING);
    }

    /**
     * Đọc tài khoản và khóa dòng ({@code FOR UPDATE}) cho tới hết transaction, để các thao tác về liên kết của cùng
     * một tài khoản chạy tuần tự. Phải gọi trong transaction.
     */
    @Transactional
    public Account lockAccount(Long userId) {
        return toAccount(lock(userId));
    }

    /**
     * Gán {@code memberId} cho tài khoản (DECISIONS #80): chỉ tài khoản ACTIVE + APPROVED, chưa liên kết, và thành viên
     * chưa có chủ. Lỗi 409 {@code INVALID_ACCOUNT_STATE}, {@code ACCOUNT_ALREADY_LINKED}, {@code MEMBER_ALREADY_LINKED}.
     * Việc thành viên có tồn tại hay không do người gọi kiểm.
     */
    @Transactional
    public Account linkMember(Long userId, Long memberId) {
        UserAccount user = lock(userId);
        linking.link(user, memberId);
        return toAccount(user);
    }

    /** Hủy liên kết của tài khoản; 409 {@code NOT_LINKED} khi chưa liên kết. */
    @Transactional
    public Account unlinkMember(Long userId) {
        UserAccount user = lock(userId);
        linking.unlink(user);
        return toAccount(user);
    }

    /** Gỡ liên kết của thành viên sắp bị xóa khỏi mọi tài khoản; tài khoản vẫn còn. */
    @Transactional
    public void detachMember(Long memberId) {
        users.clearMember(memberId);
    }

    /** Đọc thẳng DB cho {@code ApprovalGateFilter}: khóa và từ chối có hiệu lực ngay với thao tác ghi. */
    @Override
    @Transactional(readOnly = true)
    public Access accessOf(Long userId) {
        return users.findById(userId).map(u -> {
            if (u.getStatus() == AccountStatus.LOCKED) {
                return Access.LOCKED;
            }
            return u.isActiveAndApproved() ? Access.OK : Access.NOT_APPROVED;
        }).orElse(Access.GONE);
    }

    /** Thu hồi mọi refresh token: buộc đăng nhập lại để claim trong token khớp với thay đổi vừa xảy ra. */
    @Transactional
    public void revokeSessions(Long userId) {
        refreshTokens.revokeAll(userId);
    }

    private UserAccount lock(Long userId) {
        return users.findByIdForUpdate(userId)
                .filter(u -> u.getStatus() != AccountStatus.PENDING)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND",
                        "Không tìm thấy tài khoản này."));
    }

    private static Account toAccount(UserAccount u) {
        return new Account(u.getId(), u.getEmail(), u.getFullName(), u.getAvatarUrl(),
                u.getSystemRole() == SystemRole.ADMIN, u.getMemberId(), u.getStatus() == AccountStatus.LOCKED,
                u.isActiveAndApproved());
    }
}
