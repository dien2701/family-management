package vn.giapha.auth.service;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.RefreshToken;
import vn.giapha.auth.entity.UserAccount;
import vn.giapha.auth.repository.RefreshTokenRepository;
import vn.giapha.auth.repository.UserAccountRepository;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.util.Hashing;
import vn.giapha.config.AppProperties;

/**
 * Refresh token 30 ngày, xoay vòng sau mỗi lần dùng (DECISIONS #17). Chuỗi thô chỉ tồn tại trong cookie;
 * DB lưu SHA-256. Đổi/đặt lại mật khẩu, khóa tài khoản, rời family gọi {@link #revokeAll(Long)}.
 */
@Service
public class RefreshTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    /** Kết quả xoay vòng: tài khoản chủ token và chuỗi refresh token mới (thô). */
    public record Rotated(UserAccount user, String newToken) {
    }

    private final RefreshTokenRepository repository;
    private final UserAccountRepository users;
    private final AppProperties props;
    private final Clock clock;

    RefreshTokenService(RefreshTokenRepository repository, UserAccountRepository users, AppProperties props,
            Clock clock) {
        this.repository = repository;
        this.users = users;
        this.props = props;
        this.clock = clock;
    }

    /** Tạo refresh token mới cho user; trả chuỗi thô để đặt vào cookie. */
    @Transactional
    public String issue(Long userId) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant now = Instant.now(clock);
        repository.save(new RefreshToken(userId, Hashing.sha256Hex(raw), now.plus(props.auth().refreshTtl()), now));
        return raw;
    }

    /**
     * Đổi token cũ lấy token mới. Token không có, hết hạn hoặc đã dùng thì từ chối.
     * Việc thu hồi là câu UPDATE có điều kiện nên chỉ một trong hai request song song thành công.
     * Không rollback khi từ chối, để việc thu hồi token của tài khoản không còn ACTIVE được giữ lại.
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public Rotated rotate(String rawToken) {
        RefreshToken token = find(rawToken);
        if (token == null || token.isRevoked() || !token.getExpiresAt().isAfter(Instant.now(clock))) {
            throw invalid();
        }
        UserAccount user = users.findById(token.getUserId()).orElseThrow(RefreshTokenService::invalid);
        if (user.getStatus() != AccountStatus.ACTIVE) {
            repository.revokeAllOfUser(user.getId());
            throw invalid();
        }
        if (repository.revokeIfActive(token.getId()) == 0) {
            throw invalid();
        }
        return new Rotated(user, issue(user.getId()));
    }

    /** Thu hồi một token (đăng xuất). Token không tồn tại thì bỏ qua. */
    @Transactional
    public void revoke(String rawToken) {
        RefreshToken token = find(rawToken);
        if (token != null) {
            repository.revokeIfActive(token.getId());
        }
    }

    @Transactional
    public void revokeAll(Long userId) {
        repository.revokeAllOfUser(userId);
    }

    /** Dọn token đã hết hạn (chạy trong job hằng ngày). */
    @Transactional
    public int purgeExpired() {
        return repository.deleteExpiredBefore(Instant.now(clock));
    }

    private RefreshToken find(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return null;
        }
        return repository.findByTokenHash(Hashing.sha256Hex(rawToken)).orElse(null);
    }

    private static BusinessException invalid() {
        return new BusinessException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN",
                "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
}
